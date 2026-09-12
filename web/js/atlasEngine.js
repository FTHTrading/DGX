// ==========================================================================
// UNYKORN ATLAS — ASSET PASSPORT & EVIDENCE REGISTRY OS
// Governs Canonical Passports (DIGAU.PHYS vs DIGAU.RESOURCE) & Append-Only Audit Trail
// ==========================================================================

window.UnyKornAtlas = (function() {
  const passports = [
    {
      id: "PASSPORT-PHYS-001",
      canonicalUri: "uny://prod/us-wy/dignity-asset-trust/asset/passport/DIGAU-PHYS-A",
      productFamily: "DIGAU.PHYS",
      title: "Allocated Physical Gold Bullion Unit (Series A)",
      issuerEntity: "Dignity Asset Trust (Wyoming Statutory Trust)",
      issuerLei: "5493008KLP92CC1Y8810",
      custodian: "Zurich Freezone Depository Enclave (Switzerland)",
      underlyingBarsCount: 4,
      totalFineOz: 1600.415,
      fineness: "999.9 Fine Gold",
      insurancePolicy: "LLOYDS-LBN-GLOBAL-GOLD-9901 ($250M Aggregate Coverage)",
      redemptionPolicy: "Physical Bar Delivery (Minimum 400 oz) or Par Cash Wire",
      jurisdictions: ["US-DE", "US-WY", "CH-ZH", "UK-LON"],
      status: "VERIFIED & AUDITED",
      reconciliationState: "100.0% RECONCILED (0 Ounce Variance)"
    },
    {
      id: "PASSPORT-RES-002",
      canonicalUri: "uny://prod/ca-on/dignity-resource-finance/project/passport/NI43-101-NV01",
      productFamily: "DIGAU.RESOURCE",
      title: "Eureka Gold Basin Mining Reserve Claim",
      issuerEntity: "Dignity Resource Finance SPV (Ontario)",
      issuerLei: "5493001NZA73XX5T4402",
      custodian: "BLM Mining District Registry & Secured Title Enclave",
      technicalReport: "NI 43-101 Technical Feasibility Report (Effective: June 2026)",
      provenProbableOz: 2150000.0,
      measuredIndicatedOz: 4380000.0,
      averageGrade: "2.85 g/t Au",
      haircutPct: "68.0% Dynamic Extraction Haircut",
      conservativeNavUsd: 1823200000.0,
      redemptionPolicy: "NOT PRESENTLY REDEEMABLE FOR PHYSICAL GOLD BULLION (Streaming Rights Only)",
      jurisdictions: ["CA-ON", "US-NV"],
      status: "GEOLOGICALLY VERIFIED",
      reconciliationState: "NI 43-101 AUDIT COMPLIANT"
    }
  ];

  // Append-Only Evidence Registry
  const evidenceRegistry = [
    {
      evidenceId: "EVID-2026-001884",
      passportId: "PASSPORT-PHYS-001",
      attestorEntity: "Bureau Veritas Precious Metals Inspection",
      attestorLei: "549300BVINSP99881122",
      attestationType: "Physical Vault Assay & Bar Weight Verification",
      documentHash: "0x89a1f4b2c3d0e9a8f7e6d5c4b3a201f9e8d7c6b5a40392817263544536271829",
      signatureAlgo: "Ed25519-Dilithium3-Hybrid",
      effectiveDate: "2026-09-10",
      status: "AUTHENTICATED",
      auditChain: "Asset (Valcambi #VAL-CH-994820) ➔ Vault Custody ➔ Auditor Attestation ➔ Mint Auth"
    },
    {
      evidenceId: "EVID-2026-001885",
      passportId: "PASSPORT-PHYS-001",
      attestorEntity: "Lloyd's of London Specie Underwriting",
      attestorLei: "549300LLOYD9933441155",
      attestationType: "All-Risk Vault Specie Insurance Policy",
      documentHash: "0x7711223344556677889900aabbccddeeff0011223344556677889900aabbccdd",
      signatureAlgo: "RSA-PSS-4096 / SHA3-256",
      effectiveDate: "2026-09-01",
      status: "AUTHENTICATED",
      auditChain: "Custody Policy ➔ Underwriter Confirmation ➔ Fiduciary Trustee Acceptance"
    },
    {
      evidenceId: "EVID-2026-002109",
      passportId: "PASSPORT-RES-002",
      attestorEntity: "Behre Dolbear Geological Consultants",
      attestorLei: "549300GEOLAB88771199",
      attestationType: "NI 43-101 Qualified Person Technical Report Audit",
      documentHash: "0x55aa33ff11bb22cc44dd66ee880099aa11223344556677889900aabbccddeeff",
      signatureAlgo: "Ed25519-Dilithium3-Hybrid",
      effectiveDate: "2026-08-15",
      status: "AUTHENTICATED",
      auditChain: "Mining Claim ➔ Field Assay Drill Cores ➔ Qualified Person Attestation ➔ SPV Stream Auth"
    }
  ];

  function renderAtlasUI() {
    const passportListEl = document.getElementById('atlasPassportList');
    const evidenceListEl = document.getElementById('atlasEvidenceList');

    if (passportListEl) {
      passportListEl.innerHTML = passports.map(p => `
        <div class="glass-card" style="padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid var(--gold-core);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <div>
              <span class="badge-gold" style="font-size: 0.68rem;">${p.productFamily}</span>
              <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-pure); margin-top: 0.2rem;">${p.title}</h4>
              <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--cyan-core); margin-top: 0.15rem;">
                ${p.canonicalUri}
              </div>
            </div>
            <span class="badge-emerald" style="font-size: 0.68rem;">${p.reconciliationState}</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-secondary);">
            <div><strong>Issuer:</strong> ${p.issuerEntity}</div>
            <div><strong>Issuer LEI:</strong> <span style="font-family: var(--font-mono); color: var(--gold-light);">${p.issuerLei}</span></div>
            <div><strong>Custodian:</strong> ${p.custodian}</div>
            <div><strong>Redemption:</strong> <span style="color: ${p.productFamily === 'DIGAU.PHYS' ? 'var(--emerald-core)' : 'var(--amber-core)'};">${p.redemptionPolicy}</span></div>
          </div>
        </div>
      `).join('');
    }

    if (evidenceListEl) {
      evidenceListEl.innerHTML = evidenceRegistry.map(e => `
        <div class="glass-card" style="padding: 1rem; margin-bottom: 0.8rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge-emerald" style="font-size: 0.65rem;">${e.evidenceId}</span>
              <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-pure);">${e.attestationType}</span>
            </div>
            <span style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">Effective: ${e.effectiveDate}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.3rem;">
            Attestor: <strong>${e.attestorEntity}</strong> (LEI: <span style="font-family: var(--font-mono); color: var(--gold-core);">${e.attestorLei}</span>)
          </div>
          <div style="font-size: 0.7rem; font-family: var(--font-mono); color: var(--cyan-core); background: rgba(0,0,0,0.3); padding: 0.4rem; border-radius: 4px; word-break: break-all; margin-bottom: 0.35rem;">
            Document Hash: ${e.documentHash}
          </div>
          <div style="font-size: 0.7rem; color: var(--emerald-core); font-weight: 600;">
            🔗 Audit Chain: ${e.auditChain}
          </div>
        </div>
      `).join('');
    }
  }

  return {
    init: renderAtlasUI,
    passports,
    evidenceRegistry
  };
})();
