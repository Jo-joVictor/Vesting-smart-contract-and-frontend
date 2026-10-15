// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NexoraPresale} from "../../src/NexoraPresale.sol";

contract PresaleFuzzTest is Test {
    NexoraPresale internal presale;

    address internal owner = makeAddr("owner");
    address internal buyer = makeAddr("buyer");

    uint256 internal start;

    function setUp() public {
        uint256[3] memory allocations =
            [uint256(10_000_000 ether), uint256(15_000_000 ether), uint256(15_000_000 ether)];

        uint256[3] memory prices = [uint256(6_400_000), uint256(9_600_000), uint256(12_800_000)];

        start = block.timestamp + 10 minutes;

        presale = new NexoraPresale(
            owner, allocations, prices, start, 48 hours, 0.000128 ether, 0.0004 ether, 640_000_000_000, 0.000128 ether
        );

        vm.deal(buyer, 1 ether);
        vm.warp(start);
    }

    function testFuzz_QuoteMatchesPurchase(uint256 amount) public {
        amount = bound(amount, presale.minContribution(), presale.maxContribution());

        (uint256 expectedTokens, uint256 expectedETH) = presale.quote(amount);

        uint256 balanceBefore = buyer.balance;

        vm.prank(buyer);
        presale.buy{value: amount}(expectedTokens);

        assertEq(presale.purchased(buyer), expectedTokens);
        assertEq(presale.contributions(buyer), expectedETH);
        assertEq(buyer.balance, balanceBefore - expectedETH);
    }

    function testFuzz_TotalSoldNeverExceedsAllocation(uint256 amount) public {
        amount = bound(amount, presale.minContribution(), presale.maxContribution());

        vm.prank(buyer);
        presale.buy{value: amount}(0);

        assertLe(presale.totalSold(), presale.totalAllocation());
    }
}
