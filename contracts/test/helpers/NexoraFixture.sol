// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {NexoraToken} from "../../src/NexoraToken.sol";
import {NexoraPresale} from "../../src/NexoraPresale.sol";
import {NexoraVesting} from "../../src/NexoraVesting.sol";
import {NexoraStaking} from "../../src/NexoraStaking.sol";

abstract contract NexoraFixture is Test {
    NexoraToken internal token;
    NexoraPresale internal presale;
    NexoraVesting internal vesting;
    NexoraStaking internal staking;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal treasury = makeAddr("treasury");

    uint256 internal start;

    uint256 internal constant PRESALE_ALLOCATION = 40_000_000 ether;
    uint256 internal constant STAKING_REWARD = 250_000 ether;

    uint256 internal constant SOFT_CAP = 0.000128 ether;
    uint256 internal constant HARD_CAP = 0.0004 ether;
    uint256 internal constant MIN_CONTRIBUTION = 640_000_000_000;
    uint256 internal constant MAX_CONTRIBUTION = 0.000128 ether;

    uint256 internal constant TGE_UNLOCK_BPS = 2_000;
    uint256 internal constant CLIFF = 1 hours;
    uint256 internal constant VESTING_DURATION = 4 days;

    function _deployFixture() internal {
        vm.warp(1_800_000_000);

        token = new NexoraToken(treasury);

        uint256[3] memory allocations =
            [uint256(10_000_000 ether), uint256(15_000_000 ether), uint256(15_000_000 ether)];

        uint256[3] memory prices = [uint256(6_400_000), uint256(9_600_000), uint256(12_800_000)];

        start = block.timestamp + 10 minutes;

        presale = new NexoraPresale(
            owner, allocations, prices, start, 48 hours, SOFT_CAP, HARD_CAP, MIN_CONTRIBUTION, MAX_CONTRIBUTION
        );

        vesting = new NexoraVesting(
            address(token), address(presale), owner, TGE_UNLOCK_BPS, CLIFF, VESTING_DURATION, PRESALE_ALLOCATION
        );

        staking = new NexoraStaking(address(token), owner, 7 days);

        vm.startPrank(treasury);

        token.transfer(address(vesting), PRESALE_ALLOCATION);
        token.transfer(address(staking), STAKING_REWARD);

        vm.stopPrank();

        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }

    function _startSale() internal {
        vm.warp(start);
    }

    function _buy(address buyer, uint256 amount) internal {
        vm.prank(buyer);
        presale.buy{value: amount}(0);
    }

    function _finalizeSuccessfulSale() internal {
        _startSale();

        _buy(alice, SOFT_CAP);

        vm.warp(presale.endTime());
        presale.finalize();

        assertTrue(presale.finalized());
        assertTrue(presale.successful());
    }

    function _activateStakingRewards() internal {
        vm.prank(owner);
        staking.notifyRewardAmount(STAKING_REWARD);
    }
}
