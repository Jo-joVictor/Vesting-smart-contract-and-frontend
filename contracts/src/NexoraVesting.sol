// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {INexoraPresale} from "./interfaces/INexoraPresale.sol";

contract NexoraVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS = 10_000;

    IERC20 public immutable token;
    INexoraPresale public immutable presale;

    uint256 public immutable tgeUnlockBps;
    uint256 public immutable cliffDuration;
    uint256 public immutable linearDuration;
    uint256 public immutable allocation;

    mapping(address => uint256) public claimed;
    uint256 public totalClaimed;

    error InvalidConfiguration();
    error NothingToClaim();
    error SaleNotSuccessful();
    error InsufficientRescuableBalance();

    event TokensClaimed(address indexed buyer, uint256 amount);
    event UnsoldRescued(address indexed recipient, uint256 amount);

    constructor(
        address token_,
        address presale_,
        address owner_,
        uint256 tgeUnlockBps_,
        uint256 cliffDuration_,
        uint256 linearDuration_,
        uint256 allocation_
    ) Ownable(owner_) {
        if (
            token_ == address(0) || presale_ == address(0) || owner_ == address(0) || tgeUnlockBps_ > BPS
                || linearDuration_ == 0 || allocation_ == 0
        ) revert InvalidConfiguration();

        token = IERC20(token_);
        presale = INexoraPresale(presale_);
        tgeUnlockBps = tgeUnlockBps_;
        cliffDuration = cliffDuration_;
        linearDuration = linearDuration_;
        allocation = allocation_;
    }

    function vested(address buyer) public view returns (uint256) {
        if (!presale.finalized() || !presale.successful()) {
            return 0;
        }

        uint256 purchasedAmount = presale.purchased(buyer);
        uint256 tge = presale.tgeTime();

        if (block.timestamp < tge) return 0;

        uint256 initialUnlock = Math.mulDiv(purchasedAmount, tgeUnlockBps, BPS);

        uint256 cliffEnd = tge + cliffDuration;

        if (block.timestamp <= cliffEnd) {
            return initialUnlock;
        }

        uint256 elapsed = block.timestamp - cliffEnd;

        if (elapsed >= linearDuration) {
            return purchasedAmount;
        }

        uint256 remaining = purchasedAmount - initialUnlock;

        return initialUnlock + Math.mulDiv(remaining, elapsed, linearDuration);
    }

    function claimable(address buyer) public view returns (uint256) {
        return vested(buyer) - claimed[buyer];
    }

    function claim() external nonReentrant {
        uint256 amount = claimable(msg.sender);

        if (amount == 0) revert NothingToClaim();

        claimed[msg.sender] += amount;
        totalClaimed += amount;

        token.safeTransfer(msg.sender, amount);

        emit TokensClaimed(msg.sender, amount);
    }

    function rescueUnsold(address recipient, uint256 amount) external onlyOwner nonReentrant {
        if (!presale.finalized()) revert SaleNotSuccessful();
        if (recipient == address(0)) revert InvalidConfiguration();

        uint256 owed = presale.successful() ? presale.totalSold() - totalClaimed : 0;

        uint256 balance = token.balanceOf(address(this));

        if (balance < owed || amount > balance - owed) {
            revert InsufficientRescuableBalance();
        }

        token.safeTransfer(recipient, amount);

        emit UnsoldRescued(recipient, amount);
    }
}