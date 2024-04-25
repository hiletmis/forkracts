import { deployments, network, run } from 'hardhat';

import {
  chainsSupportedByDapis,
} from '../data/chain-support.json';
import managerMultisigAddresses from '../data/manager-multisig.json';

module.exports = async () => {

  if (Object.keys(managerMultisigAddresses).includes(network.name)) {

    if (chainsSupportedByDapis.includes(network.name)) {
      const mockContract = 'Contract5'

      const Contract = await deployments.get(mockContract);
      await run('verify:verify', {
        address: Contract.address,
        constructorArguments: [],
      });


    }
  } else {
    throw new Error(`${network.name} is not supported`);
  }
};
module.exports.tags = ['verify'];
