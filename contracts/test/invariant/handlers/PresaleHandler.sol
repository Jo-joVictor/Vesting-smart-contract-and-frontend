// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NexoraPresale} from "../../../src/NexoraPresale.sol";

contract PresaleHandler is Test {
    NexoraPresale public presale;

    address[] public buyers;

    constructor(NexoraPresale presale_) {
        presale = presale_;

        for (uint256 i; i < 5; ++i) {
            buyers.push(makeAddr(string.concat("buyer", vm.toString(i))));
        }
    }

    function buy(uint256 buyerSeed, uint256 amountSeed) external {
        address buyer = buyers[buyerSeed % buyers.length];

        uint256 remaining = presale.maxContribution() - presale.contributions(buyer);

        if (remaining == 0) return;

        uint256 amount = bound(amountSeed, presale.minContribution(), presale.maxContribution());

        vm.deal(buyer, amount);

        vm.prank(buyer);

        try presale.buy{value: amount}(0) {
            // Successful purchase
        } catch {
            // Invalid purchases are allowed in handler exploration
        }
    }
}
