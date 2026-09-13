# Integration guide

For developers wiring the capital-markets suite into a deployment.

## Build and test

```bash
cd contracts-capital-markets
forge install foundry-rs/forge-std      # lib/ is gitignored
forge build
forge test                              # expect 78 passing, 0 failing
```

```bash
cd contracts                            # DGX native suite
forge build
forge test                              # expect 2 passing
```

Toolchain used for the recorded run: Foundry 1.6.0-nightly, solc 0.8.20 for the
DGX native suite, `>=0.8.13` pragma on capital markets.

---

## Deploy order

Dependencies run strictly downhill. Deploy in this order or constructor args
will not resolve.

```
1. ComplianceRegistry          (no dependencies)
2. ReserveProofAnchor          (no dependencies)
3. PermissionedToken           (needs ComplianceRegistry address + requiredTopics[])
4. TrancheVault                (independent; admin-driven)
5. WaterfallDistributor        (needs the four sink addresses)
```

`requiredTopics` is fixed at construction on `PermissionedToken`. Choose it
deliberately: a 506(c) instrument wants `[1, 2, 3]` (KYC, sanctions,
accredited); a Reg S tranche wants `[1, 2, 6]`. If you need both, deploy two
tokens against one registry rather than loosening the topic set.

---

## Role assignments after deploy

| Contract | Role | Who should hold it | Notes |
|---|---|---|---|
| `ComplianceRegistry` | `admin` | Multisig | Sets verifiers, blocks jurisdictions, freezes |
| `ComplianceRegistry` | `isVerifier[]` | KYC provider's signing key | Issues and revokes claims, sets jurisdiction |
| `ReserveProofAnchor` | `admin` | Multisig | Appoints attestors |
| `ReserveProofAnchor` | `isAttestor[]` | Auditor / custodian key | Anchors and revokes digests |
| `PermissionedToken` | `issuer` | Multisig | Mints, burns, force-transfers, pauses |
| `TrancheVault` | `admin` | Multisig | Sets targets and mode, records subscriptions |
| `WaterfallDistributor` | `admin` | Multisig | Accrues and distributes |

**Do not leave any of these on a single EOA in production.** Every one of them
supports being pointed at a Safe, and `PermissionedToken` / `TrancheVault` /
`WaterfallDistributor` all implement two-step handoff (`initiate…` then
`accept…`) precisely so the move to a multisig cannot orphan the role.

Separate the admin key from the verifier and attestor keys. The whole value of
the claim record is that the person who asserted something is distinguishable
from the person who runs the system.

---

## Gotchas that cost real time

**The sha256 precompile eats your cheatcode.** `sha256()` in Solidity compiles
to a staticcall to the precompile at `0x02`. Writing this:

```solidity
vm.prank(attestor);
anchor.anchor(sha256(doc), ...);   // WRONG
```

lets the precompile consume the prank, and the real call arrives from the test
contract. Same trap with `vm.expectRevert`. Hoist the digest into a local
first:

```solidity
bytes32 digest = sha256(doc);
vm.prank(attestor);
anchor.anchor(digest, ...);        // right
```

This produced seven false failures on the first run of the suite. It is the
single most expensive thing in this codebase to rediscover.

**Claim expiry is exclusive of the expiry instant.** A claim expiring at `T` is
invalid *at* `T`, not after it. `testFuzz_expiryBoundaryIsExclusiveOfExpiryInstant`
pins this. If you are computing renewal windows, do not be off by one second.

**`bytes2(0)` jurisdiction is a fail, not a default.** Set jurisdiction
explicitly for every subject before expecting eligibility to pass.

**Force-transfer still checks the recipient.** If you are building a recovery
flow for lost keys, the destination wallet needs claims issued first.

**Distribution reverts on zero gross.** Guard your scheduler.

---

## Per-jurisdiction configuration

`jurisdictionOf` is a `bytes2` — use ISO 3166-1 alpha-2, uppercase ASCII
(`"US"`, `"AU"`, `"KY"`). Block lists are set by the admin via
`setBlockedJurisdiction`.

Map your offering exemptions onto topics before writing any integration code:

| Offering | Topics required |
|---|---|
| US Reg D 506(c) | `[1, 2, 3]` |
| US 3(c)(7) fund | `[1, 2, 4]` |
| Australia s708 | `[1, 2, 5]` |
| Reg S offshore | `[1, 2, 6]` |

---

## What is not in this repo

Deploy scripts. Mainnet addresses. An audit. A subgraph. Upgrade proxies —
these contracts are **not** upgradeable by design, so a change means a new
deployment and a migration plan, and that is a deliberate trade rather than an
oversight.
