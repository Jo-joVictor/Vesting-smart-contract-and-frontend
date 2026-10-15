// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";

import {NexoraPresale} from "../../src/NexoraPresale.sol";
import {PresaleHandler} from "./handlers/PresaleHandler.sol";

contract PresaleInvariantTest is StdInvariant, Test {
    NexoraPresale internal presale;
    PresaleHandler internal handler;

    function setUp() public {
        uint256[3] memory allocations =
            [uint256(10_000_000 ether), uint256(15_000_000 ether), uint256(15_000_000 ether)];

        uint256[3] memory prices = [uint256(6_400_000), uint256(9_600_000), uint256(12_800_000)];

        uint256 start = block.timestamp + 10 minutes;

        presale = new NexoraPresale(
            address(this),
            allocations,
            prices,
            start,
            48 hours,
            0.000128 ether,
            0.0004 ether,
            640_000_000_000,
            0.000128 ether
        );

        vm.warp(start);

        handler = new PresaleHandler(presale);

        targetContract(address(handler));
    }

    function invariant_TotalRaisedNeverExceedsHardCap() public view {
        assertLe(presale.totalRaised(), presale.hardCap());
    }

    function invariant_TotalSoldNeverExceedsAllocation() public view {
        assertLe(presale.totalSold(), presale.totalAllocation());
    }

    function invariant_EthBalanceMatchesRaised() public view {
        assertEq(address(presale).balance, presale.totalRaised());
    }

    function invariant_StageAllocationsNeverExceeded() public view {
        uint256 sum;

        for (uint256 i; i < 3; ++i) {
            NexoraPresale.Stage memory stage = presale.getStage(i);

            assertLe(stage.sold, stage.allocation);
            sum += stage.sold;
        }

        assertEq(sum, presale.totalSold());
    }
}
