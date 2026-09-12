// ==========================================================================
// DIGNITY GOLD // RWA FORGE & CONCESSION REGISTRY (ONE-STOP FOR MINES)
// Search & Lookup Existing RWAs + Interactive Sandboxed Issuance Wizard
// ==========================================================================

window.DignityRwaForge = (function() {
  function init() {
    renderRwaList();
    bindEvents();
  }

  function renderRwaList(filterType = 'all', searchQuery = '') {
    const listContainer = document.getElementById('rwaCardsGrid');
    if (!listContainer) return;

    const data = window.DIGNITY_GLOBAL_NETWORK;
    let items = [];

    // 1. Physical bars
    if (filterType === 'all' || filterType === 'PHYS') {
      data.bars.forEach(b => {
        items.push({
          type: 'PHYS',
          badge: 'DIGAU.PHYS',
          badgeClass: 'badge-gold',
          id: b.serial,
          title: `${b.refiner} • ${b.serial}`,
          subtitle: `${b.fineWeightOz.toFixed(3)} oz Fine Gold (${b.fineness})`,
          metricLabel: 'VALUATION (AT PAR)',
          metricValue: `$${(b.fineWeightOz * 2650.50).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
          location: b.vaultLocation,
          custody: b.insurancePolicy,
          namespace: b.namespace,
          raw: b
        });
      });
    }

    // 2. In-ground Concessions
    if (filterType === 'all' || filterType === 'RESOURCE') {
      data.concessions.forEach(c => {
        items.push({
          type: 'RESOURCE',
          badge: 'DIGAU.RESOURCE',
          badgeClass: 'badge-amber',
          id: c.id,
          title: c.name,
          subtitle: `${c.provenReservesOz.toLocaleString()} oz P&P @ ${c.avgGrade}`,
          metricLabel: 'DISCOUNTED NAV (68% HAIRCUT)',
          metricValue: `$${(c.discountedNavUsd / 1e9).toFixed(2)}B USD`,
          location: c.jurisdiction,
          custody: `NI 43-101 QP: ${c.qpAuthor}`,
          namespace: c.namespace,
          raw: c
        });
      });
    }

    // 3. Carbon Credits
    if (filterType === 'all' || filterType === 'CARBON') {
      data.carbonCredits.forEach(cb => {
        items.push({
          type: 'CARBON',
          badge: 'DIGAU.CARBON',
          badgeClass: 'badge-emerald',
          id: cb.id,
          title: cb.projectName,
          subtitle: `${cb.registry} • Vintage ${cb.vintage}`,
          metricLabel: 'AVAILABLE TONNAGE',
          metricValue: `${cb.availableTons.toLocaleString()} tCO2e`,
          location: cb.methodology,
          custody: `Auditor: ${cb.auditor}`,
          namespace: `uny://prod/global/esg/carbon/${cb.id}`,
          raw: cb
        });
      });
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      items = items.filter(it => 
        it.id.toLowerCase().includes(q) ||
        it.title.toLowerCase().includes(q) ||
        it.subtitle.toLowerCase().includes(q) ||
        it.location.toLowerCase().includes(q) ||
        it.namespace.toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          No Real-World Assets match your filter or search query.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = items.map(it => `
      <div class="rwa-card" data-rwa-id="${it.id}">
        <div class="rwa-card-header">
          <span class="rwa-badge ${it.badgeClass}">${it.badge}</span>
          <span class="rwa-id-tag">${it.id}</span>
        </div>
        <div class="rwa-title">${it.title}</div>
        <div class="rwa-sub">${it.subtitle}</div>

        <div class="rwa-metrics-box">
          <div class="rwa-metric-lbl">${it.metricLabel}</div>
          <div class="rwa-metric-val">${it.metricValue}</div>
        </div>

        <div class="rwa-footer-info">
          <div>📍 <span>${it.location}</span></div>
          <div>🛡️ <span>${it.custody}</span></div>
          <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--gold-core); margin-top: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${it.namespace}
          </div>
        </div>

        <button class="rwa-inspect-btn" onclick="window.DignityRwaForge.inspectRwa('${it.id}', '${it.type}')">
          Inspect Passport & Proofs ➔
        </button>
      </div>
    `).join('');
  }

  function bindEvents() {
    // Type Filter Buttons
    document.querySelectorAll('.rwa-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rwa-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-rwa-type');
        const query = document.getElementById('rwaSearchInput')?.value || '';
        renderRwaList(filter, query);
      });
    });

    // Search Input
    const searchInput = document.getElementById('rwaSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.rwa-filter-btn.active')?.getAttribute('data-rwa-type') || 'all';
        renderRwaList(activeFilter, e.target.value);
      });
    }

    // Modal Form Type Changer
    const issueTypeSelect = document.getElementById('issueAssetType');
    if (issueTypeSelect) {
      issueTypeSelect.addEventListener('change', (e) => {
        updateFormFields(e.target.value);
      });
    }

    // Submit Issuance
    const form = document.getElementById('rwaIssueForm');
    if (form) {
      form.addEventListener('submit', handleIssueSubmit);
    }
  }

  function updateFormFields(assetType) {
    const dynamicFields = document.getElementById('rwaDynamicFields');
    if (!dynamicFields) return;

    if (assetType === 'PHYS') {
      dynamicFields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Bar Serial Number</label>
            <input type="text" id="fieldSerial" value="VAL-CH-${Math.floor(100000 + Math.random() * 900000)}" required>
          </div>
          <div class="form-group">
            <label>Accredited Refiner</label>
            <select id="fieldRefiner">
              <option value="Valcambi SA (Switzerland)">Valcambi SA (Switzerland)</option>
              <option value="PAMP SA (Switzerland)">PAMP SA (Switzerland)</option>
              <option value="Argor-Heraeus SA (Switzerland)">Argor-Heraeus SA (Switzerland)</option>
              <option value="The Perth Mint (Australia)">The Perth Mint (Australia)</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Fine Gold Weight (Troy Oz)</label>
            <input type="number" step="0.001" id="fieldFineOz" value="400.085" required>
          </div>
          <div class="form-group">
            <label>Depository Vault Facility</label>
            <select id="fieldVault">
              <option value="Zurich Freezone Depository, Switzerland">Zurich Freezone Depository (Switzerland)</option>
              <option value="London LBMA Vaults, United Kingdom">London LBMA Vaults (United Kingdom)</option>
              <option value="Delaware Depository, United States">Delaware Depository (United States)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Insurance Specie Policy</label>
          <input type="text" id="fieldInsurance" value="Lloyd's of London Specie LLOYDS-LBN-VAL-9918 ($50M USD)" required>
        </div>
      `;
    } else if (assetType === 'RESOURCE') {
      dynamicFields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Mining Concession ID</label>
            <input type="text" id="fieldConcessionId" value="NI43-101-CARLIN-NV" required>
          </div>
          <div class="form-group">
            <label>Concession Name</label>
            <input type="text" id="fieldConcessionName" value="Carlin Trend Deep South Concession" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Proven & Probable Reserves (Oz)</label>
            <input type="number" id="fieldProvenOz" value="1850000" required>
          </div>
          <div class="form-group">
            <label>Average Head Grade</label>
            <input type="text" id="fieldGrade" value="3.12 g/t Au" required>
          </div>
        </div>
        <div class="form-group">
          <label>Qualified Person (QP) Technical Author</label>
          <input type="text" id="fieldQp" value="Dr. Keith Campbell, P.Eng, QP Geological" required>
        </div>
      `;
    } else if (assetType === 'CARBON') {
      dynamicFields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Carbon Credit ID</label>
            <input type="text" id="fieldCarbonId" value="VCS-1994-MINE-SOLAR" required>
          </div>
          <div class="form-group">
            <label>Project Name</label>
            <input type="text" id="fieldCarbonName" value="Carlin Solar Microgrid & Cyanide Destruction Project" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Offset Volume (Metric Tonnes CO2e)</label>
            <input type="number" id="fieldCarbonTons" value="50000" required>
          </div>
          <div class="form-group">
            <label>Accredited Registry</label>
            <select id="fieldRegistry">
              <option value="Verra Verified Carbon Standard (VCS)">Verra Verified Carbon Standard (VCS)</option>
              <option value="Gold Standard for the Global Goals (GS)">Gold Standard for the Global Goals (GS)</option>
              <option value="American Carbon Registry (ACR)">American Carbon Registry (ACR)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Accredited Third-Party Auditor</label>
          <input type="text" id="fieldAuditor" value="Bureau Veritas Certification" required>
        </div>
      `;
    } else if (assetType === 'STREAM') {
      dynamicFields.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Stream Agreement ID</label>
            <input type="text" id="fieldStreamId" value="STREAM-EUREKA-2024" required>
          </div>
          <div class="form-group">
            <label>Mine Operator</label>
            <input type="text" id="fieldOperator" value="Eureka Gold Mining Corp" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Forward Annual Delivery (Oz Au)</label>
            <input type="number" id="fieldStreamOz" value="15000" required>
          </div>
          <div class="form-group">
            <label>Gross Revenue Royalty (%)</label>
            <input type="text" id="fieldRoyaltyPct" value="3.5% Net Smelter Return (NSR)" required>
          </div>
        </div>
      `;
    }
  }

  function handleIssueSubmit(e) {
    e.preventDefault();
    const assetType = document.getElementById('issueAssetType').value;
    const data = window.DIGNITY_GLOBAL_NETWORK;

    let newItem = null;
    let toastMessage = '';

    if (assetType === 'PHYS') {
      const serial = document.getElementById('fieldSerial').value;
      const refiner = document.getElementById('fieldRefiner').value;
      const fineOz = parseFloat(document.getElementById('fieldFineOz').value);
      const vault = document.getElementById('fieldVault').value;
      const insurance = document.getElementById('fieldInsurance').value;

      newItem = {
        serial,
        refiner,
        fineness: "999.9 Fine 24K",
        grossWeightOz: fineOz + 0.04,
        fineWeightOz: fineOz,
        vaultLocation: vault,
        vaultAccount: "ALLOC-009981",
        acquisitionDate: new Date().toISOString().split('T')[0],
        assayReportHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        insurancePolicy: insurance,
        insuranceCap: "$50,000,000 USD",
        status: "ALLOCATED & SECURED",
        namespace: `uny://prod/us/dignity-asset-trust/asset/bar/${serial}`
      };
      data.bars.unshift(newItem);
      toastMessage = `✅ Minted & Anchored Bar ${serial} (${fineOz} oz) to Dignity Asset Trust!`;

    } else if (assetType === 'RESOURCE') {
      const id = document.getElementById('fieldConcessionId').value;
      const name = document.getElementById('fieldConcessionName').value;
      const provenOz = parseInt(document.getElementById('fieldProvenOz').value);
      const grade = document.getElementById('fieldGrade').value;
      const qp = document.getElementById('fieldQp').value;

      newItem = {
        id,
        name,
        jurisdiction: "Nevada, United States",
        provenReservesOz: provenOz,
        measuredOz: Math.floor(provenOz * 1.8),
        avgGrade: grade,
        qpAuthor: qp,
        reportDate: new Date().toISOString().split('T')[0],
        extractionHaircut: "68.0%",
        discountedNavUsd: Math.floor(provenOz * 2650.50 * 0.32),
        spvEntity: `${name} SPV LLC`,
        docHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        namespace: `uny://prod/us-nv/dignity-resource-finance/project/${id}`
      };
      data.concessions.unshift(newItem);
      toastMessage = `✅ Concession ${id} (${provenOz.toLocaleString()} oz) Anchored to Dignity Resource Finance!`;

    } else if (assetType === 'CARBON') {
      const id = document.getElementById('fieldCarbonId').value;
      const name = document.getElementById('fieldCarbonName').value;
      const tons = parseInt(document.getElementById('fieldCarbonTons').value);
      const reg = document.getElementById('fieldRegistry').value;
      const auditor = document.getElementById('fieldAuditor').value;

      newItem = {
        id,
        projectName: name,
        registry: reg,
        serialRange: `${id}-2024-001 to ${tons}`,
        vintage: "2024",
        totalTonsCO2e: tons,
        availableTons: tons,
        retiredTons: 0,
        auditor,
        methodology: "VM0007 Clean Mine Tailings",
        status: "ACTIVE • VERIFIED",
        offsetRatePerOzGold: "0.40 tCO2e / oz",
        docHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')
      };
      data.carbonCredits.unshift(newItem);
      toastMessage = `✅ Tier-1 Carbon Credit ${id} (${tons.toLocaleString()} tCO2e) Verified & Issued!`;
    }

    // Trigger L1 block transaction injection
    if (window.DignityL1Stream && window.DignityL1Stream.injectCustomTx) {
      window.DignityL1Stream.injectCustomTx({
        txHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        type: `ISSUE_${assetType}`,
        entity: "Dignity Asset Trust",
        amount: assetType === 'PHYS' ? `${newItem.fineWeightOz} oz Gold` : `${assetType} Asset`,
        status: "SEALED"
      });
    }

    // Close Modal & Re-render
    closeIssueModal();
    renderRwaList();
    if (window.DignityApp && window.DignityApp.showToast) {
      window.DignityApp.showToast(toastMessage);
    }
  }

  function openIssueModal() {
    const modal = document.getElementById('rwaIssueModal');
    if (!modal) return;
    updateFormFields('PHYS');
    modal.classList.add('active');
  }

  function closeIssueModal() {
    const modal = document.getElementById('rwaIssueModal');
    if (modal) modal.classList.remove('active');
  }

  function inspectRwa(id, type) {
    const data = window.DIGNITY_GLOBAL_NETWORK;
    let detailsHtml = '';

    if (type === 'PHYS') {
      const bar = data.bars.find(b => b.serial === id);
      if (!bar) return;
      detailsHtml = `
        <div class="passport-header">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--gold-core); font-family: var(--font-heading);">
            ALLOCATED BULLION PASSPORT
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
            SERIAL: ${bar.serial}
          </div>
        </div>

        <div class="passport-grid">
          <div class="passport-field">
            <span class="lbl">Refiner:</span>
            <span class="val">${bar.refiner}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Fineness:</span>
            <span class="val">${bar.fineness}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Fine Weight:</span>
            <span class="val">${bar.fineWeightOz.toFixed(3)} Troy Ounces</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Gross Weight:</span>
            <span class="val">${bar.grossWeightOz.toFixed(3)} Troy Ounces</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Depository:</span>
            <span class="val">${bar.vaultLocation}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Segregated Account:</span>
            <span class="val">${bar.vaultAccount}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Insurance Specie:</span>
            <span class="val">${bar.insurancePolicy}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Assay Hash:</span>
            <span class="val mono">${bar.assayReportHash}</span>
          </div>
        </div>

        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(229, 184, 66, 0.08); border: 1px solid var(--border-subtle); border-radius: 8px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--gold-core); margin-bottom: 0.25rem;">
            CANONICAL NAMESPACE IDENTITY
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; word-break: break-all;">
            ${bar.namespace}
          </div>
        </div>
      `;
    } else if (type === 'RESOURCE') {
      const c = data.concessions.find(x => x.id === id);
      if (!c) return;
      detailsHtml = `
        <div class="passport-header">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--amber-core); font-family: var(--font-heading);">
            NI 43-101 MINING CLAIM PASSPORT
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
            CLAIM ID: ${c.id}
          </div>
        </div>

        <div class="passport-grid">
          <div class="passport-field">
            <span class="lbl">Concession Name:</span>
            <span class="val">${c.name}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Jurisdiction:</span>
            <span class="val">${c.jurisdiction}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Proven & Probable:</span>
            <span class="val">${c.provenReservesOz.toLocaleString()} Troy Oz</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Average Grade:</span>
            <span class="val">${c.avgGrade}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Qualified Person:</span>
            <span class="val">${c.qpAuthor}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Extraction Haircut:</span>
            <span class="val">${c.extractionHaircut} (Discounted NAV: $${(c.discountedNavUsd/1e9).toFixed(2)}B USD)</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Report Hash:</span>
            <span class="val mono">${c.docHash}</span>
          </div>
        </div>

        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(245, 158, 11, 0.08); border: 1px solid var(--border-subtle); border-radius: 8px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--amber-core); margin-bottom: 0.25rem;">
            CANONICAL NAMESPACE IDENTITY
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.78rem; word-break: break-all;">
            ${c.namespace}
          </div>
        </div>
      `;
    } else if (type === 'CARBON') {
      const cb = data.carbonCredits.find(x => x.id === id);
      if (!cb) return;
      detailsHtml = `
        <div class="passport-header">
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--emerald-core); font-family: var(--font-heading);">
            TIER-1 MINE ESG OFFSET PASSPORT
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
            CREDIT ID: ${cb.id}
          </div>
        </div>

        <div class="passport-grid">
          <div class="passport-field">
            <span class="lbl">Project Name:</span>
            <span class="val">${cb.projectName}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Registry Standard:</span>
            <span class="val">${cb.registry}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Total Offset:</span>
            <span class="val">${cb.totalTonsCO2e.toLocaleString()} tCO2e (Available: ${cb.availableTons.toLocaleString()})</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Auditor:</span>
            <span class="val">${cb.auditor}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Methodology:</span>
            <span class="val">${cb.methodology}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Gold Offset Ratio:</span>
            <span class="val">${cb.offsetRatePerOzGold}</span>
          </div>
          <div class="passport-field">
            <span class="lbl">Document Hash:</span>
            <span class="val mono">${cb.docHash}</span>
          </div>
        </div>
      `;
    }

    const modalContent = document.getElementById('passportModalContent');
    const modal = document.getElementById('passportInspectModal');
    if (modalContent && modal) {
      modalContent.innerHTML = detailsHtml;
      modal.classList.add('active');
    }
  }

  function closeInspectModal() {
    const modal = document.getElementById('passportInspectModal');
    if (modal) modal.classList.remove('active');
  }

  return {
    init,
    renderRwaList,
    openIssueModal,
    closeIssueModal,
    inspectRwa,
    closeInspectModal
  };
})();
