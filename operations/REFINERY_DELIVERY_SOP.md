# PHYSICAL REFINERY INTAKE & VAULT ENCLAVE SOP
## Standard Operating Procedure: Doré Transport, LBMA Assay, and Bar Passport Enrollment

---

### Phase A: Armored Transport & Refinery Receipt
1. **Armored Carrier**: Unrefined doré bars are transported from mine site to refinery via certified armored transit (Brink's Global Services, Loomis International, or Malca-Amit).
2. **Chain of Custody Tracking**: Real-time GPS and tamper-evident seal verification logged on the DGX L1 audit channel.
3. **Refinery Intake**: Delivered to accredited LBMA Good Delivery refiner:
   * Valcambi SA (Balerna, Switzerland)
   * PAMP SA (Castel San Pietro, Switzerland)
   * Argor-Heraeus SA (Mendrisio, Switzerland)
   * The Perth Mint (Perth, Australia)

---

### Phase B: Smelting, Fire Assay & Good Delivery Casting
1. **Melting & Homogenization**: Doré is melted and sampled via vacuum pin tube.
2. **Independent Fire Assay**: Double fire assay testing to establish fine gold content to four decimal places (minimum 999.9 parts per thousand).
3. **Casting into LBMA 400 oz Bars**: Cast into standard Good Delivery bars stamped with refiner seal, serial number, year of manufacture, and fineness mark.

---

### Phase C: Depository Vault Intake & Blockchain Bar Passport Enrollment
1. **Vault Transfer**: Armored transfer from refinery into bonded vault enclaves:
   * **Zurich Freezone (Embrach / Kloten, Switzerland)**
   * **London LBMA Depository Vaults (United Kingdom)**
   * **Delaware Depository (Wilmington, USA)**
2. **Lloyd's Specie Policy Activation**: Bars enrolled under master policy ($1,000,000,000 coverage limit).
3. **Cryptographic Enrollment**: The DGX Trustee issues `dgx_enrollBarPassport` on-chain:
   * Bar Serial Number
   * Gross Weight & Fine Weight
   * Assay Fineness (9999)
   * Vault Enclave & Bin Coordinates
   * Lloyd's Insurance Certificate IPFS Hash
4. **Token Minting**: 1:1 DGX Bullion Tokens are minted to the SPV Trust allocation address.
