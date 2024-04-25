
import { hardhatConfig } from '@api3/chains';
import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import 'dotenv/config';
import { task } from 'hardhat/config';

const config: HardhatUserConfig = {
  etherscan: hardhatConfig.etherscan(),
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    outputFile: 'gas_report',
    noColors: true,
  },
  mocha: {
    timeout: process.env.EXTENDED_TEST ? 60 * 60_000 : 60_000,
  },
  networks: hardhatConfig.networks(),
  paths: {
    tests: process.env.EXTENDED_TEST ? './test-extended' : './test',
  },
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};

task(
  'compile',
  'Compiles the entire project, building all artifacts, and overwrites contract metadata hash for consistent deterministic deployment addresses',

);

// eslint-disable-next-line import/no-default-export
export default config;
