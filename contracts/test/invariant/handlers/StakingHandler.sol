// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NexoraToken} from "../../../src/NexoraToken.sol";
import {NexoraStaking} from "../../../src/NexoraStaking.sol";

contract StakingHandler is Test {
    NexoraToken public token;
    NexoraStaking public staking;

    address[] public users;

    constructor(NexoraToken token_, NexoraStaking staking_) {
        token = token_;
        staking = staking_;

        for (uint256 i; i < 5; ++i) {
            users.push(makeAddr(string.concat("staker", vm.toString(i))));
        }
    }

    function stake(uint256 userSeed, uint256 amountSeed) external {
        address user = users[userSeed % users.length];

        uint256 balance = token.balanceOf(user);
        if (balance == 0) return;

        uint256 amount = bound(amountSeed, 1, balance);

        vm.startPrank(user);
        token.approve(address(staking), amount);

        try staking.stake(amount) {} catch {}

        vm.stopPrank();
    }

    function withdraw(uint256 userSeed, uint256 amountSeed) external {
        address user = users[userSeed % users.length];

        uint256 balance = staking.balances(user);
        if (balance == 0) return;

        uint256 amount = bound(amountSeed, 1, balance);

        vm.prank(user);
        try staking.withdraw(amount) {} catch {}
    }

    function claim(uint256 userSeed) external {
        address user = users[userSeed % users.length];

        vm.prank(user);
        try staking.getReward() {} catch {}
    }

    function advanceTime(uint256 secondsSeed) external {
        uint256 secondsToAdvance = bound(secondsSeed, 1, 1 days);
        vm.warp(block.timestamp + secondsToAdvance);
    }
}
