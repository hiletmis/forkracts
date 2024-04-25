import * as fs from 'node:fs';
import * as path from 'node:path';

import type { AddressLike } from 'ethers';

module.exports = () => {
  const references: Record<string, Record<string, AddressLike>> = {};
  const deploymentBlockNumbers: Record<string, Record<string, number>> = {};

  fs.writeFileSync(path.join('deployments', 'addresses.json'), `${JSON.stringify(references, null, 2)}\n`);
  fs.writeFileSync(
    path.join('deployments', 'block-numbers.json'),
    `${JSON.stringify(deploymentBlockNumbers, null, 2)}\n`
  );
};
module.exports.tags = ['document'];
