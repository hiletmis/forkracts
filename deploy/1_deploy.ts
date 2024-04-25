import { deployments, ethers, network } from 'hardhat';

import { chainsSupportedByDapis } from '../data/chain-support.json';

module.exports = async () => {
  const { deploy, log } = deployments;
  const [deployer] = await ethers.getSigners();

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
};
module.exports.tags = ['deploy'];
