// ==========================================================================
// DIGNITY GOLD // INTERNAL CUSTODY & TIER-1 INSURANCE DESK
// Segregated Cold Vault Depository Accounts & Lloyd's/Marsh/AON Policies
// ==========================================================================

window.DignityCustodyInsurance = (function() {
  function init() {
    renderVaults();
    renderInsurance();
  }

  function renderVaults() {
    const grid = document.getElementById('vaultsDepositoryGrid');
    if (!grid) return;

    const vaults = window.DIGNITY_GLOBAL_NETWORK.vaults;
    grid.innerHTML = vaults.map(v => `
      <div class="vault-depository-card">
        <div class="vault-card-top">
          <div>
            <div class="vault-title">${v.facilityName}</div>
            <div class="vault-sub">${v.operator} • ${v.jurisdiction}</div>
          </div>
          <span class="rwa-badge badge-gold">${v.vaultId}</span>
        </div>

        <div class="vault-stat-row">
          <div class="vault-stat">
            <span class="lbl">Bars In Vault:</span>
            <span class="val">${v.barsStored} Good Delivery</span>
          </div>
          <div class="vault-stat">
            <span class="lbl">Fine Weight:</span>
            <span class="val gold">${v.totalFineOz.toFixed(3)} oz</span>
          </div>
          <div class="vault-stat">
            <span class="lbl">Segregated Account:</span>
            <span class="val mono">${v.segregatedAccount}</span>
          </div>
        </div>

        <div class="vault-insurance-pill">
          🛡️ <strong>Active Policy:</strong> ${v.insurancePolicy} ($${(v.coverageLimitUsd/1e6).toFixed(0)}M Limit)
        </div>

        <div class="vault-footer">
          <div>Security: <span>${v.securityRating}</span></div>
          <div>Auditor: <span>${v.auditor}</span></div>
        </div>
      </div>
    `).join('');
  }

  function renderInsurance() {
    const list = document.getElementById('insurancePoliciesList');
    if (!list) return;

    const policies = [
      {
        policyNumber: "LLOYDS-LBN-VAL-9918",
        underwriter: "Lloyd's Syndicate 2003 / Catlin Underwriting Ltd",
        type: "Comprehensive Specie Insurance (All-Risks Physical Bullion)",
        coverageLimit: "$50,000,000 USD",
        coveredRisks: "Physical loss, theft, armed robbery, mysterious disappearance, vault sabotage, and safe transit.",
        vaultFacility: "Zurich Freezone Depository Enclave (Switzerland)",
        status: "ACTIVE • POLICY IN GOOD STANDING",
        certHash: "0x9812739812739182739812739182739812739182739182739812739812739812"
      },
      {
        policyNumber: "MARSH-UK-LBMA-4402",
        underwriter: "Chubb European Group SE / Marsh McLennan Specialty",
        type: "Precious Metals Depository & Transit Specie Cover",
        coverageLimit: "$75,000,000 USD",
        coveredRisks: "Complete bullion physical damage, vault breach, catastrophic physical events, and armored carrier transit.",
        vaultFacility: "London LBMA Vault Enclaves (United Kingdom)",
        status: "ACTIVE • POLICY IN GOOD STANDING",
        certHash: "0x1273891273981273981273981273981273981273981273981273981273981273"
      },
      {
        policyNumber: "AON-US-DEL-5510",
        underwriter: "Travelers Casualty & Surety Co / AON Risk Solutions",
        type: "Commercial Crime & Depository Safe Custody Bond",
        coverageLimit: "$40,000,000 USD",
        coveredRisks: "Depository insider fidelity, fraudulent alteration, armed entry, and physical disappearance.",
        vaultFacility: "Delaware Depository Service Company (United States)",
        status: "ACTIVE • POLICY IN GOOD STANDING",
        certHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      }
    ];

    list.innerHTML = policies.map(p => `
      <div class="policy-card">
        <div class="policy-header">
          <div>
            <div class="policy-num">${p.policyNumber}</div>
            <div class="policy-underwriter">${p.underwriter}</div>
          </div>
          <div class="policy-limit-tag">${p.coverageLimit}</div>
        </div>
        <div class="policy-type">${p.type}</div>
        <div class="policy-facility">Facility: <strong>${p.vaultFacility}</strong></div>
        <div class="policy-risks">${p.coveredRisks}</div>
        <div class="policy-footer">
          <span class="policy-status">${p.status}</span>
          <span class="policy-hash mono">Cert Hash: ${p.certHash.slice(0, 20)}...</span>
        </div>
      </div>
    `).join('');
  }

  return {
    init
  };
})();
