// ==========================================================================
// DIGNITY GOLD // MINE ESG & IOT CARBON OFFSETS ENGINE
// Real-time IoT Telemetry + Tier-1 Verra/Gold Standard Offset Retirement
// ==========================================================================

window.DignityMineEsg = (function() {
  let intervalId = null;

  function init() {
    renderIoTSensors();
    renderCarbonCredits();
    bindEvents();
    startTelemetrySimulation();
  }

  function renderIoTSensors() {
    const grid = document.getElementById('iotSensorsGrid');
    if (!grid) return;

    const sensors = window.DIGNITY_GLOBAL_NETWORK.iotSensors;
    grid.innerHTML = sensors.map(s => `
      <div class="iot-sensor-card" id="sensor-${s.id}">
        <div class="iot-header">
          <div class="iot-site">${s.site}</div>
          <span class="iot-status-badge">${s.status}</span>
        </div>
        <div class="iot-param">${s.parameter}</div>
        <div class="iot-reading-value" id="val-${s.id}">${s.reading}</div>
        <div class="iot-footer">
          <div>Range: <span>${s.range}</span></div>
          <div>Device: <span>${s.telemetrySource}</span></div>
          <div style="color: var(--text-muted); font-size: 0.7rem; margin-top: 0.25rem;">
            Telemetry: <span id="time-${s.id}">Active (0.5s ping)</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderCarbonCredits() {
    const tbody = document.getElementById('carbonCreditsTbody');
    if (!tbody) return;

    const credits = window.DIGNITY_GLOBAL_NETWORK.carbonCredits;
    tbody.innerHTML = credits.map(c => `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--emerald-core);">${c.id}</td>
        <td>
          <div style="font-weight: 600;">${c.projectName}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${c.registry} • Vintage ${c.vintage}</div>
        </td>
        <td><span class="rwa-badge badge-emerald">${c.methodology}</span></td>
        <td style="font-family: var(--font-mono); font-weight: 700;">${c.totalTonsCO2e.toLocaleString()} tCO2e</td>
        <td style="font-family: var(--font-mono); color: var(--cyan-core); font-weight: 700;">${c.availableTons.toLocaleString()} tCO2e</td>
        <td style="font-family: var(--font-mono); color: var(--text-muted);">${c.retiredTons.toLocaleString()} tCO2e</td>
        <td>
          <button class="small-action-btn" onclick="window.DignityMineEsg.selectCreditForRetirement('${c.id}')">
            Retire Offsets ➔
          </button>
        </td>
      </tr>
    `).join('');
  }

  function startTelemetrySimulation() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      // Fluctuate solar slightly
      const solarEl = document.getElementById('val-SN-IOT-EUK-SOLAR02');
      if (solarEl) {
        const val = (4.80 + Math.random() * 0.15).toFixed(2);
        solarEl.innerText = `${val} MW`;
      }
      // Fluctuate hydro turbine slightly
      const hydEl = document.getElementById('val-SN-IOT-WND-HYD01');
      if (hydEl) {
        const val = Math.floor(1230 + Math.random() * 25);
        hydEl.innerText = `${val} gal/min`;
      }
      // Fluctuate pH slightly
      const phEl = document.getElementById('val-SN-IOT-EUK-PH01');
      if (phEl) {
        const val = (7.40 + Math.random() * 0.05).toFixed(2);
        phEl.innerText = `${val} pH`;
      }
    }, 2000);
  }

  function selectCreditForRetirement(creditId) {
    const select = document.getElementById('retireCreditSelect');
    if (select) {
      select.value = creditId;
      calculateOffsetTons();
      document.getElementById('retirementSection')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function calculateOffsetTons() {
    const goldOz = parseFloat(document.getElementById('retireGoldOz')?.value || '100');
    const creditId = document.getElementById('retireCreditSelect')?.value;
    const credit = window.DIGNITY_GLOBAL_NETWORK.carbonCredits.find(c => c.id === creditId);
    if (!credit) return;

    // Rate e.g. 0.45 tCO2e / oz
    const rate = parseFloat(credit.offsetRatePerOzGold.split(' ')[0]);
    const tonsReq = Math.ceil(goldOz * rate);

    const tonsEl = document.getElementById('calculatedTonsDisplay');
    if (tonsEl) tonsEl.innerText = `${tonsReq} tCO2e Required (${rate} tCO2e / oz)`;
  }

  function bindEvents() {
    const goldInput = document.getElementById('retireGoldOz');
    const creditSelect = document.getElementById('retireCreditSelect');

    if (goldInput) goldInput.addEventListener('input', calculateOffsetTons);
    if (creditSelect) creditSelect.addEventListener('change', calculateOffsetTons);

    const submitBtn = document.getElementById('submitRetireBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', handleRetireSubmit);
    }
  }

  function handleRetireSubmit(e) {
    e.preventDefault();
    const goldOz = parseFloat(document.getElementById('retireGoldOz')?.value || '100');
    const creditId = document.getElementById('retireCreditSelect')?.value;
    const beneficiary = document.getElementById('retireBeneficiary')?.value || 'Dignity Bullion Holder Vault';
    const credit = window.DIGNITY_GLOBAL_NETWORK.carbonCredits.find(c => c.id === creditId);

    if (!credit) return;
    const rate = parseFloat(credit.offsetRatePerOzGold.split(' ')[0]);
    const tons = Math.ceil(goldOz * rate);

    if (credit.availableTons < tons) {
      console.warn("Insufficient available carbon credits in this vintage pool.");
      return;
    }

    credit.availableTons -= tons;
    credit.retiredTons += tons;

    const certId = `CERT-ESG-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const qrngHash = "0x" + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');

    const certBox = document.getElementById('esgCertificateDisplay');
    if (certBox) {
      certBox.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--emerald-core); border-radius: 8px; padding: 1.5rem; margin-top: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--emerald-core);">CERTIFICATE OF CARBON OFFSET RETIREMENT</div>
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${certId}</div>
            </div>
            <span class="rwa-badge badge-emerald">VERIFIED ON-CHAIN</span>
          </div>

          <div class="passport-grid" style="grid-template-columns: 1fr 1fr;">
            <div><span class="lbl">Beneficiary:</span> <span class="val">${beneficiary}</span></div>
            <div><span class="lbl">Gold Production Offset:</span> <span class="val">${goldOz} Troy Ounces</span></div>
            <div><span class="lbl">Sequestration Tonnage:</span> <span class="val">${tons.toLocaleString()} Metric Tonnes CO2e</span></div>
            <div><span class="lbl">Registry & Project:</span> <span class="val">${credit.registry} (${credit.projectName})</span></div>
            <div style="grid-column: 1/-1;"><span class="lbl">QRNG Entropy Audit Seal:</span> <span class="val mono">${qrngHash}</span></div>
          </div>
        </div>
      `;
    }

    renderCarbonCredits();

    if (window.DignityL1Stream && window.DignityL1Stream.injectCustomTx) {
      window.DignityL1Stream.injectCustomTx({
        txHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        type: "RETIRE_CARBON_ESG",
        entity: "Dignity Resource Finance",
        amount: `${tons} tCO2e Offset`,
        status: "SEALED"
      });
    }

    if (window.DignityApp && window.DignityApp.showToast) {
      window.DignityApp.showToast(`🌱 Retired ${tons} tCO2e Carbon Offsets for ${goldOz} oz Gold!`);
    }
  }

  return {
    init,
    selectCreditForRetirement
  };
})();
