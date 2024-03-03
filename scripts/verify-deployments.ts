// Even though hardhat-etherscan claims to also verify the deployment locally,
// it doesn't expose that as a command. As a result, you can't verify deployments
// on chains at which there is no supported block explorer. This is an alternative
// that fetches the deployed bytecode from a chain and compares that with the output
// of the local compilation.

import * as fs from 'node:fs';
import * as path from 'node:path';

import { go } from '@api3/promise-utils';
import { config, deployments, ethers } from 'hardhat';

import { chainsSupportedByDapis, chainsSupportedByOevAuctions } from '../data/chain-support.json';
import managerMultisigAddresses from '../data/manager-multisig.json';

const METADATA_HASH_LENGTH = 53 * 2;
// https://github.com/Arachnid/deterministic-deployment-proxy/tree/be3c5974db5028d502537209329ff2e730ed336c#proxy-address
const CREATE2_FACTORY_ADDRESS = '0x4e59b44847b379578588920cA78FbF26c0B4956C';

async function main() {
  const networks = process.env.NETWORK
    ? [process.env.NETWORK]
    : new Set([...chainsSupportedByDapis, ...chainsSupportedByOevAuctions]);

  for (const network of networks) {
    // TODO: Remove after the chains are removed
    if (['base-goerli-testnet', 'scroll-goerli-testnet'].includes(network)) continue;

    const provider = new ethers.JsonRpcProvider((config.networks[network] as any).url);
    const contractNames = [
      ...(Object.keys(managerMultisigAddresses).includes(network) ? ['OwnableCallForwarder'] : []),
      ...(chainsSupportedByDapis.includes(network)
        ? ['AccessControlRegistry', 'OwnableCallForwarder', 'Api3ServerV1', 'ProxyFactory']
        : []),
      ...(chainsSupportedByOevAuctions.includes(network) ? ['OevAuctionHouse'] : []),
    ];

    for (const contractName of contractNames) {
      const deployment = JSON.parse(fs.readFileSync(path.join('deployments', network, `${contractName}.json`), 'utf8'));
      const artifact = await deployments.getArtifact(contractName);
      const constructor = artifact.abi.find((method) => method.type === 'constructor');
      const expectedEncodedConstructorArguments = constructor
        ? ethers.AbiCoder.defaultAbiCoder().encode(
            constructor.inputs.map((input: any) => input.type),
            deployment.args
          )
        : '0x';
      const salt = ethers.ZeroHash;
      const expectedDeterministicDeploymentAddress = ethers.getCreate2Address(
        CREATE2_FACTORY_ADDRESS,
        salt,
        ethers.solidityPackedKeccak256(['bytes', 'bytes'], [artifact.bytecode, expectedEncodedConstructorArguments])
      );

      if (deployment.address === expectedDeterministicDeploymentAddress) {
        const goFetchContractCode = await go(async () => provider.getCode(deployment.address), {
          retries: 5,
          attemptTimeoutMs: 10_000,
          totalTimeoutMs: 50_000,
          delay: {
            type: 'random',
            minDelayMs: 2000,
            maxDelayMs: 5000,
          },
        });
        if (!goFetchContractCode.success || !goFetchContractCode.data) {
          throw new Error(`${network} ${contractName} (deterministic) contract code could not be fetched`);
        }
        if (goFetchContractCode.data === '0x') {
          throw new Error(`${network} ${contractName} (deterministic) contract code does not exist`);
        }
      } else {
        const goFetchCreationTx = await go(async () => provider.getTransaction(deployment.transactionHash), {
          retries: 5,
          attemptTimeoutMs: 10_000,
          totalTimeoutMs: 50_000,
          delay: {
            type: 'random',
            minDelayMs: 2000,
            maxDelayMs: 5000,
          },
        });
        if (!goFetchCreationTx.success || !goFetchCreationTx.data) {
          throw new Error(`${network} ${contractName} creation tx could not be fetched`);
        }
        const creationTx: any = goFetchCreationTx.data;
        const creationData = creationTx.data;

        if (deployment.address !== ethers.getCreateAddress(creationTx)) {
          throw new Error(`${network} ${contractName} creation tx deployment address does not match`);
        }

        const creationBytecode = creationData.slice(0, artifact.bytecode.length);
        const creationBytecodeWithoutMetadataHash = creationBytecode.slice(0, -METADATA_HASH_LENGTH);
        const creationMetadataHash = `0x${creationBytecode.slice(-METADATA_HASH_LENGTH)}`;
        const creationEncodedConstructorArguments = `0x${creationData.slice(creationBytecode.length)}`;

        const expectedCreationBytecode = artifact.bytecode;
        const expectedBytecodeWithoutMetadataHash = expectedCreationBytecode.slice(0, -METADATA_HASH_LENGTH);
        const expectedMetadataHash = `0x${expectedCreationBytecode.slice(-METADATA_HASH_LENGTH)}`;

        if (creationBytecodeWithoutMetadataHash !== expectedBytecodeWithoutMetadataHash) {
          throw new Error(`${network} ${contractName} deployment bytecode does not match`);
        }
        if (creationMetadataHash !== expectedMetadataHash) {
          // eslint-disable-next-line no-console
          console.log(`${network} ${contractName} deployment metadata hash does not match`);
        }
        if (creationEncodedConstructorArguments !== expectedEncodedConstructorArguments) {
          throw new Error(`${network} ${contractName} deployment constructor arguments do not match`);
        }
      }
    }
  }
}

/* eslint-disable */
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
