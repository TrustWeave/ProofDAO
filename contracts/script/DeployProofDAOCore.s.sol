// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ProofDAOCore.sol";

contract DeployProofDAOCore is Script {
    function run() external {
        vm.startBroadcast();

        ProofDAOCore core = new ProofDAOCore();

        console.log("ProofDAOCore deployed at:", address(core));

        vm.stopBroadcast();
    }
}
