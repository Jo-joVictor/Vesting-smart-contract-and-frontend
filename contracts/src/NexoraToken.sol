// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title NexoraToken
/// @notice Fixed-supply ERC20 token for the Nexora launch platform.
/// @dev The entire supply is minted to the treasury at deployment.
contract NexoraToken is ERC20 {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 1e18;

    /// @notice Reverts if the treasury address is zero.
    error NexoraToken__InvalidTreasury();

    /// @param treasury Address receiving the initial token supply.
    constructor(address treasury) ERC20("Nexora Token", "NXR") {
        if (treasury == address(0)) {
            revert NexoraToken__InvalidTreasury();
        }

        _mint(treasury, TOTAL_SUPPLY);
    }
}