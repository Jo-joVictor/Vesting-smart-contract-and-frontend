// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NexoraToken} from "../../src/NexoraToken.sol";
import {NexoraStaking} from "../../src/NexoraStaking.sol";

contract NexoraStakingTest is Test {
    NexoraToken internal token;
    NexoraStaking internal staking;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant REWARD = 250_000 ether;
    uint256 internal constant DURATION = 7 days;

    function setUp() public {
        token = new NexoraToken(owner);
        staking = new NexoraStaking(address(token), owner, DURATION);

        vm.startPrank(owner);
        token.transfer(address(staking), REWARD);
        token.transfer(alice, 1_000_000 ether);
        token.transfer(bob, 1_000_000 ether);
        staking.notifyRewardAmount(REWARD);
        vm.stopPrank();

        vm.prank(alice);
        token.approve(address(staking), type(uint256).max);

        vm.prank(bob);
        token.approve(address(staking), type(uint256).max);
    }

    function test_Stake() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        assertEq(staking.balances(alice), 1_000 ether);
        assertEq(staking.totalStaked(), 1_000 ether);
    }

    function test_Withdraw() public {
        vm.startPrank(alice);
        staking.stake(1_000 ether);
        staking.withdraw(400 ether);
        vm.stopPrank();

        assertEq(staking.balances(alice), 600 ether);
        assertEq(staking.totalStaked(), 600 ether);
    }

    function test_RevertInsufficientStake() public {
        vm.prank(alice);
        vm.expectRevert(NexoraStaking.InsufficientStake.selector);
        staking.withdraw(1 ether);
    }

    function test_EarnRewards() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.warp(block.timestamp + 1 days);

        uint256 expected = REWARD / 7;
        uint256 actual = staking.earned(alice);

        assertApproxEqAbs(actual, expected, 1e15);
    }

    function test_ClaimReward() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.warp(block.timestamp + 1 days);

        uint256 beforeBalance = token.balanceOf(alice);

        vm.prank(alice);
        staking.getReward();

        assertGt(token.balanceOf(alice), beforeBalance);
        assertEq(staking.earned(alice), 0);
    }

    function test_TwoStakersDifferentEntryTimes() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.warp(block.timestamp + DURATION / 2);

        vm.prank(bob);
        staking.stake(1_000 ether);

        vm.warp(staking.periodFinish());

        uint256 aliceReward = staking.earned(alice);
        uint256 bobReward = staking.earned(bob);

        assertApproxEqAbs(aliceReward, 187_500 ether, 1e15);
        assertApproxEqAbs(bobReward, 62_500 ether, 1e15);
    }

    function test_Exit() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.warp(block.timestamp + 1 days);

        vm.prank(alice);
        staking.exit();

        assertEq(staking.balances(alice), 0);
        assertEq(staking.totalStaked(), 0);
        assertGt(token.balanceOf(alice), 999_000 ether);
    }

    function test_RevertInsufficientRewardFunding() public {
        vm.prank(owner);

        vm.expectRevert(NexoraStaking.InsufficientRewardBalance.selector);

        staking.notifyRewardAmount(1_000_000 ether);
    }

    function test_PauseBlocksStaking() public {
        vm.prank(owner);
        staking.pause();

        vm.prank(alice);
        vm.expectRevert();
        staking.stake(1_000 ether);
    }

    function test_WithdrawWorksWhenPaused() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.prank(owner);
        staking.pause();

        vm.prank(alice);
        staking.withdraw(1_000 ether);

        assertEq(staking.balances(alice), 0);
    }

    function test_ClaimWorksWhenPaused() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.warp(block.timestamp + 1 days);

        vm.prank(owner);
        staking.pause();

        vm.prank(alice);
        staking.getReward();

        assertEq(staking.earned(alice), 0);
    }

    function test_APR() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        assertGt(staking.aprBps(), 0);
    }

    function test_CannotReuseCommittedRewards() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.warp(block.timestamp + 3 days);

        // The owner attempts to start another reward period
        // without transferring additional reward tokens.
        vm.prank(owner);

        vm.expectRevert(NexoraStaking.InsufficientRewardBalance.selector);

        staking.notifyRewardAmount(250_000 ether);
    }

    function test_RenewRewardPeriodWithFunding() public {
        vm.prank(alice);
        staking.stake(1_000 ether);

        vm.warp(block.timestamp + 3 days);

        vm.startPrank(owner);

        token.transfer(address(staking), 250_000 ether);
        staking.notifyRewardAmount(250_000 ether);

        vm.stopPrank();

        assertGt(staking.rewardRate(), 0);
        assertEq(staking.periodFinish(), block.timestamp + 7 days);
        assertEq(staking.totalRewardsCommitted(), 500_000 ether);
    }
}
