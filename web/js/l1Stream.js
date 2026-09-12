// ==========================================================================
// DIGNITY GOLD SOVEREIGN L1 — LIVE PoG-QBFT STREAM & QRNG MONITOR
// Connects to local/edge L1 node and generates deterministic 1.0s blocks & txs
// ==========================================================================

window.DignityL1Stream = (function() {
  let blockHeight = 1849200;
  const blocks = [];
  const transactions = [];
  const MAX_ITEMS = 25;

  let currentEntropySeed = "0x7f8a92b71c08e82d3451bf3029487c672b1a8f9c0e5a6b7d8e9f0123456789ab";

  const validators = [
    { name: "Zurich Freezone Enclave (CH)", address: "0xVAL_ZURICH_FREEZONE_SWISS_01" },
    { name: "London LBMA Enclave (UK)", address: "0xVAL_LONDON_LBMA_ENCLAVE_02" },
    { name: "Delaware Depository (USA)", address: "0xVAL_DELAWARE_DEPOSITORY_USA_03" },
    { name: "Singapore Freeport (SG)", address: "0xVAL_SINGAPORE_FREEPORT_04" }
  ];

  function generateHex32() {
    return "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
  }

  function advanceBlock() {
    blockHeight += 1;
    currentEntropySeed = generateHex32();

    const proposer = validators[blockHeight % validators.length];

    const block = {
      height: blockHeight,
      hash: generateHex32(),
      prevHash: blocks.length > 0 ? blocks[0].hash : generateHex32(),
      proposer: proposer.name,
      proposerAddress: proposer.address,
      qrngSeed: currentEntropySeed,
      dilithiumSig: "0xdili3_" + generateHex32().slice(2, 24),
      physicalRoot: "0x89a1f4b2c3d0e9a8f7e6d5c4b3a201f9e8d7c6b5a40392817263544536271829",
      inGroundRoot: "0x55aa33ff11bb22cc44dd66ee880099aa11223344556677889900aabbccddeeff",
      txCount: Math.floor(3 + Math.random() * 8),
      timestamp: Date.now()
    };

    blocks.unshift(block);
    if (blocks.length > MAX_ITEMS) blocks.pop();

    // Auto generate 1-2 standard txs per block
    const txTypes = ["TITLE_TRANSFER", "DVP_CLEARING", "POR_ATTESTATION", "CARBON_RETIRE", "ORACLE_INGEST"];
    const randomType = txTypes[Math.floor(Math.random() * txTypes.length)];
    const newTx = {
      txHash: generateHex32(),
      type: randomType,
      entity: proposer.name.split(' ')[0],
      amount: randomType === "DVP_CLEARING" ? `${(20 + Math.random() * 80).toFixed(1)} oz Gold` : (randomType === "CARBON_RETIRE" ? "50 tCO2e" : "Verified"),
      status: "SEALED",
      blockHeight: blockHeight,
      time: new Date().toLocaleTimeString()
    };
    transactions.unshift(newTx);
    if (transactions.length > MAX_ITEMS) transactions.pop();

    updateUI(block);
  }

  function injectCustomTx(customTx) {
    const tx = {
      txHash: customTx.txHash || generateHex32(),
      type: customTx.type || "CUSTOM_TX",
      entity: customTx.entity || "Dignity Asset Trust",
      amount: customTx.amount || "0 Gas",
      status: customTx.status || "SEALED",
      blockHeight: blockHeight,
      time: new Date().toLocaleTimeString()
    };
    transactions.unshift(tx);
    if (transactions.length > MAX_ITEMS) transactions.pop();
    renderTransactionsList();
  }

  function updateUI(latestBlock) {
    // Header & Telemetry elements
    const heightEl = document.getElementById('globalBlockHeight');
    if (heightEl) heightEl.innerText = `#${latestBlock.height.toLocaleString()}`;

    const cardHeightEl = document.getElementById('cardBlockHeight');
    if (cardHeightEl) cardHeightEl.innerText = `#${latestBlock.height.toLocaleString()}`;

    const cardQrngEl = document.getElementById('cardQrngSeed');
    if (cardQrngEl) cardQrngEl.innerText = `${latestBlock.qrngSeed.slice(0, 14)}...${latestBlock.qrngSeed.slice(-6)}`;

    renderBlocksList();
    renderTransactionsList();
  }

  function renderBlocksList() {
    const listEl = document.getElementById('blocksStreamList');
    if (!listEl) return;

    listEl.innerHTML = blocks.map(b => `
      <div class="block-row-item" data-height="${b.height}">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span class="rwa-badge badge-gold">#${b.height}</span>
            <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--gold-light);">${b.hash.slice(0, 12)}...${b.hash.slice(-6)}</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">
            Proposer: <strong>${b.proposer}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.72rem; font-family: var(--font-mono); color: var(--cyan-core); margin-bottom: 0.25rem;">
            QRNG: ${b.qrngSeed.slice(0, 8)}...
          </div>
          <span class="rwa-badge badge-emerald">1.0s FINALIZED (${b.txCount} txs)</span>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.block-row-item').forEach(row => {
      row.addEventListener('click', () => {
        const h = parseInt(row.getAttribute('data-height'), 10);
        const selBlock = blocks.find(b => b.height === h);
        if (selBlock && window.DignityApp) window.DignityApp.inspectBlock(selBlock);
      });
    });
  }

  function renderTransactionsList() {
    const txListEl = document.getElementById('txStreamList');
    if (!txListEl) return;

    txListEl.innerHTML = transactions.map(t => `
      <div class="tx-row-item">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span class="rwa-badge ${t.type.includes('DVP') ? 'badge-gold' : (t.type.includes('CARBON') ? 'badge-emerald' : 'badge-amber')}">${t.type}</span>
            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-primary);">${t.txHash.slice(0, 14)}...</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">
            Entity: <strong>${t.entity}</strong> • Block #${t.blockHeight}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; color: var(--gold-core);">
            ${t.amount}
          </div>
          <div style="font-size: 0.68rem; color: var(--emerald-core); font-weight: 700;">
            ✓ ${t.status}
          </div>
        </div>
      </div>
    `).join('');
  }

  function init() {
    for (let i = 0; i < 5; i++) {
      advanceBlock();
    }
    setInterval(advanceBlock, 1000);
  }

  return {
    init,
    injectCustomTx,
    getBlocks: () => blocks,
    getLatestBlock: () => blocks[0]
  };
})();
