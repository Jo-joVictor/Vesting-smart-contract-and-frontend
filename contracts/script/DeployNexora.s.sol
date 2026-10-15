// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NexoraToken} from "../src/NexoraToken.sol";
import {NexoraPresale} from "../src/NexoraPresale.sol";
import {NexoraVesting} from "../src/NexoraVesting.sol";
import {NexoraStaking} from "../src/NexoraStaking.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        
        console.log("Deploying contracts with deployer:", deployer);
        console.log("Treasury address receiving token supply:", treasury);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy NexoraToken
        NexoraToken token = new NexoraToken(treasury);
        console.log("NexoraToken deployed at:", address(token));

        // 2. Configure Presale Parameters (Soft cap: 0.10 ETH, Hard cap: 0.25 ETH)
        uint256[3] memory allocations = [uint256(40_000_000 * 1e18), uint256(15_000_000 * 1e18), uint256(15_000_000 * 1e18)];
        uint256[3] memory prices = [
            uint256(1_000_000_000),
            uint256(5_000_000_000),
            uint256(9_000_000_000)
        ];
        
        uint256 startTime = block.timestamp + 2 minutes;
        uint256 duration = 48 hours;
        uint256 softCap = 0.10 ether;
        uint256 hardCap = 0.25 ether;
        uint256 minContribution = 0.005 ether;
        uint256 maxContribution = 0.10 ether;

        NexoraPresale presale = new NexoraPresale(
            deployer,
            allocations,
            prices,
            startTime,
            duration,
            softCap,
            hardCap,
            minContribution,
            maxContribution
        );
        console.log("NexoraPresale deployed at:", address(presale));

        // 3. Deploy Vesting
        uint256 tgeUnlockBps = 2000; // 20%
        uint256 cliffDuration = 1 hours;
        uint256 linearDuration = 4 days;
        uint256 totalPresaleAllocation = 70_000_000 * 1e18;

        NexoraVesting vesting = new NexoraVesting(
            address(token),
            address(presale),
            deployer,
            tgeUnlockBps,
            cliffDuration,
            linearDuration,
            totalPresaleAllocation
        );
        console.log("NexoraVesting deployed at:", address(vesting));

        // 4. Deploy Staking
        uint256 rewardsDuration = 7 days;
        NexoraStaking staking = new NexoraStaking(
            address(token),
            deployer,
            rewardsDuration
        );
        console.log("NexoraStaking deployed at:", address(staking));

        vm.stopBroadcast();

        console.log("--- IMPORTANT ---");
        console.log("Tokens were minted to the Treasury. Please transfer:");
        console.log("-", totalPresaleAllocation / 1e18, "NXR to Vesting contract:", address(vesting));
        console.log("- 250,000 NXR to Staking contract (and call notifyRewardAmount):", address(staking));
    }
}