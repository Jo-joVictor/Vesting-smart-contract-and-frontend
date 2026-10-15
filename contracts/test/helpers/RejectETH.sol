// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NexoraPresale} from "../../src/NexoraPresale.sol";

contract RejectETH {
    NexoraPresale public immutable presale;

    constructor(address presale_) {
        presale = NexoraPresale(presale_);
    }

    receive() external payable {
        revert("ETH rejected");
    }

    function buy(uint256 minTokensOut) external payable {
        presale.buy{value: msg.value}(minTokensOut);
    }

    function claimRefund() external {
        presale.claimRefund();
    }
}
