// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract NexoraPresale is Ownable, Pausable, ReentrancyGuard {
    uint256 private constant UNIT = 1e18;
    uint256 private constant STAGE_COUNT = 3;

    struct Stage {
        uint256 allocation;
        uint256 sold;
        uint256 priceWei;
    }

    struct PurchaseQuote {
        uint256 tokensOut;
        uint256 ethAccepted;
        uint256[3] stageTokens;
    }

    Stage[3] private s_stages;

    uint256 public immutable startTime;
    uint256 public immutable endTime;
    uint256 public immutable softCap;
    uint256 public immutable hardCap;
    uint256 public immutable minContribution;
    uint256 public immutable maxContribution;
    uint256 public immutable totalAllocation;

    uint256 public totalRaised;
    uint256 public totalSold;
    uint256 public tgeTime;

    bool public finalized;
    bool public successful;

    mapping(address => uint256) public purchased;
    mapping(address => uint256) public contributions;

    error InvalidConfiguration();
    error SaleNotStarted();
    error SaleEnded();
    error BelowMin();
    error WalletLimitReached();
    error Slippage();
    error ZeroTokensOut();
    error NothingToRefund();
    error RefundUnavailable();
    error RefundFailed();
    error SaleNotEnded();
    error AlreadyFinalized();
    error SaleNotSuccessful();
    error NothingToWithdraw();
    error WithdrawFailed();

    event TokensPurchased(address indexed buyer, uint256 ethAccepted, uint256 tokensReceived);
    event ExcessETHRefunded(address indexed buyer, uint256 amount);
    event SaleFinalized(bool successful, uint256 raised, uint256 tgeTime);
    event Refunded(address indexed buyer, uint256 amount);
    event ProceedsWithdrawn(address indexed recipient, uint256 amount);

    constructor(
        address owner_,
        uint256[3] memory allocations_,
        uint256[3] memory prices_,
        uint256 startTime_,
        uint256 duration_,
        uint256 softCap_,
        uint256 hardCap_,
        uint256 minContribution_,
        uint256 maxContribution_
    ) Ownable(owner_) {
        if (
            owner_ == address(0) || startTime_ <= block.timestamp || duration_ == 0 || softCap_ == 0
                || hardCap_ < softCap_ || minContribution_ == 0 || maxContribution_ < minContribution_
                || maxContribution_ > hardCap_
        ) revert InvalidConfiguration();

        uint256 calculatedHardCap = 0;
        uint256 allocation = 0;

        for (uint256 i; i < STAGE_COUNT; ++i) {
            if (allocations_[i] == 0 || prices_[i] == 0 || allocations_[i] % UNIT != 0) revert InvalidConfiguration();

            s_stages[i] = Stage({allocation: allocations_[i], sold: 0, priceWei: prices_[i]});

            allocation += allocations_[i];
            calculatedHardCap += Math.mulDiv(allocations_[i], prices_[i], UNIT);
        }

        if (calculatedHardCap != hardCap_) {
            revert InvalidConfiguration();
        }

        totalAllocation = allocation;
        startTime = startTime_;
        endTime = startTime_ + duration_;
        softCap = softCap_;
        hardCap = hardCap_;
        minContribution = minContribution_;
        maxContribution = maxContribution_;
    }

    function getStage(uint256 index) external view returns (Stage memory) {
        return s_stages[index];
    }

    function quote(uint256 ethIn) external view returns (uint256 tokensOut, uint256 ethAccepted) {
        PurchaseQuote memory q = _calculate(ethIn);
        return (q.tokensOut, q.ethAccepted);
    }

    function buy(uint256 minTokensOut) external payable nonReentrant whenNotPaused {
        if (block.timestamp < startTime) revert SaleNotStarted();
        if (block.timestamp >= endTime || finalized) revert SaleEnded();
        if (totalRaised >= hardCap || totalSold >= totalAllocation) {
            revert SaleEnded();
        }

        uint256 walletRemaining = maxContribution - contributions[msg.sender];
        if (walletRemaining == 0) revert WalletLimitReached();

        uint256 input = Math.min(msg.value, walletRemaining);
        PurchaseQuote memory q = _calculate(input);

        if (q.ethAccepted < minContribution) {
            // Permit the final dust fill of a cap only if the
            // buyer supplied at least the minimum contribution.
            bool capFill = q.ethAccepted > 0 && msg.value >= minContribution
                && (q.ethAccepted == hardCap - totalRaised || q.ethAccepted == walletRemaining);

            if (!capFill) revert BelowMin();
        }

        if (q.tokensOut == 0) revert ZeroTokensOut();
        if (q.tokensOut < minTokensOut) revert Slippage();

        for (uint256 i; i < STAGE_COUNT; ++i) {
            s_stages[i].sold += q.stageTokens[i];
        }

        contributions[msg.sender] += q.ethAccepted;
        purchased[msg.sender] += q.tokensOut;
        totalRaised += q.ethAccepted;
        totalSold += q.tokensOut;

        emit TokensPurchased(msg.sender, q.ethAccepted, q.tokensOut);

        uint256 refund = msg.value - q.ethAccepted;
        if (refund > 0) {
            (bool ok,) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert RefundFailed();

            emit ExcessETHRefunded(msg.sender, refund);
        }
    }

    function _calculate(uint256 ethIn) internal view returns (PurchaseQuote memory q) {
        uint256 remainingETH = Math.min(ethIn, hardCap - totalRaised);

        for (uint256 i; i < STAGE_COUNT && remainingETH > 0; ++i) {
            Stage memory stage = s_stages[i];

            uint256 available = stage.allocation - stage.sold;
            if (available == 0) continue;

            uint256 fullStageCost = Math.mulDiv(available, stage.priceWei, UNIT, Math.Rounding.Ceil);

            uint256 tokens;
            uint256 cost;

            if (remainingETH >= fullStageCost) {
                // Fill the stage completely.
                tokens = available;
                cost = fullStageCost;
            } else {
                // Partial fill.
                tokens = Math.mulDiv(remainingETH, UNIT, stage.priceWei);

                if (tokens == 0) break;

                cost = Math.mulDiv(tokens, stage.priceWei, UNIT, Math.Rounding.Ceil);
            }

            q.stageTokens[i] = tokens;
            q.tokensOut += tokens;
            q.ethAccepted += cost;

            remainingETH -= cost;
        }
    }

    function finalize() external {
        if (finalized) revert AlreadyFinalized();

        if (block.timestamp < endTime && totalRaised < hardCap && totalSold < totalAllocation) revert SaleNotEnded();

        finalized = true;
        successful = totalRaised >= softCap;

        if (successful) {
            tgeTime = block.timestamp;
        }

        emit SaleFinalized(successful, totalRaised, tgeTime);
    }

    function claimRefund() external nonReentrant {
        if (!finalized || successful) revert RefundUnavailable();

        uint256 amount = contributions[msg.sender];
        if (amount == 0) revert NothingToRefund();

        contributions[msg.sender] = 0;

        (bool ok,) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert RefundFailed();

        emit Refunded(msg.sender, amount);
    }

    function withdrawProceeds() external onlyOwner nonReentrant {
        if (!finalized || !successful) revert SaleNotSuccessful();

        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();

        (bool ok,) = payable(owner()).call{value: amount}("");
        if (!ok) revert WithdrawFailed();

        emit ProceedsWithdrawn(owner(), amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}