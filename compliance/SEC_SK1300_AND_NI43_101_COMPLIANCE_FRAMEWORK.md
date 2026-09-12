# SEC REGULATION S-K SUBPART 1300 & NI 43-101 COMPLIANCE FRAMEWORK
## Institutional Reserve Disclosure, Qualified Person Attestation, and In-Ground Asset Underwriting

---

### 1. Regulatory Context & Statutory Precedence
Historically, US public disclosures for mining properties were governed by **SEC Industry Guide 7**. In 2018, the US Securities and Exchange Commission modernized its disclosure framework by adopting **Regulation S-K subpart 1300 (Items 1300 through 1305)**, aligning US reporting with the Committee for Mineral Reserves International Reporting Standards (CRIRSCO) and Canadian **National Instrument 43-101 (NI 43-101)**.

DGX strictly adheres to SEC S-K 1300 and NI 43-101 standards when tokenizing in-ground mineral rights and underwriting forward streaming facilities.

---

### 2. Mineral Classification Hierarchy

```
INCREASING LEVEL OF GEOLOGICAL KNOWLEDGE & CONFIDENCE
─────────────────────────────────────────────────────────────────────────────►

   EXPLORATION RESULTS
          │
          ▼
   MINERAL RESOURCES (Reasonable Prospects for Economic Extraction)
   ├─ Inferred Mineral Resource (Low confidence; excluded from DGX streams)
   ├─ Indicated Mineral Resource (Moderate confidence)
   └─ Measured Mineral Resource (High confidence)
          │
          ▼ (Modifying Factors: Mining, Metallurgical, Economic, Permitting)
   MINERAL RESERVES (Economically Mineable Part of Measured & Indicated)
   ├─ Probable Mineral Reserve (Underwritten with 2.5x coverage threshold)
   └─ Proven Mineral Reserve (Highest confidence; prime streaming collateral)
```

---

### 3. Qualified Person (QP) Requisites
Under Item 1302 of Regulation S-K and Section 1.1 of NI 43-101, all reserve estimates incorporated into the DGX Sovereign L1 must be certified by a Qualified Person who:
1. Is an engineer or geoscientist with a minimum of five (5) years of relevant experience in the specific commodity (gold) and deposit type (e.g. Carlin epithermal, orogenic vein, placer);
2. Is a member in good standing of a recognized professional organization with enforceable disciplinary powers (e.g. Society for Mining, Metallurgy & Exploration [SME], Canadian Institute of Mining [CIM], or AusIMM);
3. Prepares and executes an independent **Technical Report Summary (TRS)** conforming to Item 601(b)(96) of Regulation S-K.

---

### 4. Mathematical Haircut & Underwriting Discount Formula
To ensure capital preservation and insulate DGX token holders from unextracted geological risk, DGX applies a conservative two-tier haircut:

1. **Reserve Coverage Gate**:
   $$\text{Coverage Ratio} = \frac{\text{Proven and Probable Reserves (Fine Oz)}}{\text{Total Committed Forward Stream (Fine Oz)}} \ge 2.50\times$$

2. **In-Ground Net Asset Value (NAV) Haircut**:
   $$\text{Discounted In-Ground Value} = \text{Fine Oz} \times P_{\text{spot}} \times (1 - H_{\text{extraction}})$$
   Where $H_{\text{extraction}}$ is set at **68.0%**, reflecting:
   * Mining extraction recovery factors (typically 85-92%);
   * Smelting and refinery deductions (1-2%);
   * Fuel, explosive, and labor inflation contingencies (15%);
   * Time-value of money discount over Life of Mine (LOM).

---

### 5. SEC Form 8-K / EDGAR Filing Integration
For publicly traded mining operators in the US and Canada:
* The Technical Report Summary is filed as **Exhibit 96.1** to the operator's Form 10-K or Form 8-K on the SEC EDGAR system;
* The cryptographic hash of the EDGAR filing is permanently stamped into `MiningStreamingForge.sol` upon concession enrollment.
