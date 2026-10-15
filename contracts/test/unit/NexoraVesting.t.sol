// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NexoraToken} from "../../src/NexoraToken.sol";
import {NexoraPresale} from "../../src/NexoraPresale.sol";
import {NexoraVesting} from "../../src/NexoraVesting.sol";

contract NexoraVestingTest is Test {
    NexoraToken internal token;
    NexoraPresale internal presale;
    NexoraVesting internal vesting;

    address internal owner = makeAddr("owner");
    address internal alice = makeAddr("alice");

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

        vm.prank(owner);
        token.transfer(address(vesting), 40_000_000 ether);

        vm.deal(alice, 1 ether);

        vm.warp(start);

        vm.prank(alice);
        presale.buy{value: 0.000032 ether}(0);

        vm.warp(presale.endTime());

        // Alice alone has not reached the soft cap.
        // A second buyer will contribute enough for success.
        address bob = makeAddr("bob");
        vm.deal(bob, 1 ether);

        // Cannot buy after the end, so add Bob before finalizing
        // by returning to the active sale period.
        vm.warp(start + 1);

        vm.prank(bob);
        presale.buy{value: 0.000096 ether}(0);

        vm.warp(presale.endTime());
        presale.finalize();
    }

    function test_TGEUnlock() public view {
        assertEq(vesting.vested(alice), 1_000_000 ether);
    }

    function test_CliffEnd() public {
        vm.warp(presale.tgeTime() + 1 hours);
        assertEq(vesting.vested(alice), 1_000_000 ether);
    }

    function test_HalfwayLinear() public {
        vm.warp(presale.tgeTime() + 1 hours + 2 days);
        assertEq(vesting.vested(alice), 3_000_000 ether);
    }

    function test_FullyVested() public {
        vm.warp(presale.tgeTime() + 1 hours + 4 days);
        assertEq(vesting.vested(alice), 5_000_000 ether);
    }

    function test_ClaimAtTGE() public {
        vm.prank(alice);
        vesting.claim();

        assertEq(token.balanceOf(alice), 1_000_000 ether);
        assertEq(vesting.claimed(alice), 1_000_000 ether);
    }

    function test_RevertOnDoubleClaim() public {
        vm.startPrank(alice);

        vesting.claim();

        vm.expectRevert(NexoraVesting.NothingToClaim.selector);
        vesting.claim();

        vm.stopPrank();
    }

    function test_ClaimRemainingAfterVesting() public {
        vm.prank(alice);
        vesting.claim();

        vm.warp(presale.tgeTime() + 1 hours + 4 days);

        vm.prank(alice);
        vesting.claim();

        assertEq(token.balanceOf(alice), 5_000_000 ether);
        assertEq(vesting.claimable(alice), 0);
    }

    function test_RescueUnsoldTokens() public {
        uint256 unsold = 40_000_000 ether - presale.totalSold();

        vm.prank(owner);
        vesting.rescueUnsold(owner, unsold);

        assertEq(token.balanceOf(address(vesting)), presale.totalSold());
    }
}
