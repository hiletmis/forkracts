import { deployments, network, run } from 'hardhat';

import { chainsSupportedByDapis } from '../data/chain-support.json';

module.exports = async () => {
  if (chainsSupportedByDapis.includes(network.name)) {
    const mockContract = 'Contract5';

    const Contract = await deployments.get(mockContract);
    await run('verify:verify', {
      address: Contract.address,
      constructorArguments: [],
    });
  }
};
module.exports.tags = ['verify'];
