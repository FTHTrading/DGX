# ATOMIC DELIVERY-VERSUS-PAYMENT (DvP) SETTLEMENT PLAYBOOK
## Institutional Operational Guide for Bullion Banks, Prime Brokers & OTC Desks

---

### 1. The Atomic Settlement Imperative
In traditional bullion markets, settlement is plagued by **Herstatt Risk** (cross-currency cross-timezone settlement failure) and counterparty credit exposures over T+2 to T+5 days. DGX eliminates settlement risk by executing simultaneous delivery and payment on-chain in 1 second.

---

### 2. DvP Trade Lifecycle

```
[ Buyer: Hedge Fund / Bank ]                   [ Seller: DGX Depository / Bullion Desk ]
           │                                                       │
           │ 1. Submits Bid ($2,650.50 / 50 oz)                    │ 2. Submits Ask (Allocated Bar Passport)
           ▼                                                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           DGX AtomicSettlementDvP Smart Contract                      │
│                                                                                       │
│  • Verifies Buyer has $132,525.00 in USDC / Cash Escrow                               │
│  • Verifies Seller has 50.000 oz DGX Tokens linked to active LBMA Bar Passport        │
│  • Validates both parties are on Regulatory Whitelist (KYC/AML)                       │
│  • Executes Atomic Asset Swap in Block Height #1849204 (1-Second Finality)            │
└───────────────────────────────────────────────────────────────────────────────────────┘
           │                                                       │
           ▼ (Receives Title to Bar Passport)                      ▼ (Receives Cash / USDC)
[ Buyer: Secured Bullion Title ]               [ Seller: Immediate Cleared Funds ]
```

---

### 3. Physical Redemption Option
Any verified institutional holder of DGX tokens may exercise physical redemption:
1. Burn DGX tokens via `dgx_redeemPhysical` contract call.
2. Select delivery method:
   * **In-Vault Title Transfer**: Re-assign legal title within Zurich Freezone or London vaults (zero transport cost).
   * **Armored Secure Escort**: Physical armored delivery via Brink's to holder's designated depository facility worldwide.
