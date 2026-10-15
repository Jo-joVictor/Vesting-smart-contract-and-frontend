import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

const MESSAGES: Record<string, string> = {
  // presale
  SaleNotStarted: "The presale hasn't started yet.",
  SaleEnded: "The presale has ended or is fully allocated.",
  BelowMin: "Amount is below the minimum contribution.",
  WalletLimitReached: "You've reached the per-wallet contribution limit.",
  Slippage: "Price moved. You'd receive fewer tokens than your minimum. Try again.",
  ZeroTokensOut: "That amount is too small to buy any tokens.",
  NothingToRefund: "You have nothing to refund.",
  RefundUnavailable: "Refunds are only available after a failed sale is finalized.",
  RefundFailed: "ETH transfer failed.",
  SaleNotEnded: "The sale hasn't ended yet.",
  AlreadyFinalized: "The sale is already finalized.",
  SaleNotSuccessful: "The sale was not successful.",
  NothingToWithdraw: "Nothing to withdraw.",
  WithdrawFailed: "Withdrawal failed.",
  // vesting
  NothingToClaim: "No tokens are claimable right now.",
  InsufficientRescuableBalance: "Not enough unowed tokens to rescue.",
  // staking
  ZeroAmount: "Enter an amount greater than zero.",
  InsufficientStake: "You don't have that much staked.",
  NoReward: "You have no rewards to claim.",
  RewardTooSmall: "Reward amount is too small for the rewards duration.",
  InsufficientRewardBalance: "Contract isn't funded enough for this reward.",
  // shared / openzeppelin
  EnforcedPause: "This contract is currently paused.",
  ExpectedPause: "This contract isn't paused.",
  OwnableUnauthorizedAccount: "Only the contract owner can do this.",
  ReentrancyGuardReentrantCall: "Reentrant call blocked.",
  SafeERC20FailedOperation: "Token transfer failed.",
  ERC20InsufficientAllowance: "Token allowance is too low. Approve first.",
  ERC20InsufficientBalance: "Insufficient NXR balance.",
};

export function decodeError(e: unknown): string {
  if (e instanceof BaseError) {
    if (e.walk((x) => x instanceof UserRejectedRequestError)) {
      return "Transaction cancelled in wallet.";
    }
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      if (name) return MESSAGES[name] ?? name;
    }
    return e.shortMessage;
  }
  if (e instanceof Error) {
    if (/user rejected|user denied/i.test(e.message)) return "Transaction cancelled in wallet.";
    return e.message;
  }
  return "Something went wrong.";
}