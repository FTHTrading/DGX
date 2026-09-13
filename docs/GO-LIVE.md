# What it takes to go live

An honest list. Ranges are planning estimates, not quotes or commitments, and
every one of them depends on the state of the underlying records.

---

## The gate is not software

Five things stand between this code and a live instrument. Four of them are
people or licensed entities. Writing more Solidity moves none of them.

| # | Blocker | Who closes it | Rough time | Rough cost |
|---|---|---|---|---|
| 1 | **Third-party security audit** | An audit firm | 3–6 weeks queued, 1–2 weeks active | $40k–$120k for this scope |
| 2 | **Securities counsel opinion** | Counsel | 4–8 weeks | Engagement-dependent |
| 3 | **Registered broker-dealer** | The issuer appoints | 2–6 weeks if a relationship exists | Fee + selling concession |
| 4 | **Qualified custodian** | The issuer appoints | 6–12 weeks incl. onboarding diligence | Setup + basis points on AUC |
| 5 | **Transfer agent** | The issuer appoints | 3–6 weeks | Setup + per-holder |

Items 3, 4 and 5 run in parallel. Item 1 can start immediately and should —
it is the only one on this list that is purely a function of writing a cheque
and waiting in a queue.

---

## The engineering that remains

Genuinely small compared to the above.

- **Deploy scripts** — Foundry scripts with per-network config. 3–5 days.
- **Multisig migration** — move every admin, issuer, verifier and attestor role
  off EOAs onto Safes. The two-step handoff already exists in the contracts.
  2–3 days including a dry run on testnet.
- **Testnet deployment and a full rehearsal** — mint, transfer, blocked
  transfer, freeze, subscription, cushion breach, distribution, cash trap,
  redemption. 1 week.
- **Indexer / subgraph** — so holders and auditors can read state without an
  archive node. 1–2 weeks.
- **DGX native suite test coverage** — currently 2 tests against 5 contracts.
  Bringing it to the standard of the capital-markets suite is 1–2 weeks and
  should happen before an audit, not after, because auditing untested code
  costs more and finds less.

---

## Sequencing that actually works

```
Week 0    Commission the audit. Freeze contract scope the day you commission it.
Week 0    Start custodian and transfer-agent onboarding in parallel.
Week 1-2  Raise DGX native suite coverage. Write deploy scripts.
Week 2-3  Testnet deployment. Full rehearsal against the script above.
Week 3-6  Audit active. Remediate findings. Re-test.
Week 6-8  Counsel reviews the audited code alongside the offering documents.
Week 8+   Mainnet, gated on all five appointments being executed, not verbal.
```

The one sequencing mistake to avoid: **do not commission the audit while the
contracts are still moving.** Every change after the freeze either falls
outside the audit scope or triggers a re-review, and both are expensive.

---

## Things that must be true before anyone signs a subscription agreement

Not engineering items. Listed because they gate the same date.

- The audit report exists, is dated, and covers the deployed commit hash.
- No document in the offering pack cites another protocol's audit.
- Reserve and resource categories are stated under the correct standard, with
  the qualified person and effective date named.
- The custodian is appointed in writing and holds identified metal apart from
  the issuer, or the instrument does not describe itself as backed by metal.
- Every admin role sits behind a multisig whose signers can demonstrably sign.
- Where a role is unfilled, the disclosure says unfilled.

That last one is the cheapest thing on this page and the one most often skipped.

---

## What is already done

Worth stating plainly, because the list above is long and the work behind it is
real:

- Five capital-markets contracts, **78 passing tests**, including fuzz coverage
  on the waterfall conservation invariant and the claim-expiry boundary.
- Compliance topics mapped to actual exemptions — 506(c), 3(c)(7), AU s708,
  Reg S — rather than a single boolean "approved" flag.
- Transfer restrictions that revert rather than settle-and-unwind.
- A waterfall that proves conservation on every distribution.
- Two-step role handoff on every privileged role.
- Document anchoring with a four-state status and caller-side re-hashing.
- Five DGX native contracts covering bar passporting, concession streaming,
  reserves attestation, DvP settlement and ESG retirement — compiling clean.

The instrument layer is built. The appointments are not.
