// ==========================================================================
// DIGNITY GOLD // SMART CONTRACTS & CHAINS SANDBOX
// Rust / CosmWasm / Solana Interactive Contract Runner & ABI Inspector
// ==========================================================================

window.DignityContractSandbox = (function() {
  let activeContractIndex = 0;

  function init() {
    renderContractList();
    loadContract(0);
    bindEvents();
  }

  function renderContractList() {
    const listEl = document.getElementById('contractsNavList');
    if (!listEl) return;

    const contracts = window.DIGNITY_GLOBAL_NETWORK.smartContracts;
    listEl.innerHTML = contracts.map((c, idx) => `
      <button class="contract-nav-item ${idx === activeContractIndex ? 'active' : ''}" onclick="window.DignityContractSandbox.loadContract(${idx})">
        <div class="c-name">${c.contractId}</div>
        <div class="c-std">${c.standard} • ${c.chain}</div>
      </button>
    `).join('');
  }

  function loadContract(idx) {
    activeContractIndex = idx;
    const contract = window.DIGNITY_GLOBAL_NETWORK.smartContracts[idx];
    if (!contract) return;

    // Update active class in list
    document.querySelectorAll('.contract-nav-item').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
    });

    // Populate Details
    const titleEl = document.getElementById('contractTitle');
    const descEl = document.getElementById('contractDesc');
    const stdEl = document.getElementById('contractStandard');
    const codeEl = document.getElementById('contractRustCode');
    const methodsSelect = document.getElementById('contractMethodSelect');

    if (titleEl) titleEl.innerText = contract.contractId;
    if (descEl) descEl.innerText = contract.description;
    if (stdEl) stdEl.innerText = `${contract.standard} • ${contract.chain} (${contract.gasModel})`;
    if (codeEl) codeEl.innerText = contract.rustCodeSnippet;

    if (methodsSelect) {
      methodsSelect.innerHTML = contract.abiMethods.map((m, mIdx) => `
        <option value="${mIdx}">${m.name}(${m.args.join(', ')})</option>
      `).join('');
      renderMethodInputs(0);
    }
  }

  function renderMethodInputs(methodIdx) {
    const container = document.getElementById('methodArgsContainer');
    if (!container) return;

    const contract = window.DIGNITY_GLOBAL_NETWORK.smartContracts[activeContractIndex];
    if (!contract || !contract.abiMethods[methodIdx]) return;

    const method = contract.abiMethods[methodIdx];
    container.innerHTML = method.args.map((arg, aIdx) => {
      const parts = arg.split(': ');
      const name = parts[0];
      const type = parts[1] || 'String';
      let defVal = '';

      if (name.includes('serial')) defVal = 'VAL-CH-994820';
      else if (name.includes('fine_weight') || name.includes('qty')) defVal = '400';
      else if (name.includes('refiner')) defVal = 'Valcambi SA';
      else if (name.includes('vault_acc')) defVal = 'ALLOC-001882';
      else if (name.includes('price')) defVal = '2650';
      else if (name.includes('credit_id')) defVal = 'VCS-1849-MINE-RECLAIM';
      else if (name.includes('tons')) defVal = '500';
      else if (name.includes('entity') || name.includes('from') || name.includes('to')) defVal = '0xVAL_ZURICH_FREEZONE_SWISS_01';
      else if (name.includes('decision_id')) defVal = 'DEC-2026-62108';
      else defVal = 'sample_value';

      return `
        <div class="form-group" style="margin-bottom: 0.75rem;">
          <label style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">${name} <span style="color: var(--cyan-core); font-family: var(--font-mono); font-size: 0.7rem;">(${type})</span></label>
          <input type="text" class="arg-input" data-arg-name="${name}" value="${defVal}" style="width: 100%; padding: 0.5rem; background: var(--input-bg); border: 1px solid var(--border-subtle); color: var(--text-pure); border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem;">
        </div>
      `;
    }).join('');
  }

  function bindEvents() {
    const methodsSelect = document.getElementById('contractMethodSelect');
    if (methodsSelect) {
      methodsSelect.addEventListener('change', (e) => {
        renderMethodInputs(parseInt(e.target.value));
      });
    }

    const execBtn = document.getElementById('executeContractBtn');
    if (execBtn) {
      execBtn.addEventListener('click', executeMethod);
    }
  }

  function executeMethod() {
    const contract = window.DIGNITY_GLOBAL_NETWORK.smartContracts[activeContractIndex];
    const methodsSelect = document.getElementById('contractMethodSelect');
    const methodIdx = parseInt(methodsSelect.value);
    const method = contract.abiMethods[methodIdx];

    // Gather args
    const inputs = document.querySelectorAll('.arg-input');
    const argsPassed = {};
    inputs.forEach(inp => {
      argsPassed[inp.getAttribute('data-arg-name')] = inp.value;
    });

    const receiptBox = document.getElementById('executionReceiptBox');
    if (!receiptBox) return;

    const blockH = 1849200 + Math.floor(Math.random() * 50);
    const txHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const qrngSeed = "0x" + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');

    const receipt = {
      status: "SUCCESS (CONFIRMED_QBFT)",
      contract: contract.contractId,
      method: method.name,
      blockHeight: blockH,
      txHash: txHash,
      gasFee: "0.00000000 DIGNITY (STAKE-ALLOCATED)",
      qrngBeaconSeed: qrngSeed,
      inputs: argsPassed,
      stateMutation: "State commit sealed into Ledger Merkle Tree",
      timestamp: new Date().toISOString()
    };

    receiptBox.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--emerald-core); border-radius: 6px; padding: 1rem; margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 800; color: var(--emerald-core); font-size: 0.85rem;">EXECUTION RECEIPT: ${method.name}()</span>
          <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${receipt.timestamp}</span>
        </div>
        <pre style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-primary); white-space: pre-wrap; word-break: break-all; margin: 0;">${JSON.stringify(receipt, null, 2)}</pre>
      </div>
    `;

    // Inject into L1 stream
    if (window.DignityL1Stream && window.DignityL1Stream.injectCustomTx) {
      window.DignityL1Stream.injectCustomTx({
        txHash: txHash,
        type: `CALL_${method.name.toUpperCase()}`,
        entity: contract.contractId.split('::')[1],
        amount: "0 Gas",
        status: "SEALED"
      });
    }

    if (window.DignityApp && window.DignityApp.showToast) {
      window.DignityApp.showToast(`⚡ Executed ${method.name}() in L1 Sandbox! Block #${blockH}`);
    }
  }

  return {
    init,
    loadContract
  };
})();
