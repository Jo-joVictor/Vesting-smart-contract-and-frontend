// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NexoraToken} from "../../src/NexoraToken.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract NexoraTokenTest is Test {
    NexoraToken internal token;

    address internal treasury = makeAddr("treasury");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant SUPPLY = 100_000_000 ether;

    function setUp() public {
        token = new NexoraToken(treasury);
    }

    function test_TokenMetadata() public view {
        assertEq(token.name(), "Nexora Token");
        assertEq(token.symbol(), "NXR");
        assertEq(token.decimals(), 18);
    }

    function test_InitialSupply() public view {
        assertEq(token.totalSupply(), SUPPLY);
        assertEq(token.balanceOf(treasury), SUPPLY);
    }

    function test_RevertIfTreasuryIsZero() public {
        vm.expectRevert(NexoraToken.NexoraToken__InvalidTreasury.selector);

        new NexoraToken(address(0));
    }

    function test_Transfer() public {
        uint256 amount = 1_000 ether;

        vm.prank(treasury);
        token.transfer(alice, amount);

        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(treasury), SUPPLY - amount);
    }

    function test_ApproveAndTransferFrom() public {
        uint256 amount = 500 ether;

        vm.prank(treasury);
        token.approve(alice, amount);

        assertEq(token.allowance(treasury, alice), amount);

        vm.prank(alice);
        token.transferFrom(treasury, bob, amount);

        assertEq(token.balanceOf(bob), amount);
        assertEq(token.allowance(treasury, alice), 0);
    }

    function test_RevertOnInsufficientBalance() public {
        vm.prank(alice);

        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, alice, 0, 1 ether));

        token.transfer(bob, 1 ether);
    }

    function test_RevertOnInsufficientAllowance() public {
        vm.prank(alice);

        vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, alice, 0, 1 ether));

        token.transferFrom(treasury, bob, 1 ether);
    }

    function testFuzz_Transfer(uint256 amount) public {
        amount = bound(amount, 0, SUPPLY);

        vm.prank(treasury);
        token.transfer(alice, amount);

        assertEq(token.balanceOf(alice), amount);
        assertEq(token.balanceOf(treasury), SUPPLY - amount);
        assertEq(token.totalSupply(), SUPPLY);
    }
}
