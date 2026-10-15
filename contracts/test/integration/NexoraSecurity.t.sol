// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NexoraFixture} from "../helpers/NexoraFixture.sol";

contract NexoraSecurityTest is NexoraFixture {
    function setUp() public {
        _deployFixture();
    }

    function test_CannotRescueBuyerTokensAfterSuccessfulSale() public {
        _finalizeSuccessfulSale();

        uint256 sold = presale.totalSold();
        uint256 unsold = PRESALE_ALLOCATION - sold;

        vm.prank(owner);
        vm.expectRevert();
        vesting.rescueUnsold(treasury, unsold + 1);

        vm.prank(owner);
        vesting.rescueUnsold(treasury, unsold);

        assertEq(token.balanceOf(address(vesting)), sold);
    }

    function test_ClaimsRemainBackedAfterRescue() public {
        _finalizeSuccessfulSale();

        uint256 sold = presale.totalSold();

        vm.prank(owner);
        vesting.rescueUnsold(treasury, PRESALE_ALLOCATION - sold);

        vm.prank(alice);
        vesting.claim();

        vm.warp(presale.tgeTime() + CLIFF + VESTING_DURATION);

        vm.prank(alice);
        vesting.claim();

        assertEq(token.balanceOf(alice), presale.purchased(alice));

        assertEq(token.balanceOf(address(vesting)), 0);
    }

    function test_FailedSaleCannotUnlockVesting() public {
        _startSale();

        _buy(alice, 0.000032 ether);

        vm.warp(presale.endTime());
        presale.finalize();

        assertFalse(presale.successful());
        assertEq(vesting.vested(alice), 0);
        assertEq(vesting.claimable(alice), 0);

        vm.prank(alice);
        vm.expectRevert();
        vesting.claim();
    }

    function test_FailedSaleAllowsRescueOfAllTokens() public {
        _startSale();

        _buy(alice, 0.000032 ether);

        vm.warp(presale.endTime());
        presale.finalize();

        vm.prank(owner);
        vesting.rescueUnsold(treasury, PRESALE_ALLOCATION);

        assertEq(token.balanceOf(address(vesting)), 0);
    }

    function test_StakingRewardsStartOnlyAfterActivation() public {
        assertEq(staking.rewardRate(), 0);
        assertEq(staking.periodFinish(), 0);

        _finalizeSuccessfulSale();

        uint256 activationTime = block.timestamp;

        _activateStakingRewards();

        assertGt(staking.rewardRate(), 0);
        assertEq(staking.periodFinish(), activationTime + 7 days);
    }
}
