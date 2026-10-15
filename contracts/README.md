# Nexora Contracts

Solidity contracts for the Nexora token launch platform: a fixed-supply ERC-20, a staged ETH presale, a vesting vault, and a single-token staking pool.

> **Status: unaudited.** These contracts have not been professionally audited. Do not use them with real funds until they have been.

## Contracts

| Contract | Purpose |
| --- | --- |
| `NexoraToken` | ERC-20 "Nexora Token" (`NXR`). Fixed supply of 100,000,000 minted to a treasury at deployment. No mint or burn. |
| `NexoraPresale` | Three-stage ETH presale with soft cap, hard cap, per-wallet limits, slippage protection, refunds on failure. |
| `NexoraVesting` | Releases presale purchases on a schedule: TGE unlock, optional cliff, then linear release. |
| `NexoraStaking` | Stake NXR, earn NXR. Synthetix-style reward streaming with owner-funded reward periods. |

### Sepolia deployment

| Contract | Address |
| --- | --- |
| NexoraToken | `0x15e3168E0F97dE45EA1f847A0906e3632E9C08c9` |
| NexoraPresale | `0xf2A674660e8f54487D0c505a51Eea2851f924B6e` |
| NexoraVesting | `0xFA074F31635C720b61bc292B60980B48Ed31b179` |
| NexoraStaking | `0xe57629CD9A8eE29865A409214F27A0434af4D1b9` |

## How it fits together

```
 buyer ──ETH──▶ NexoraPresale ──records purchased[buyer]──▶ NexoraVesting ──NXR──▶ buyer
                     │                                          ▲
                     └── finalize() sets tgeTime ───────────────┘
                                                     (vesting must be pre-funded with NXR)

 holder ──NXR──▶ NexoraStaking ◀──NXR rewards── owner (notifyRewardAmount)
```

- The presale **never sends tokens**. It only records `purchased[buyer]`. Tokens leave the **vesting** contract when buyers claim.
- Vesting reads `finalized`, `successful`, `tgeTime` and `purchased` from the presale.
- Staking is independent of the other two. It only needs to hold NXR.

## NexoraPresale

- **Stages:** three stages, each with an `allocation` (whole tokens, multiple of 1e18) and a `priceWei` (wei per 1 whole token). Purchases fill stage 1, then 2, then 3, so the price rises as stages sell out.
- **Hard cap:** must equal the sum of `allocation × price / 1e18` over all stages. The constructor reverts otherwise.
- **Soft cap:** if `totalRaised >= softCap` at finalization, the sale succeeds. Otherwise buyers can refund.
- **Limits:** `minContribution` and `maxContribution` (per wallet, cumulative). `buy` clamps the input to the wallet's remaining allowance and refunds the excess. A final "cap fill" below the minimum is allowed if the buyer sent at least the minimum.
- **Slippage:** `buy(minTokensOut)` reverts if the quote falls below `minTokensOut`.
- **Timing:** `startTime` must be in the future at deployment. The sale ends at `endTime`, when the hard cap is hit, or when all tokens are sold.
- **Finalize:** `finalize()` is callable by anyone once the sale has ended. On success it records `tgeTime`.
- **Refunds:** `claimRefund()` returns a buyer's full contribution after a failed finalization.
- **Owner functions:** `withdrawProceeds()` (successful sales only, sends the full ETH balance), `pause()` and `unpause()` (pausing blocks `buy` only).

## NexoraVesting

For each buyer, with `P = presale.purchased(buyer)`:

1. Before the sale is finalized as successful: `vested = 0`.
2. From TGE: `initialUnlock = P × tgeUnlockBps / 10000` is claimable immediately.
3. During the cliff (`tge + cliffDuration`): nothing more unlocks.
4. After the cliff: the remaining `P − initialUnlock` unlocks linearly over `linearDuration`.
5. After `cliff + linear`: `vested = P`.

`claim()` transfers `vested − claimed` to the caller.

