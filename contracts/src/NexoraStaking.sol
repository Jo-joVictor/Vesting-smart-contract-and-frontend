// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract NexoraStaking is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant PRECISION = 1e18;
    uint256 public constant BPS = 10_000;
    uint256 public constant YEAR = 365 days;

    IERC20 public immutable stakingToken;
    uint256 public immutable rewardsDuration;

    uint256 public totalStaked;
    uint256 public rewardRate;
    uint256 public periodFinish;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    uint256 public totalRewardsPaid;
    uint256 public totalRewardsCommitted;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    error InvalidConfiguration();
    error ZeroAmount();
    error InsufficientStake();
    error NoReward();
    error RewardTooSmall();
    error InsufficientRewardBalance();
    error RewardPeriodActive();

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);
    event RewardAdded(uint256 amount, uint256 rewardRate, uint256 periodFinish);

    constructor(address token_, address owner_, uint256 rewardsDuration_) Ownable(owner_) {
        if (token_ == address(0) || owner_ == address(0) || rewardsDuration_ == 0) revert InvalidConfiguration();

        stakingToken = IERC20(token_);
        rewardsDuration = rewardsDuration_;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }

        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored
            + Math.mulDiv((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate, PRECISION, totalStaked);
    }

    function earned(address account) public view returns (uint256) {
        uint256 accumulated =
            Math.mulDiv(balances[account], rewardPerToken() - userRewardPerTokenPaid[account], PRECISION);

        return accumulated + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();

        totalStaked += amount;
        balances[msg.sender] += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        _withdraw(msg.sender, amount);
    }

    function _withdraw(address account, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        if (amount > balances[account]) revert InsufficientStake();

        balances[account] -= amount;
        totalStaked -= amount;

        stakingToken.safeTransfer(account, amount);

        emit Withdrawn(account, amount);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        _payReward(msg.sender);
    }

    function _payReward(address account) internal {
        uint256 reward = rewards[account];
        if (reward == 0) revert NoReward();

        rewards[account] = 0;
        totalRewardsPaid += reward;

        stakingToken.safeTransfer(account, reward);

        emit RewardPaid(account, reward);
    }

    function exit() external nonReentrant updateReward(msg.sender) {
        uint256 amount = balances[msg.sender];

        if (amount > 0) {
            _withdraw(msg.sender, amount);
        }

        if (rewards[msg.sender] > 0) {
            _payReward(msg.sender);
        }
    }

    function notifyRewardAmount(uint256 amount) external onlyOwner nonReentrant updateReward(address(0)) {
        if (amount == 0) revert ZeroAmount();

        uint256 remainingRewards = 0;

        if (block.timestamp < periodFinish) {
            remainingRewards = (periodFinish - block.timestamp) * rewardRate;
        }

        uint256 totalReward = amount + remainingRewards;
        uint256 newRate = totalReward / rewardsDuration;

        if (newRate == 0) revert RewardTooSmall();

        uint256 balance = stakingToken.balanceOf(address(this));

        if (balance < totalStaked) {
            revert InsufficientRewardBalance();
        }

        uint256 availableRewards = balance - totalStaked;

        // All previously committed rewards that haven't
        // been paid must remain fully backed.
        uint256 outstandingRewards = totalRewardsCommitted - totalRewardsPaid;

        // The new funding amount must be genuinely additional
        // to all outstanding reward obligations.
        if (availableRewards < outstandingRewards + amount) {
            revert InsufficientRewardBalance();
        }

        totalRewardsCommitted += amount;

        rewardRate = newRate;
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;

        emit RewardAdded(amount, newRate, periodFinish);
    }

    function aprBps() external view returns (uint256) {
        if (totalStaked == 0) return 0;

        return Math.mulDiv(rewardRate * YEAR, BPS, totalStaked);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
