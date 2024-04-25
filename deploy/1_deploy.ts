import { deployments, ethers, network } from 'hardhat';

import { chainsSupportedByDapis } from '../data/chain-support.json';
import managerMultisigAddresses from '../data/manager-multisig.json';

module.exports = async () => {
  const { deploy, log } = deployments;
  const [deployer] = await ethers.getSigners();

  if (Object.keys(managerMultisigAddresses).includes(network.name)) {
    const mockContract = 'Contract5';
    if (chainsSupportedByDapis.includes(network.name)) {
      await deployments.get(mockContract).catch(async () => {
        log(`Deploying ${mockContract}...`);
        return deploy(mockContract, {
          from: deployer!.address,
          log: true,
          deterministicDeployment: process.env.DETERMINISTIC ? ethers.ZeroHash : '',
        });
      });
    }
  } else {
    throw new Error(`${network.name} is not supported`);
  }
};
module.exports.tags = ['deploy'];
