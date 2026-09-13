# Capital-markets contracts

The instrument layer: who may hold, how tranches rank, how cash is split, and
how off-chain documents are anchored.

**No third-party audit exists on this code.** 78 tests pass, including fuzz
runs. That is engineering evidence, not an audit. See
[`../docs/CAPABILITY-MATRIX.md`](../docs/CAPABILITY-MATRIX.md) before building
on it.

## Contracts

| Contract | Lines | Does |
|---|---|---|
| `ComplianceRegistry.sol` | 199 | ERC-3643-style claim layer. KYC, sanctions, 506(c), 3(c)(7), AU s708, Reg S. Jurisdiction gating, hard freeze, mandatory claim expiry. |
| `PermissionedToken.sol` | 217 | Transfer restrictions enforced against the registry. Mint, burn, force-transfer with reason, pause, two-step issuer handoff. |
| `ReserveProofAnchor.sol` | 209 | Digest anchoring with attestor, expiry and revocation. Four-state status. Caller-side re-hashing via `verifyDocument`. |
| `TrancheVault.sol` | 255 | Senior / junior tranches with targets and coupons. Junior cushion enforced on subscription. |
| `WaterfallDistributor.sol` | 304 | Fee → senior interest → senior principal → junior interest → junior principal → residual. Cash trap. Conservation asserted. |
| `IERC20.sol` | 16 | Minimal interface. |

## Run it

```bash
forge install foundry-rs/forge-std
forge build
forge test
```

Expect `78 passed; 0 failed` across 5 suites.

## Read next

- [`../docs/TOKEN-FLOW.md`](../docs/TOKEN-FLOW.md) — subscription to redemption, hop by hop
- [`../docs/CAPABILITY-MATRIX.md`](../docs/CAPABILITY-MATRIX.md) — what a contract can and cannot enforce
- [`../docs/INTEGRATION.md`](../docs/INTEGRATION.md) — deploy order, roles, and the traps
- [`../docs/GO-LIVE.md`](../docs/GO-LIVE.md) — what standing between this and production
