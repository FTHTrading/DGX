# DGX GLOBAL GOLD NETWORK // SOVEREIGN L1 & MINING RWA FORGE
## Institutional Sovereign Blockchain • 5 Corporate Spin-Off Divisions • Mine Forward Streaming Engine

[![GitHub Repo](https://img.shields.io/badge/GitHub-FTHTrading%2FDGX-D4AF37?style=flat&logo=github)](https://github.com/FTHTrading/DGX)
[![License](https://img.shields.io/badge/License-Institutional%20Commercial-blue.svg)](LICENSE.md)
[![Rust](https://img.shields.io/badge/Rust-1.75%2B-orange.svg)](crates/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636.svg)](contracts/)
[![Post-Quantum](https://img.shields.io/badge/NIST-Dilithium--3-emerald.svg)](crates/dgx-quantum/)

---

## 🏛️ Executive Ecosystem Overview

The **DGX Global Gold Network** is an institutional sovereign market-infrastructure operating system engineered specifically for physical bullion banks, mining concession operators, and sovereign allocators.

Unlike retail wrapped-token projects or monolithic smart contracts on congested chains, DGX is built as a **Sovereign Layer-1 Network** with a **Hedge Fund Corporate Architecture** comprising **5 Autonomous Operating Divisions**:

```
                            ┌────────────────────────────────────────┐
                            │      DGX GLOBAL HOLDINGS (L1 DAO)      │
                            │    Sovereign Asset & Governance Core   │
                            └───────────────────┬────────────────────┘
                                                │
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         │                  │                   │                   │                  │
         ▼                  ▼                   ▼                   ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   DIVISION 1    │ │   DIVISION 2    │ │   DIVISION 3    │ │   DIVISION 4    │ │   DIVISION 5    │
│  DGX Sovereign  │ │    DGX Vault    │ │   DGX Mining    │ │    DGX Prime    │ │ DGX Green Gold│
│ L1 Network Corp │ │   Custody SPV   │ │ Concessions Cap │ │  Liquidity Desk │ │ & IoT Carbon  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 📂 Repository Directory Layout

| Directory | Purpose | Key Artifacts |
| :--- | :--- | :--- |
| **`crates/`** | Sovereign Layer-1 Blockchain Core (Rust Workspace) | `dgx-core`, `dgx-consensus`, `dgx-quantum`, `dgx-exchange`, `dgx-mining-forge`, `dgx-node` |
| **`contracts/`** | Production Smart Contract Suite (Solidity & Foundry) | `DGXBullionToken.sol`, `MiningStreamingForge.sol`, `AtomicSettlementDvP.sol`, `ProofOfReservesOracle.sol`, `IoTEsgOffsetRegistry.sol` |
| **`hedge_fund_structure/`** | Corporate & Fund Legal Architecture | `CORPORATE_DIVISIONS_MATRIX.md`, `SPV_STATUTORY_TRUST_CHARTER.md`, `FORWARD_STREAMING_FACILITY.md`, `REGULATORY_COMPLIANCE_PERIMETER.md` |
| **`investor_deck/`** | Capital Formation & Investment Deck Suite | `INVESTOR_DECK.md` (12 Slides), `EXECUTIVE_SUMMARY.md`, `WHITEPAPER.md`, `FINANCIAL_MODEL_PROJECTIONS.md`, `TIMELINE_AND_PHASED_SPINOFFS.md` |
| **`web/`** | Institutional Web Portal & Investor Terminal | `index.html`, `css/styles.css`, `js/app.js`, `_headers` (Cloudflare Pages deployable) |

---

## 📜 Smart Contract Suite (`contracts/src/`)

1. **`DGXBullionToken.sol`**:
   * 1:1 allocated backing against verified 400 oz LBMA Good Delivery bars.
   * On-chain serialized Bar Passport registry (refiner, assay, vault bin, Lloyd's policy hash).
   * Regulatory compliance whitelist hooks (ERC-20 + ERC-3643 rails).
2. **`MiningStreamingForge.sol`**:
   * Institutional forward streaming underwriting for in-ground NI 43-101 / JORC gold reserves.
   * Locks $750/oz purchase delivery price, generating 70%+ cash margins.
   * Automated refinery delivery receipt verification and token distribution.
3. **`AtomicSettlementDvP.sol`**:
   * Delivery-versus-Payment escrow smart contract eliminating counterparty credit risk.
4. **`ProofOfReservesOracle.sol`**:
   * Vault auditor attestation feed stamping verified bar counts and weights.
5. **`IoTEsgOffsetRegistry.sol`**:
   * Connects IoT mining telemetry with voluntary carbon credit retirement for "Net-Zero Green Bullion".

---

## ⚙️ Sovereign L1 Engine (`crates/`)

Written in pure Rust for mission-critical determinism, memory safety, and high throughput:
* **`dgx-quantum`**: NIST FIPS 204 Crystals-Dilithium-3 lattice signatures and hardware QRNG vacuum beacons.
* **`dgx-core`**: LBMA serialized bar registers, NI 43-101 in-ground geological reserve ledgers, Pedersen shielded balances.
* **`dgx-consensus`**: Proof-of-Gold QBFT Byzantine consensus engine with 1-second finality.
* **`dgx-exchange`**: In-memory limit order book and atomic DvP matching engine.
* **`dgx-mining-forge`**: Forward streaming mathematical amortization and royalty cash-flow calculation engine.
* **`dgx-node`**: Full node server binary exposing institutional JSON-RPC endpoints.

### Building and Testing the Rust Node
```bash
# Check all workspace crates
cargo check --workspace

# Build the complete release workspace
cargo build --release --workspace

# Run the DGX full node
cargo run -p dgx-node
```

---

## 📊 Capital Formation & Funding Roadmap

* **Phase 1: Genesis & Custody Foundation ($50M)**: L1 Testnet, 15,000 oz initial physical gold treasury, SEC Reg D 506(c) filing, Zurich Freezone enclave.
* **Phase 2: Mine Streaming Capital Spin-Off ($100M)**: Spin off Division 3 as an autonomous royalty vehicle, underwrite 3 commercial mines, launch IoT ESG registry.
* **Phase 3: Prime DvP Exchange ($150M)**: Regulated Alternative Trading System (ATS), BitGo Trust custody integration, 250,000+ oz AUC.
* **Phase 4: Sovereign Expansion & Public Dual-Track IPO ($300M+)**: Public listing on TSX/NYSE, central bank reserve integrations, $4.0B+ vaulted assets.

---

## 🌐 Live Web Terminal & Investor Deck
The `web/` directory contains the complete institutional frontend ready for Cloudflare Pages deployment:
* **Real-time DignityScan L1 Block Explorer**
* **Interactive 12-Slide Pitch Deck Player**
* **5 Hedge Fund Corporate Divisions Visual Matrix**
* **Mining Streaming Cash-Flow Calculator**
* **Interactive Rust/Python/TS Smart Contracts Terminal**
* **Dark & Institutional Light Mode Support**

---

## 🛡️ License
Copyright © 2026 FTH Trading / UnyKorn LLC. All rights reserved. Licensed under the Institutional Commercial License (see [`LICENSE.md`](LICENSE.md)).
