// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";

import {NexoraToken} from "../../src/NexoraToken.sol";
import {NexoraStaking} from "../../src/NexoraStaking.sol";
import {StakingHandler} from "./handlers/StakingHandler.sol";

contract StakingInvariantTest is StdInvariant, Test {
    NexoraToken internal token;
    NexoraStaking internal staking;
    StakingHandler internal handler;

    address internal owner = makeAddr("owner");

    function setUp() public {
        token = new NexoraToken(owner);

        staking = new NexoraStaking(address(token), owner, 7 days);

        vm.startPrank(owner);

        token.transfer(address(staking), 250_000 ether);

        for (uint256 i; i < 5; ++i) {
            address user = makeAddr(string.concat("staker", vm.toString(i)));

            token.transfer(user, 1_000_000 ether);
        }

        staking.notifyRewardAmount(250_000 ether);

        vm.stopPrank();

        handler = new StakingHandler(token, staking);
        targetContract(address(handler));
    }

    function invariant_PrincipalIsAlwaysBacked() public view {
        assertGe(token.balanceOf(address(staking)), staking.totalStaked());
    }

    function invariant_PrincipalAndRewardsAreBacked() public view {
        uint256 outstandingRewards = staking.totalRewardsCommitted() - staking.totalRewardsPaid();

        assertGe(token.balanceOf(address(staking)), staking.totalStaked() + outstandingRewards);
    }

    function invariant_TotalRewardsPaidNeverExceedsCommitted() public view {
        assertLe(staking.totalRewardsPaid(), staking.totalRewardsCommitted());
    }
}
