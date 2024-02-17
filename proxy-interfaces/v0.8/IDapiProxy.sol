// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDapiProxy {
    function api3ServerV1() external view returns (address);

    function dapiNameHash() external view returns (bytes32);

    function read() external view returns (int224 value, uint32 timestamp);
}
