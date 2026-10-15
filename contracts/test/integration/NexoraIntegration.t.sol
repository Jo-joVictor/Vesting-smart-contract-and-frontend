// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {NexoraToken} from "../../src/NexoraToken.sol";
import {NexoraPresale} from "../../src/NexoraPresale.sol";
import {NexoraVesting} from "../../src/NexoraVesting.sol";
import {NexoraStaking} from "../../src/NexoraStaking.sol";

contract NexoraIntegrationTest is Test {
    NexoraToken internal token;
    NexoraPresale internal presale;
    NexoraVesting internal vesting;
    NexoraStaking internal staking;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal start;

    function setUp() public {
        token = new NexoraToken(owner);

        uint256[3] memory allocations =
            [uint256(10_000_000 ether), uint256(15_000_000 ether), uint256(15_000_000 ether)];

        uint256[3] memory prices = [uint256(6_400_000), uint256(9_600_000), uint256(12_800_000)];

        start = block.timestamp + 10 minutes;

        presale = new NexoraPresale(
            owner, allocations, prices, start, 48 hours, 0.000128 ether, 0.0004 ether, 640_000_000_000, 0.000128 ether
        );

        vesting = new NexoraVesting(address(token), address(presale), owner, 2_000, 1 hours, 4 days, 40_000_000 ether);

        staking = new NexoraStaking(address(token), owner, 7 days);

        vm.startPrank(owner);

        token.transfer(address(vesting), 40_000_000 ether);
        token.transfer(address(staking), 250_000 ether);
        staking.notifyRewardAmount(250_000 ether);

        vm.stopPrank();

        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }

    function test_CompleteLaunchLifecycle() public {
        // 1. Presale begins
        vm.warp(start);

        // 2. Alice purchases 5 million NXR
        vm.prank(alice);
        presale.buy{value: 0.000032 ether}(0);

        assertEq(presale.purchased(alice), 5_000_000 ether);

        // 3. Bob contributes enough to reach the soft cap
        vm.prank(bob);
        presale.buy{value: 0.000096 ether}(0);

        assertEq(presale.totalRaised(), 0.000128 ether);

        // 4. Sale ends and is finalized
        vm.warp(presale.endTime());
        presale.finalize();

        assertTrue(presale.successful());

        // 5. Alice claims her 20% TGE allocation
        vm.prank(alice);
        vesting.claim();

        assertEq(token.balanceOf(alice), 1_000_000 ether);

        // 6. Alice approves staking
        vm.prank(alice);
        token.approve(address(staking), 1_000_000 ether);

        // 7. Alice stakes her unlocked NXR
        vm.prank(alice);
        staking.stake(1_000_000 ether);

        assertEq(staking.balances(alice), 1_000_000 ether);

        // 8. Advance one day
        vm.warp(block.timestamp + 1 days);

        uint256 pendingReward = staking.earned(alice);
        assertGt(pendingReward, 0);

        // 9. Alice claims staking rewards
        vm.prank(alice);
        staking.getReward();

        assertGt(token.balanceOf(alice), 0);

        // 10. Alice exits the staking pool
        vm.prank(alice);
        staking.exit();

        assertEq(staking.balances(alice), 0);
        assertEq(staking.totalStaked(), 0);

        // 11. Verify principal was returned
        assertGe(token.balanceOf(alice), 1_000_000 ether);
    }
}
