// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NexoraFixture} from "../helpers/NexoraFixture.sol";

contract VestingFuzzTest is NexoraFixture {
    uint256 internal allocation;
    uint256 internal tge;

    function setUp() public {
        _deployFixture();
        _finalizeSuccessfulSale();

        allocation = presale.purchased(alice);
        tge = presale.tgeTime();
    }

    function testFuzz_VestedNeverExceedsAllocation(uint256 elapsed) public {
        elapsed = bound(elapsed, 0, 30 days);

        vm.warp(tge + elapsed);

        uint256 vestedAmount = vesting.vested(alice);

        assertLe(vestedAmount, allocation);
    }

    function testFuzz_VestingIsMonotonic(uint256 firstElapsed, uint256 secondElapsed) public {
        firstElapsed = bound(firstElapsed, 0, 30 days);
        secondElapsed = bound(secondElapsed, firstElapsed, 30 days);

        vm.warp(tge + firstElapsed);
        uint256 firstVested = vesting.vested(alice);

        vm.warp(tge + secondElapsed);
        uint256 secondVested = vesting.vested(alice);

        assertGe(secondVested, firstVested);
    }

    function testFuzz_ClaimableMatchesVestedMinusClaimed(uint256 elapsed) public {
        elapsed = bound(elapsed, 0, 30 days);

        vm.warp(tge + elapsed);

        uint256 vestedAmount = vesting.vested(alice);
        uint256 claimedAmount = vesting.claimed(alice);

        assertEq(vesting.claimable(alice), vestedAmount - claimedAmount);
    }

    function testFuzz_ClaimsNeverExceedAllocation(uint256 firstElapsed, uint256 secondElapsed) public {
        firstElapsed = bound(firstElapsed, 0, 30 days);
        secondElapsed = bound(secondElapsed, firstElapsed, 30 days);

        vm.warp(tge + firstElapsed);

        uint256 firstClaimable = vesting.claimable(alice);

        if (firstClaimable > 0) {
            vm.prank(alice);
            vesting.claim();
        }

        vm.warp(tge + secondElapsed);

        uint256 secondClaimable = vesting.claimable(alice);

        if (secondClaimable > 0) {
            vm.prank(alice);
            vesting.claim();
        }

        assertLe(vesting.claimed(alice), allocation);

        assertEq(token.balanceOf(alice), vesting.claimed(alice));
    }

    function testFuzz_FullVestingAfterSchedule(uint256 extraTime) public {
        extraTime = bound(extraTime, 0, 365 days);

        vm.warp(tge + CLIFF + VESTING_DURATION + extraTime);

        assertEq(vesting.vested(alice), allocation);
    }

    function testFuzz_TGEUnlockIsExactlyTwentyPercent(uint256 elapsed) public {
        elapsed = bound(elapsed, 0, CLIFF);

        vm.warp(tge + elapsed);

        uint256 expected = allocation * TGE_UNLOCK_BPS / 10_000;

        assertEq(vesting.vested(alice), expected);
    }
}
