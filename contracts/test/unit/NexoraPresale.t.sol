// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NexoraPresale} from "../../src/NexoraPresale.sol";
import {console2} from "forge-std/console2.sol";
import {RejectETH} from "../helpers/RejectETH.sol";

contract NexoraPresaleTest is Test {
    NexoraPresale internal presale;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant HARD_CAP = 0.0004 ether;
    uint256 internal constant SOFT_CAP = 0.000128 ether;
    uint256 internal constant MIN_BUY = 640_000_000_000;
    uint256 internal constant MAX_BUY = 0.000128 ether;

    uint256 internal start;

    function setUp() public {
        uint256[3] memory allocations =
            [uint256(10_000_000 ether), uint256(15_000_000 ether), uint256(15_000_000 ether)];

        uint256[3] memory prices = [uint256(6_400_000), uint256(9_600_000), uint256(12_800_000)];

        start = block.timestamp + 10 minutes;
        console2.log("Current timestamp:", block.timestamp);
        console2.log("Start timestamp:", start);
        console2.log("Soft cap:", SOFT_CAP);
        console2.log("Hard cap:", HARD_CAP);
        console2.log("Minimum:", MIN_BUY);
        console2.log("Maximum:", MAX_BUY);
        presale = new NexoraPresale(owner, allocations, prices, start, 48 hours, SOFT_CAP, HARD_CAP, MIN_BUY, MAX_BUY);

        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }

    function test_Configuration() public view {
        assertEq(presale.hardCap(), HARD_CAP);
        assertEq(presale.softCap(), SOFT_CAP);
        assertEq(presale.totalAllocation(), 40_000_000 ether);
    }

    function test_RevertBeforeStart() public {
        vm.prank(alice);
        vm.expectRevert(NexoraPresale.SaleNotStarted.selector);
        presale.buy{value: 0.00001 ether}(0);
    }

    function test_BuyStageOne() public {
        vm.warp(start);

        vm.prank(alice);
        presale.buy{value: 0.000032 ether}(0);

        assertEq(presale.purchased(alice), 5_000_000 ether);
        assertEq(presale.contributions(alice), 0.000032 ether);
    }

    function test_BuyAcrossStages() public {
        vm.warp(start);

        vm.prank(alice);
        presale.buy{value: 0.000096 ether}(0);

        uint256 stageOneTokens = 10_000_000 ether;
        uint256 stageTwoETH = 0.000032 ether;

        uint256 stageTwoTokens = (stageTwoETH * 1e18) / 9_600_000;

        uint256 expected = stageOneTokens + stageTwoTokens;

        assertEq(presale.purchased(alice), expected);
    }

    function test_WalletLimitRefund() public {
        vm.warp(start);

        vm.prank(alice);
        presale.buy{value: 0.000032 ether}(0);

        uint256 balanceBefore = alice.balance;

        vm.prank(alice);
        presale.buy{value: 0.000128 ether}(0);

        assertEq(presale.contributions(alice), MAX_BUY);
        assertEq(alice.balance, balanceBefore - 0.000096 ether);
    }

    function test_RevertBelowMin() public {
        vm.warp(start);

        vm.prank(alice);
        vm.expectRevert(NexoraPresale.BelowMin.selector);
        presale.buy{value: 1}(0);
    }

    function test_RevertSlippage() public {
        vm.warp(start);

        (uint256 quoted,) = presale.quote(0.00001 ether);

        vm.prank(alice);
        vm.expectRevert(NexoraPresale.Slippage.selector);
        presale.buy{value: 0.00001 ether}(quoted + 1);
    }

    function test_FinalizeFailedSaleAndRefund() public {
        vm.warp(start);

        vm.prank(alice);
        presale.buy{value: 0.000032 ether}(0);

        vm.warp(presale.endTime());

        presale.finalize();

        assertFalse(presale.successful());

        uint256 balanceBefore = alice.balance;

        vm.prank(alice);
        presale.claimRefund();

        assertEq(alice.balance, balanceBefore + 0.000032 ether);
    }

    function test_FinalizeSuccessfulSale() public {
        vm.warp(start);

        vm.prank(alice);
        presale.buy{value: MAX_BUY}(0);

        vm.warp(presale.endTime());
        presale.finalize();

        assertTrue(presale.successful());
        assertEq(presale.tgeTime(), block.timestamp);
    }

    function test_WithdrawProceeds() public {
        vm.warp(start);

        vm.prank(alice);
        presale.buy{value: MAX_BUY}(0);

        vm.warp(presale.endTime());
        presale.finalize();

        uint256 beforeBalance = owner.balance;

        vm.prank(owner);
        presale.withdrawProceeds();

        assertEq(owner.balance, beforeBalance + MAX_BUY);
    }

    function test_PauseOnlyBlocksBuying() public {
        vm.prank(owner);
        presale.pause();

        vm.warp(start);

        vm.prank(alice);
        vm.expectRevert();
        presale.buy{value: 0.00001 ether}(0);
    }

    function test_StageBoundaryAfterPartialPurchase() public {
        vm.warp(start);

        // Alice purchases 5 million tokens in Stage 1.
        vm.prank(alice);
        presale.buy{value: 0.000032 ether}(0);

        // Bob fills the rest of Stage 1 and enters Stage 2.
        vm.prank(bob);
        presale.buy{value: 0.000096 ether}(0);

        NexoraPresale.Stage memory stageOne = presale.getStage(0);
        NexoraPresale.Stage memory stageTwo = presale.getStage(1);

        assertEq(stageOne.sold, 10_000_000 ether);
        assertGt(stageTwo.sold, 0);
        assertEq(presale.totalRaised(), 0.000128 ether);
    }

    function test_QuoteNeverAcceptsMoreThanInput() public {
        vm.warp(start);

        uint256 input = 0.0001 ether;

        (uint256 tokensOut, uint256 accepted) = presale.quote(input);

        assertGt(tokensOut, 0);
        assertLe(accepted, input);
    }

    function test_StageOneCanBeFullySold() public {
        vm.warp(start);

        // Five million NXR each.
        vm.prank(alice);
        presale.buy{value: 0.000032 ether}(0);

        vm.prank(bob);
        presale.buy{value: 0.000032 ether}(0);

        NexoraPresale.Stage memory stageOne = presale.getStage(0);

        assertEq(stageOne.sold, 10_000_000 ether);
    }

    function test_RevertWhenExcessETHRefundFails() public {
        vm.warp(start);

        RejectETH rejector = new RejectETH(address(presale));

        vm.deal(address(this), 1 ether);

        vm.expectRevert(NexoraPresale.RefundFailed.selector);

        rejector.buy{value: 0.0002 ether}(0);

        assertEq(presale.purchased(address(rejector)), 0);
        assertEq(presale.contributions(address(rejector)), 0);
        assertEq(presale.totalRaised(), 0);
    }

    function test_RevertWhenFailedSaleRefundIsRejected() public {
        vm.warp(start);

        RejectETH rejector = new RejectETH(address(presale));

        vm.deal(address(this), 1 ether);

        rejector.buy{value: 0.000032 ether}(0);

        vm.warp(presale.endTime());
        presale.finalize();

        assertFalse(presale.successful());

        vm.expectRevert(NexoraPresale.RefundFailed.selector);
        rejector.claimRefund();

        // Failed refund must not erase the buyer's contribution.
        assertEq(presale.contributions(address(rejector)), 0.000032 ether);
    }
}
