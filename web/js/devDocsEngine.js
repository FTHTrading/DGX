// ==========================================================================
// DIGNITY GOLD // DEVELOPER DOCUMENTATION & INSTITUTIONAL SECURITIES ENGINE
// Chapters:
// 1. What This Really Is: Institutional Infrastructure vs "Token App"
// 2. Securities Law & Title Perfection: UCC Article 8/9, Reg D, Reg S, MiFID II, AAOIFI
// 3. Sovereign Consensus: Proof of Gold & Quantum BFT (PoG-QBFT)
// 4. SDK Quickstarts: Rust, Python, TypeScript & cURL
// ==========================================================================

window.DignityDevDocs = (function() {
  let activeContractIndex = 0;

  function init() {
    renderContractList();
    loadContract(0);
    bindEvents();
  }

  function renderContractList() {
    const listEl = document.getElementById('devContractsList');
    if (!listEl) return;

    const contracts = window.DIGNITY_REAL_CONTRACTS;
    listEl.innerHTML = contracts.map((c, idx) => `
      <div class="dev-contract-item ${idx === activeContractIndex ? 'active' : ''}" onclick="window.DignityDevDocs.loadContract(${idx})">
        <div class="dc-name">${c.id}</div>
        <div class="dc-lang">${c.language} • ${c.standard.split(' ')[0]}</div>
      </div>
    `).join('');
  }

  function loadContract(idx) {
    activeContractIndex = idx;
    const contract = window.DIGNITY_REAL_CONTRACTS[idx];
    if (!contract) return;

    document.querySelectorAll('.dev-contract-item').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });

    const titleEl = document.getElementById('devContractTitle');
    const badgeEl = document.getElementById('devContractBadge');
    const descEl = document.getElementById('devContractDesc');
    const metaEl = document.getElementById('devContractMeta');
    const codeEl = document.getElementById('devContractSource');

    if (titleEl) titleEl.innerText = contract.name;
    if (badgeEl) badgeEl.innerText = contract.standard;
    if (descEl) descEl.innerText = contract.description;
    if (metaEl) {
      metaEl.innerHTML = `
        <div>Language: <strong>${contract.language}</strong></div>
        <div>Chains: <strong>${contract.chain}</strong></div>
        <div>Status: <strong style="color: var(--emerald-core);">${contract.status}</strong></div>
      `;
    }
    if (codeEl) codeEl.innerText = contract.sourceCode;
  }

  function copyCurrentContract() {
    const contract = window.DIGNITY_REAL_CONTRACTS[activeContractIndex];
    if (!contract) return;
    navigator.clipboard.writeText(contract.sourceCode).then(() => {
      if (window.DignityApp) window.DignityApp.showToast(`📋 Copied ${contract.id} source code to clipboard!`);
    });
  }

  function bindEvents() {
    // Copy button
    const copyBtn = document.getElementById('copyContractBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyCurrentContract);

    // Sub-nav for Dev Docs
    document.querySelectorAll('.dev-subnav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dev-subnav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-devview');
        document.querySelectorAll('.dev-doc-section').forEach(s => {
          s.classList.toggle('active', s.id === `devsection-${view}`);
        });
      });
    });

    // Language tabs in SDK Quickstarts
    document.querySelectorAll('.sdk-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sdk-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const lang = btn.getAttribute('data-lang');
        document.querySelectorAll('.sdk-code-block').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-lang') === lang);
        });
      });
    });
  }

  return {
    init,
    loadContract,
    copyCurrentContract
  };
})();
