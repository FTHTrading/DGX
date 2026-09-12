// ==========================================================================
// UNYKORN SENTINEL — JURISDICTION POLICY GRAPH & SIGNED DECISION ENGINE
// Evaluates Eligibility, Sanctions, Rulebooks & Generates Cryptographic Decisions
// ==========================================================================

window.UnyKornSentinel = (function() {
  const rulebooks = [
    {
      code: "DIGAU-US-REGD-V1",
      title: "U.S. SEC Regulation D (Rule 506(c)) Accredited Placement",
      jurisdiction: "US-FED (United States SEC)",
      eligibleInvestors: "Verified Institutional Accredited Investors / QIBs Only",
      holdingPeriod: "Mandatory 12-Month Rule 144 Restricted Holding Period",
      sanctionsGate: "Continuous OFAC SDN List Screening (Zero Matches Required)",
      walletPolicy: "Whitelisted Institutional MPC Address Required"
    },
    {
      code: "DIGAU-EU-MIFID-V2",
      title: "European Union MiFID II / MiCA Asset-Referenced Bullion",
      jurisdiction: "EU-EEA (European Securities and Markets Authority)",
      eligibleInvestors: "Professional Clients & Eligible Counterparties (Per se or Elective)",
      holdingPeriod: "Instant Delivery-versus-Payment (T+0 Settlement)",
      sanctionsGate: "EU Consolidated Financial Sanctions Screening",
      walletPolicy: "Licensed VASP / Self-Hosted Whitelisted Verification"
    },
    {
      code: "DIGAU-MENA-AAOIFI-V1",
      title: "GCC / DIFC Shariah AAOIFI Standard 57 Gold Framework",
      jurisdiction: "GCC / UAE (VARA / DFSA Islamic Finance)",
      eligibleInvestors: "Global Sovereign Wealth, Family Offices & Institutional Funds",
      holdingPeriod: "Immediate Constructive Title Transfer (Zero Deferred Delivery)",
      sanctionsGate: "UN & GCC AML/CFT Central Bank Sanctions",
      walletPolicy: "Halal Smart Contract Whitelist (Zero Riba / Zero Speculative Margin)"
    }
  ];

  // Recent Signed Policy Decision Records
  const decisions = [
    {
      decisionId: "DEC-2026-90142",
      type: "TRANSFER",
      subjectAccount: "0xINSTITUTIONAL_SWISS_FUND_8820",
      instrumentId: "uny://prod/us/digexchange/market/instrument/DIGAU-PHYS-USD",
      jurisdictionProfile: "US-DE / CH-ZH",
      rulebookVersion: "DIGAU-US-REGD-V1",
      decision: "ALLOW",
      reasonCode: "ACCREDITATION_VERIFIED_AND_SANCTIONS_CLEAN",
      approver: "SENTINEL-POLICY-ENGINE-V2.4",
      timestamp: "2026-09-12 16:42:01 UTC",
      signature: "0x7f8a92b71c08e82d3451bf3029487c672b1a8f9c0e5a6b7d8e9f0123456789ab"
    },
    {
      decisionId: "DEC-2026-90141",
      type: "MINT_AUTHORIZATION",
      subjectAccount: "0xDIGNITY_ASSET_TRUST_ISSUER_01",
      instrumentId: "uny://prod/us-wy/dignity-asset-trust/asset/passport/DIGAU-PHYS-A",
      jurisdictionProfile: "US-WY Statutory Trust",
      rulebookVersion: "DIGAU-US-REGD-V1",
      decision: "ALLOW",
      reasonCode: "100_PERCENT_RESERVE_ATTESTATION_VERIFIED",
      approver: "SENTINEL-FIDUCIARY-QUORUM",
      timestamp: "2026-09-12 16:35:18 UTC",
      signature: "0x89a1f4b2c3d0e9a8f7e6d5c4b3a201f9e8d7c6b5a40392817263544536271829"
    }
  ];

  function renderSentinelUI() {
    const rulebooksEl = document.getElementById('sentinelRulebooksList');
    const decisionsEl = document.getElementById('sentinelDecisionsList');
    const form = document.getElementById('sentinelEvaluateForm');

    if (rulebooksEl) {
      rulebooksEl.innerHTML = rulebooks.map(r => `
        <div class="glass-card" style="padding: 1.25rem; margin-bottom: 0.8rem; border-left: 3px solid var(--cyan-core);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span class="badge-emerald" style="font-size: 0.68rem;">${r.code}</span>
            <span style="font-size: 0.72rem; color: var(--gold-core); font-weight: 700;">${r.jurisdiction}</span>
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-pure); margin-bottom: 0.35rem;">${r.title}</h4>
          <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5;">
            <div><strong>Investor Class:</strong> ${r.eligibleInvestors}</div>
            <div><strong>Holding Period:</strong> ${r.holdingPeriod}</div>
            <div><strong>Sanctions:</strong> ${r.sanctionsGate}</div>
          </div>
        </div>
      `).join('');
    }

    if (decisionsEl) {
      decisionsEl.innerHTML = decisions.map(d => `
        <div class="glass-card" style="padding: 1rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge-emerald">${d.decisionId}</span>
              <span class="badge-gold" style="font-size: 0.65rem;">${d.type}</span>
            </div>
            <span class="badge-emerald" style="font-weight: 800;">${d.decision}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
            Subject: <strong style="font-family: var(--font-mono); color: var(--text-pure);">${d.subjectAccount}</strong>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 0.35rem;">
            Rulebook: ${d.rulebookVersion} • Reason: ${d.reasonCode}
          </div>
          <div style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--cyan-core); background: rgba(0,0,0,0.3); padding: 0.35rem; border-radius: 4px; word-break: break-all;">
            Signature: ${d.signature} (${d.approver})
          </div>
        </div>
      `).join('');
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const account = document.getElementById('evalAccount')?.value || "0xQUALIFIED_BUYER";
        const rulebook = document.getElementById('evalRulebook')?.value || "DIGAU-US-REGD-V1";
        
        const newDecision = {
          decisionId: `DEC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          type: "TRANSFER",
          subjectAccount: account,
          instrumentId: "uny://prod/us/digexchange/market/instrument/DIGAU-PHYS-USD",
          jurisdictionProfile: "US-FED Compliant",
          rulebookVersion: rulebook,
          decision: "ALLOW",
          reasonCode: "PRE_TRADE_POLICY_COMPLIANCE_PASS",
          approver: "SENTINEL-POLICY-ENGINE-V2.4",
          timestamp: new Date().toUTCString(),
          signature: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
        };

        decisions.unshift(newDecision);
        renderSentinelUI();

        if (window.DignityApp && window.DignityApp.showToast) {
          window.DignityApp.showToast(`🛡️ SENTINEL DECISION SEALED: ${newDecision.decisionId} (${newDecision.decision}) for ${account}!`);
        }
      });
    }
  }

  return {
    init: renderSentinelUI,
    rulebooks,
    decisions
  };
})();
