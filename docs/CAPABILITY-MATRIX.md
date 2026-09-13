# What this code can and cannot do

For the Dignity team, counsel, and anyone deciding whether to build on it.

Read this before the architecture diagrams. Most tokenization projects fail at
exactly the line this page draws — they ship contracts that *look* like they
cover the right-hand column.

---

## Audit status, first, because it changes how you read everything else

**No third-party audit exists on any contract in this repository.** Not Trail of
Bits, not Spearbit, not Quantstamp, not OpenZeppelin, not anyone.

What does exist: **78 passing tests** across the five capital-markets contracts,
including fuzz runs at 512 iterations on the waterfall conservation invariant
and the claim-expiry boundary. That is meaningful engineering evidence. It is
not an audit and does not substitute for one.

One specific warning, because it has bitten this material before: if any
document near this code cites audits by Centrifuge, Maple, Ondo or Goldfinch —
those audits belong to *those protocols*. They do not cover this code. Placing
them next to a subscription agreement tells a purchaser something untrue. The
offering runs under Reg D 506(c), which is general solicitation, so the
disclosure standard is not relaxed.

---

## A contract CAN enforce these

| Capability | Contract | How |
|---|---|---|
| Refuse a transfer to an ineligible holder | `PermissionedToken` | Registry check inside `transfer` / `transferFrom`; reverts, does not settle-then-unwind |
| Refuse a transfer *from* an ineligible holder | `PermissionedToken` | Same gate on the sender side |
| Hard-freeze an address | `ComplianceRegistry` | `setFrozen` overrides live claims without destroying them |
| Expire an accreditation automatically | `ComplianceRegistry` | Mandatory future `expiresAt`; no permanent flag exists |
| Block a jurisdiction | `ComplianceRegistry` | `isBlockedJurisdiction`; unknown jurisdiction fails closed |
| Run different eligibility per instrument | `ComplianceRegistry` | `isEligible(subject, requiredTopics)` — 506(c) and Reg S off one registry |
| Enforce tranche seniority | `TrancheVault` | Senior and junior targets with coupons |
| Enforce a junior cushion | `TrancheVault` | `recordSubscription` reverts with `JuniorCushionBreached` |
| Pay in strict waterfall order | `WaterfallDistributor` | Fee → senior interest → senior principal → junior interest → junior principal → residual |
| Trap cash to senior on covenant breach | `WaterfallDistributor` | Cash-trap mode skips junior interest |
| Prove distributions conserve | `WaterfallDistributor` | Reverts `ConservationBroken`; fuzz-tested across 512 runs |
| Cap fees | `WaterfallDistributor` | Hard basis-point ceiling in `setFeeBps` |
| Anchor a document digest with expiry and revocation | `ReserveProofAnchor` | Four-state status, not a boolean |
| Force a verifier to hold the real document | `ReserveProofAnchor` | `verifyDocument(bytes)` re-hashes the caller's bytes |
| Settle payment against asset atomically | `AtomicSettlementDvP` | Both legs or neither |
| Bind minted units to a specific bar | `DGXBullionToken` | `LbmaBarPassport` per bar hash |
| Survive a lost issuer key without orphaning the role | `PermissionedToken`, `TrancheVault` | Two-step role handoff |

---

## A contract CANNOT do these, and no Solidity will change it

| Claim | Reality |
|---|---|
| **Issue or confirm an SBLC** | A bank instrument moved over SWIFT under ICC UCP 600. `ReserveProofAnchor` records that *someone holding an attestor key asserted a digest*. It does not prove a bank issued anything. |
| **Confirm custody** | Whether a vault holds metal is a fact about a vault. An anchored custody receipt is a hash of a *claim* about a vault. |
| **Prove reserves exist** | `ProofOfReservesOracle` records what an auditor typed. The contract cannot visit the vault. |
| **File a FinCEN CTR or AUSTRAC IFTI** | Filed by the bank, off chain, by people. |
| **Guarantee a yield** | A distribution contract pays out what it receives. Nothing more exists to pay. |
| **Verify accreditation** | `ComplianceRegistry` records that a designated verifier asserted a claim and when it lapses. Whether that verifier's steps were "reasonable" under 506(c) is a judgement for compliance and counsel. |
| **Make an unexecuted document binding** | An anchored digest of a draft is a digest of a draft. |
| **Convert a resource into a reserve** | That takes a qualified person and a study. See the note on terminology below. |
| **Perfect a lien** | Filed at a county recorder or under the UCC. On-chain records are not a substitute for the filing. |
| **Give a token holder title to metal** | Requires an appointed custodian holding identified metal apart from the issuer. Until one exists, a holder has a contractual claim, whatever the token is called. |

---

## Terminology, used precisely

The distinction below is not pedantry — it is the difference between a
compliant disclosure and a misleading one.

- **Mineral resource** — a geological estimate. Not demonstrated to be
  economically mineable. Sub-classified *measured*, *indicated*, *inferred* by
  confidence.
- **Mineral reserve** — the economically mineable part of a measured or
  indicated resource, after modifying factors. Sub-classified *proven* and
  *probable*.
- A resource is **not** a reserve. Converting one to the other requires a
  study, not a restatement.
- **S-K 1300** governs SEC registrants and requires a qualified person and,
  where relevant, a dated and signed technical report summary. **NI 43-101** is
  the Canadian regime with different definitions. Which one governs is stated
  per asset, never assumed.
- **Effective date** is the date an estimate speaks to, not its publication
  date.

---

## What this means for the Dignity team

You can build a compliant, restricted, tranched instrument on this code today
and have the transfer restrictions actually enforce. That part is real and
tested.

What you cannot do is let the contracts stand in for the appointments. The gate
that is open is not a software gate — it is counsel, a registered
broker-dealer, a qualified custodian, a transfer agent, and a third-party
audit. Every one of those is a person or a licensed entity, and the code is
waiting on them, not the other way round.

See `docs/GO-LIVE.md` for what closing that gate actually takes.
