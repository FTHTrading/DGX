// ==========================================================================
// DIGNITY GOLD SOVEREIGN L1 — PHYSICAL VAULTED GOLD MATRIX
// Displays LBMA 400 oz Good Delivery Bar inventory, assayers, & vault receipts
// ==========================================================================

window.DignityVaultMatrix = (function() {
  function renderVaultMatrix() {
    const tableBody = document.getElementById('vaultBarsTableBody');
    const totalBarsEl = document.getElementById('totalBarsCount');
    const totalOzEl = document.getElementById('totalVaultOz');
    const totalValueEl = document.getElementById('totalVaultValueUsd');

    const bars = window.DIGNITY_GOLD_STATE.physicalBars;

    let totalOz = 0;
    let totalVal = 0;

    bars.forEach(b => {
      totalOz += b.fineWeightOz;
      totalVal += b.marketValueUsd;
    });

    if (totalBarsEl) totalBarsEl.innerText = `${bars.length} Allocated Bars`;
    if (totalOzEl) totalOzEl.innerText = `${totalOz.toLocaleString('en-US', {minimumFractionDigits: 3})} oz`;
    if (totalValueEl) totalValueEl.innerText = `$${totalVal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;

    if (!tableBody) return;

    tableBody.innerHTML = bars.map(b => `
      <tr>
        <td>
          <div style="font-weight: 800; color: var(--gold-core); font-family: var(--font-mono);">${b.serial}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${b.refiner}</div>
        </td>
        <td>
          <span class="badge-gold">${b.fineness}</span>
        </td>
        <td>
          <div style="font-weight: 700; font-family: var(--font-mono);">${b.fineWeightOz.toFixed(3)} oz</div>
          <div style="font-size: 0.68rem; color: var(--text-muted);">Gross: ${b.grossWeightOz.toFixed(3)} oz</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${b.vault}</div>
          <div style="font-size: 0.68rem; font-family: var(--font-mono); color: var(--cyan-core);">${b.insurancePolicy}</div>
        </td>
        <td>
          <div style="font-weight: 800; color: var(--emerald-core); font-family: var(--font-mono);">$${b.marketValueUsd.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
          <div style="font-size: 0.68rem; color: var(--emerald-core);">100% UNENCUMBERED</div>
        </td>
        <td>
          <button class="btn-gold" onclick="window.DignityApp.inspectBar('${b.serial}')" style="padding: 0.35rem 0.75rem; font-size: 0.72rem;">
            Inspect Receipt
          </button>
        </td>
      </tr>
    `).join('');
  }

  return {
    init: renderVaultMatrix
  };
})();
