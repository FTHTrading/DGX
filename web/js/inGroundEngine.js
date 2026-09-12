// ==========================================================================
// DIGNITY GOLD SOVEREIGN L1 — IN-GROUND GEOLOGICAL ASSETS ENGINE
// Tracks NI 43-101 / JORC compliant mining claims, proven reserves & haircuts
// ==========================================================================

window.DignityInGroundEngine = (function() {
  function renderInGroundEngine() {
    const listEl = document.getElementById('inGroundConcessionsList');
    const totalPPOzEl = document.getElementById('totalPPOunces');
    const totalDiscountedValEl = document.getElementById('totalDiscountedValueUsd');

    const concessions = window.DIGNITY_GOLD_STATE.inGroundReserves;

    let totalOz = 0;
    let totalDiscounted = 0;

    concessions.forEach(c => {
      totalOz += c.provenProbableOz;
      totalDiscounted += c.discountedValueUsd;
    });

    if (totalPPOzEl) totalPPOzEl.innerText = `${(totalOz / 1000000).toFixed(2)}M Proven & Probable oz`;
    if (totalDiscountedValEl) totalDiscountedValEl.innerText = `$${(totalDiscounted / 1000000000).toFixed(2)}B Net Asset Value`;

    if (!listEl) return;

    listEl.innerHTML = concessions.map(c => `
      <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.25rem; border-left: 4px solid var(--gold-core);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem;">
              <span class="badge-gold">${c.concessionId}</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-pure);">${c.name}</h3>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">
              📍 ${c.jurisdiction} • Operator: ${c.operator}
            </div>
          </div>
          <span class="badge-emerald" style="font-size: 0.75rem;">${c.reportStandard}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div style="background: rgba(0,0,0,0.25); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">PROVEN & PROBABLE (P&P)</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--gold-light); font-family: var(--font-mono);">${(c.provenProbableOz).toLocaleString()} oz</div>
          </div>
          <div style="background: rgba(0,0,0,0.25); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">MEASURED & INDICATED (M&I)</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-pure); font-family: var(--font-mono);">${(c.measuredIndicatedOz).toLocaleString()} oz</div>
          </div>
          <div style="background: rgba(0,0,0,0.25); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">AVERAGE ORE GRADE</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--cyan-core); font-family: var(--font-mono);">${c.averageGradeGpt.toFixed(2)} g/t Au</div>
          </div>
          <div style="background: rgba(0,0,0,0.25); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">EXTRACTION HAIRCUT</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--rose-core); font-family: var(--font-mono);">${c.haircutPct.toFixed(1)}% Discount</div>
          </div>
          <div style="background: rgba(0,0,0,0.25); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">DISCOUNTED RECOVERABLE NAV</div>
            <div style="font-size: 1.05rem; font-weight: 800; color: var(--emerald-core); font-family: var(--font-mono);">$${(c.discountedValueUsd).toLocaleString()}</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); font-size: 0.75rem; font-family: var(--font-mono);">
          <span style="color: var(--text-muted);">Report Hash: <span style="color: var(--gold-core);">${c.reportHash.slice(0, 20)}...</span></span>
          <span style="color: var(--cyan-core);">Streaming Note: ${c.streamingContractId}</span>
        </div>
      </div>
    `).join('');
  }

  return {
    init: renderInGroundEngine
  };
})();