**Funding requirement:** the vesting contract must hold at least `presale.totalSold()` NXR. If it holds less, claims revert.

`rescueUnsold(recipient, amount)` (owner) can only move tokens that buyers are not owed: after a successful sale, `balance − (totalSold − totalClaimed)`. After a failed sale everything is rescuable.

> The `allocation` constructor argument is stored but not used in any calculation.

## NexoraStaking

- Stake and reward token are both NXR.
- `rewardsDuration` is fixed at deployment. `notifyRewardAmount(amount)` (owner) streams `amount` evenly over that duration. If a period is still running, the unpaid remainder is added to the new one.
- **Backing check:** `notifyRewardAmount` requires `balance − totalStaked ≥ (totalRewardsCommitted − totalRewardsPaid) + amount`. You must **transfer the reward NXR to the contract first**, then call it.
- Users call `stake`, `withdraw`, `getReward` and `exit`. There is no lock-up.
- `pause()` blocks `stake` only. Withdraw, claim and exit always work.
- `aprBps()` returns a simple (non-compounded) annual rate in basis points.

> `aprBps()` currently keeps returning a value after `periodFinish`. Recommended fix before mainnet:
>
> ```solidity
> function aprBps() external view returns (uint256) {
>     if (totalStaked == 0 || block.timestamp >= periodFinish) return 0;
>     return Math.mulDiv(rewardRate * YEAR, BPS, totalStaked);
> }
> ```

## Development

Requires [Foundry](https://book.getfoundry.sh/) and OpenZeppelin Contracts v5.

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test -vv
```

Remapping (`remappings.txt`):

```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
```

> `NexoraVesting` imports `./interfaces/INexoraPresale.sol`. Keep that interface in sync with the presale's public getters (`finalized`, `successful`, `purchased`, `tgeTime`, `totalSold`).

## Deployment order

1. **Token:** `new NexoraToken(treasury)`. The treasury receives all 100M NXR.
2. **Presale:**
```
   NexoraPresale(
     owner_,
     allocations_[3],   // wei, multiples of 1e18
     prices_[3],        // wei per 1 whole token
     startTime_,        // unix seconds, in the future
     duration_,         // seconds
     softCap_, hardCap_,           // hardCap_ must equal Σ(allocation × price / 1e18)
     minContribution_, maxContribution_
   )
```
3. **Vesting:** `NexoraVesting(token, presale, owner_, tgeUnlockBps_, cliffDuration_, linearDuration_, allocation_)`
4. **Staking:** `NexoraStaking(token, owner_, rewardsDuration_)`

### Post-deploy checklist

- [ ] Transfer at least the presale's total allocation of NXR from the treasury to the **vesting** contract.
- [ ] Transfer the staking reward budget to the **staking** contract, then call `notifyRewardAmount`.
- [ ] Verify all four contracts on the block explorer.
- [ ] Confirm each contract's `owner()`. Consider a multisig for production.
- [ ] After the sale ends, call `finalize()`. If it succeeded, call `withdrawProceeds()`, then `rescueUnsold()` for any leftover NXR.

### Example script

```bash
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_KEY \
  --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
```

## Trust assumptions

- The **owner** can pause purchases and staking, withdraw presale proceeds after a successful sale, choose when and how much to fund as staking rewards, and rescue only tokens that buyers are not owed.
- The owner **cannot** mint tokens, change presale prices, change vesting terms, change `rewardsDuration`, or touch staked principal.
- Pausing never traps funds: refunds, withdrawals and claims are not pausable.

## Known limitations

- Unaudited.
- Dust: `rewardRate = total / rewardsDuration` uses integer division, so up to `rewardsDuration − 1` wei per round stays unstreamed.
- No on-chain treasury logic. The 30% treasury allocation is a policy, not enforced by these contracts.
- Vesting assumes the token has standard ERC-20 behavior (no fee-on-transfer or rebasing).

## License

MIT