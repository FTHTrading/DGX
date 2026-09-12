// ==========================================================================
// DIGNITY GLOBAL GOLD NETWORK — MASTER APPLICATION ORCHESTRATOR
// Coordinates DignityScan, DigExchange, RWA Forge, Smart Contracts,
// Mine ESG & IoT Carbon Offsets, Custody & Insurance, and X402 Rails
// ==========================================================================

window.DignityApp = (function() {
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');
  const toastContainer = document.getElementById('toastContainer');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const themeToggleText = document.getElementById('themeToggleText');

  // Theme Management
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      if (themeToggleIcon) themeToggleIcon.innerText = "";
      if (themeToggleText) themeToggleText.innerText = "Dark Obsidian";
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      if (themeToggleIcon) themeToggleIcon.innerText = "[THEME]";
      if (themeToggleText) themeToggleText.innerText = "Institutional Light";
    }
    localStorage.setItem('dignity_theme', theme);
  }

  const savedTheme = localStorage.getItem('dignity_theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isCurrentlyLight = document.body.classList.contains('theme-light');
      applyTheme(isCurrentlyLight ? 'dark' : 'light');
      showToast(`Switched to ${isCurrentlyLight ? 'Deep Obsidian' : 'Institutional Light'} Theme`);
    });
  }

  // View Navigation
  function switchView(viewName) {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.view-panel');

    tabs.forEach(t => {
      const match = t.getAttribute('data-view') === viewName;
      t.classList.toggle('active', match);
      if (match) {
        t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    panels.forEach(p => {
      p.classList.toggle('active', p.id === `view-${viewName}`);
    });

    if (viewName === 'neuromap' && typeof initNeuromap === 'function') {
      initNeuromap();
    }
  }

  // Bind click listener to all tabs
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const view = tab.getAttribute('data-view');
        if (view) switchView(view);
      });
    });
  });

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      switchView(view);
    });
  });

  // Global Search Router
  function handleSearch(query) {
    if (!query || query.trim() === '') return;
    const q = query.trim().toUpperCase();

    // 1. Check if Bar Serial
    const bar = window.DIGNITY_GLOBAL_NETWORK.bars.find(b => b.serial.toUpperCase().includes(q));
    if (bar) {
      switchView('rwa-forge');
      window.DignityRwaForge.inspectRwa(bar.serial, 'PHYS');
      showToast(` Located Allocated Bar: ${bar.serial}`);
      return;
    }

    // 2. Check if Mining Concession
    const c = window.DIGNITY_GLOBAL_NETWORK.concessions.find(x => x.id.toUpperCase().includes(q) || x.name.toUpperCase().includes(q));
    if (c) {
      switchView('rwa-forge');
      window.DignityRwaForge.inspectRwa(c.id, 'RESOURCE');
      showToast(` Located In-Ground Concession: ${c.id}`);
      return;
    }

    // 3. Check if Carbon Credit
    const cb = window.DIGNITY_GLOBAL_NETWORK.carbonCredits.find(x => x.id.toUpperCase().includes(q) || x.projectName.toUpperCase().includes(q));
    if (cb) {
      switchView('rwa-forge');
      window.DignityRwaForge.inspectRwa(cb.id, 'CARBON');
      showToast(` Located Tier-1 Carbon Credit: ${cb.id}`);
      return;
    }

    // 4. Check if Dev Docs / Smart Contracts query
    if (q.includes('DOC') || q.includes('CONTRACT') || q.includes('ERC') || q.includes('REG') || q.includes('UCC') || q.includes('API') || q.includes('RPC') || q.includes('SDK')) {
      switchView('dev-docs');
      showToast(`[DOCS] Routed to Developer Hub & Smart Contracts: "${query}"`);
      return;
    }

    // 5. Default: Switch to Explorer and show search confirmation
    switchView('dignityscan');
    showToast(` Query "${query}" evaluated against L1 State Index`);
  }

  const searchBtn = document.getElementById('explorerSearchBtn');
  const searchInput = document.getElementById('explorerSearchInput');
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => handleSearch(searchInput.value));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch(searchInput.value);
    });
  }

  // Quick filter buttons in search banner
  document.querySelectorAll('.quick-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      
      if (filter === 'PHYS' || filter === 'RESOURCE' || filter === 'CARBON') {
        switchView('rwa-forge');
        document.querySelectorAll('.rwa-filter-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-rwa-type') === filter);
        });
        window.DignityRwaForge.renderRwaList(filter);
      } else if (filter === 'DVP') {
        switchView('digexchange');
      } else {
        switchView('dignityscan');
      }
    });
  });

  // Inspect Block Modal
  function inspectBlock(block) {
    const modal = document.getElementById('blockDetailModal');
    const title = document.getElementById('blockModalTitle');
    const content = document.getElementById('blockModalContent');
    if (!modal || !content) return;

    if (title) title.innerText = `PoG-QBFT Block #${block.height}`;
    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">BLOCK HASH:</div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--gold-core); word-break: break-all;">${block.hash}</div>
        </div>
        <div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">PREVIOUS BLOCK HASH:</div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary); word-break: break-all;">${block.prevHash}</div>
        </div>
      </div>

      <div style="background: rgba(0,0,0,0.35); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
        <h4 style="font-size: 0.85rem; font-weight: 800; color: var(--cyan-core); margin-bottom: 0.4rem;">VERIFIABLE QUANTUM RANDOMNESS BEACON (QRNG):</h4>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-primary); margin-bottom: 0.3rem;">
          <strong>Entropy Seed:</strong> ${block.qrngSeed}
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-primary);">
          <strong>Post-Quantum Signature:</strong> ${block.dilithiumSig} (Dilithium-3 Verified)
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div style="background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 6px;">
          <div style="font-size: 0.7rem; color: var(--text-muted);">PHYSICAL GOLD MERKLE ROOT:</div>
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--emerald-core); word-break: break-all;">${block.physicalRoot}</div>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 6px;">
          <div style="font-size: 0.7rem; color: var(--text-muted);">IN-GROUND GEOLOGICAL ROOT:</div>
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--amber-core); word-break: break-all;">${block.inGroundRoot}</div>
        </div>
      </div>

      <div style="font-size: 0.75rem; color: var(--text-secondary);">
        Proposer Enclave: <strong>${block.proposer}</strong> | Consensus: <strong>Proof of Gold & Quantum BFT</strong> (1.0s instant finality)
      </div>
    `;
    modal.classList.add('active');
  }

  // Toast Notifications
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerText = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toastContainer.removeChild(toast);
      }, 300);
    }, 3500);
  }

  // Trust Stack Sub-Nav
  document.querySelectorAll('.sub-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sub = btn.getAttribute('data-subview');
      document.querySelectorAll('.subview-panel').forEach(p => {
        p.classList.toggle('active', p.id === `subview-${sub}`);
      });
    });
  });

  // Render Trust Stack Entities
  function renderEntities() {
    const container = document.getElementById('entitiesGridContainer');
    if (!container) return;
    const entities = window.DIGNITY_GLOBAL_NETWORK.entities;
    container.innerHTML = entities.map(e => `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div style="font-size: 1rem; font-weight: 800; color: var(--text-pure);">${e.name}</div>
          <span class="badge-gold">${e.status}</span>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--cyan-core); margin-bottom: 0.5rem;">
          LEI: ${e.lei} (${e.jurisdiction})
        </div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${e.role}</p>
        <div style="font-size: 0.72rem; color: var(--text-muted);">
          Perimeter: <strong>${e.regulatoryPerimeter}</strong>
        </div>
      </div>
    `).join('');
  }

  // Render Trust Stack Namespaces
  function renderNamespaces() {
    const tbody = document.getElementById('namespacesTableBody');
    if (!tbody) return;
    const ns = window.DIGNITY_GLOBAL_NETWORK.namespaces || [];
    tbody.innerHTML = ns.map(n => `
      <tr>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--gold-core);">${n.uri}</td>
        <td><span class="badge-gold">${n.layer}</span></td>
        <td>${n.description}</td>
        <td><strong>${n.targetEntity}</strong></td>
        <td>${n.jurisdiction}</td>
      </tr>
    `).join('');
  }

  // Lifecycle Bootstrapper
  document.addEventListener('DOMContentLoaded', () => {
    if (window.DignityL1Stream) window.DignityL1Stream.init();
    if (window.DignityExchange) window.DignityExchange.init();
    if (window.DignityRwaForge) window.DignityRwaForge.init();
    if (window.DignityContractSandbox) window.DignityContractSandbox.init();
    if (window.DignityMineEsg) window.DignityMineEsg.init();
    if (window.DignityCustodyInsurance) window.DignityCustodyInsurance.init();
    if (window.DignityX402Rails) window.DignityX402Rails.init();
    if (window.DignityAtlas) window.DignityAtlas.init();
    if (window.DignitySentinel) window.DignitySentinel.init();
    if (window.DignityNexus) window.DignityNexus.init();
    if (window.DignityDevDocs) window.DignityDevDocs.init();
    if (window.DignityApiPlayground) window.DignityApiPlayground.init();

    renderEntities();
    renderNamespaces();
  });

  return {
    switchView,
    inspectBlock,
    showToast
  };
})();



// ==========================================================================
// INSTITUTIONAL INVESTOR PITCH DECK LOGIC (12 SLIDES)
// ==========================================================================
const deckSlides = [
  {
    num: 1,
    title: "DGX Global Gold Network",
    subtitle: "Sovereign Layer-1 • Mine Forward Streaming Forge • Institutional DvP Bullion Exchange",
    content: `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 64px; margin-bottom: 20px;">[DGX]</div>
        <h1 style="font-size: 36px; font-weight: 800; color: #D4AF37; margin-bottom: 12px;">DGX GLOBAL GOLD NETWORK</h1>
        <p style="font-size: 18px; color: #94a3b8; max-width: 680px; margin: 0 auto 30px;">Institutional Sovereign Market Infrastructure for Physical Bullion, In-Ground Reserves, and Atomic Delivery-versus-Payment (DvP) Settlement.</p>
        <div style="display: inline-flex; gap: 20px; padding: 14px 28px; background: rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.4); border-radius: 30px;">
          <span style="color: #fff; font-weight: 600;">Series A Offering: <strong style="color: #38bdf8;">$50,000,000</strong></span>
          <span style="color: #64748b;">|</span>
          <span style="color: #fff; font-weight: 600;">Immediate Asset Backing: <strong style="color: #4ade80;">$30,000,000 in LBMA Gold</strong></span>
        </div>
      </div>
    `
  },
  {
    num: 2,
    title: "The Macro Problem: The $15T Gold Market Has No Sovereign Rails",
    subtitle: "Paper Gold Dilution • T+3 Settlement Latency • Underfunded Development Mines",
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px;">
        <div class="card" style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; border-left: 4px solid #ef4444;">
          <h4 style="color: #ef4444; font-size: 18px; margin-bottom: 8px;">1. 100:1 Paper-to-Physical Ratio</h4>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">For every single physical ounce of gold in COMEX and LBMA vaults, over 100 ounces trade as paper derivatives, creating immense unhedged counterparty risk.</p>
        </div>
        <div class="card" style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; border-left: 4px solid #f59e0b;">
          <h4 style="color: #f59e0b; font-size: 18px; margin-bottom: 8px;">2. T+2 to T+5 Settlement Friction</h4>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Traditional bullion transfers require manual warehouse inspections, letters of credit, and physical couriers, generating 40 to 80 bps in transaction drag.</p>
        </div>
        <div class="card" style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; border-left: 4px solid #38bdf8;">
          <h4 style="color: #38bdf8; font-size: 18px; margin-bottom: 8px;">3. Concession Financing Bottlenecks</h4>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Mid-tier mines with verified NI 43-101 reserves face predatory mezzanine lenders (18%+) or massive dilution to fund equipment and processing facilities.</p>
        </div>
        <div class="card" style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; border-left: 4px solid #a855f7;">
          <h4 style="color: #a855f7; font-size: 18px; margin-bottom: 8px;">4. Quantum Vulnerability in Web3</h4>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Retail ERC-20 gold tokens live on congested chains without post-quantum protection, exposing multi-million-dollar treasuries to future cryptographic obsolescence.</p>
        </div>
      </div>
    `
  },
  {
    num: 3,
    title: "The DGX Solution: The Sovereign Institutional Gold L1",
    subtitle: "Consensus • Custody • Streaming • Atomic DvP Settlement",
    content: `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 30px;">
        <div style="padding: 20px; background: rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">[L1]</div>
          <h4 style="color: #D4AF37; margin-bottom: 6px;">Dedicated L1</h4>
          <p style="color: #94a3b8; font-size: 13px;">10,000+ TPS with 1-sec deterministic finality on Proof-of-Gold QBFT.</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">[CUSTODY]</div>
          <h4 style="color: #D4AF37; margin-bottom: 6px;">Allocated Bullion</h4>
          <p style="color: #94a3b8; font-size: 13px;">Bar-level serialized LBMA 400 oz Good Delivery bars vaulted in Zurich and London.</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">[FORGE]</div>
          <h4 style="color: #D4AF37; margin-bottom: 6px;">Streaming Forge</h4>
          <p style="color: #94a3b8; font-size: 13px;">Underwrites mine CAPEX in exchange for perpetual streams at $750/oz (70%+ margin).</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">[SECURITY]</div>
          <h4 style="color: #D4AF37; margin-bottom: 6px;">Post-Quantum</h4>
          <p style="color: #94a3b8; font-size: 13px;">NIST Dilithium-3 lattice signatures and hardware QRNG vacuum entropy beacons.</p>
        </div>
      </div>
    `
  },
  {
    num: 4,
    title: "5 Autonomous Hedge Fund Divisions & Spin-Offs",
    subtitle: "Independent Valuation Drivers • Multi-Stage Capital Formation",
    content: `
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: rgba(0,0,0,0.4); border-radius: 8px; border-left: 4px solid #38bdf8;">
          <div><strong style="color: #fff;">Division 01: DGX Sovereign L1 Corp</strong> <span style="color: #64748b;">(Protocol, Validators & Nodes)</span></div>
          <span style="color: #38bdf8; font-family: monospace;">$50M Initial Tranche</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: rgba(0,0,0,0.4); border-radius: 8px; border-left: 4px solid #fbbf24;">
          <div><strong style="color: #fff;">Division 02: DGX Vault Custody SPV</strong> <span style="color: #64748b;">(Delaware Statutory Trust, $1B Lloyd's Insurance)</span></div>
          <span style="color: #fbbf24; font-family: monospace;">$100M+ Asset Under Custody</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: rgba(0,0,0,0.4); border-radius: 8px; border-left: 4px solid #4ade80;">
          <div><strong style="color: #fff;">Division 03: DGX Mine Streaming Capital</strong> <span style="color: #64748b;">(Franco-Nevada Model: $1,900/oz Cash Margins)</span></div>
          <span style="color: #4ade80; font-family: monospace;">$150M Standalone Spin-Off</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: rgba(0,0,0,0.4); border-radius: 8px; border-left: 4px solid #a855f7;">
          <div><strong style="color: #fff;">Division 04: DGX Prime Exchange Desk</strong> <span style="color: #64748b;">(Atomic 1-Sec DvP Clearing & Institutional RFQ)</span></div>
          <span style="color: #a855f7; font-family: monospace;">Regulated ATS / MTF</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: rgba(0,0,0,0.4); border-radius: 8px; border-left: 4px solid #2dd4bf;">
          <div><strong style="color: #fff;">Division 05: DGX Green Gold ESG Labs</strong> <span style="color: #64748b;">(IoT Emission Tracking, Net-Zero Bullion +$25/oz)</span></div>
          <span style="color: #2dd4bf; font-family: monospace;">Sovereign ESG Rating Agency</span>
        </div>
      </div>
    `
  },
  {
    num: 5,
    title: "Mining Forward Streaming: The Institutional Cash Engine",
    subtitle: "Modeled after Franco-Nevada ($25B Mkt Cap) and Wheaton Precious Metals ($28B Mkt Cap)",
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px;">
        <div style="padding: 24px; background: rgba(0,0,0,0.5); border: 1px solid rgba(74,222,128,0.4); border-radius: 12px;">
          <h4 style="color: #4ade80; font-size: 20px; margin-bottom: 12px;">Cash Margin Unit Economics</h4>
          <div style="display: flex; flex-direction: column; gap: 8px; font-family: monospace; font-size: 14px;">
            <div style="display: flex; justify-content: space-between;"><span>Prevailing Spot Gold:</span> <span style="color: #fff;">$2,650.00 / oz</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Fixed Streaming Purchase:</span> <span style="color: #ef4444;">- $750.00 / oz</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Refining, Assay & Insurance:</span> <span style="color: #ef4444;">- $35.00 / oz</span></div>
            <div style="border-top: 1px solid #334155; margin: 6px 0;"></div>
            <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #4ade80;"><span>Net Free Cash Margin:</span> <span>+$1,865.00 / oz</span></div>
          </div>
        </div>
        <div style="padding: 24px; background: rgba(0,0,0,0.5); border-radius: 12px;">
          <h4 style="color: #fff; font-size: 18px; margin-bottom: 12px;">Scale Projection (Annual Cash Flow)</h4>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">At 25,000 ounces delivered annually from our first 2 underwritten mines, Division 03 yields <strong style="color: #4ade80;">$46,625,000 in net pre-tax free cash flow</strong>, providing massive yield to backstop the entire network.</p>
        </div>
      </div>
    `
  },
  {
    num: 6,
    title: "Post-Quantum Dilithium-3 & Real-Time Bar Telemetry",
    subtitle: "Quantum-Resistant Lattice Encryption • QRNG Proof-of-Reserves Beacons",
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px;">
          <h4 style="color: #38bdf8; margin-bottom: 8px;">NIST FIPS 204 Crystals-Dilithium-3</h4>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">Lattice-based cryptography securing all validator consensus blocks, preventing state-sponsored quantum decryption of high-value sovereign reserves.</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px;">
          <h4 style="color: #D4AF37; margin-bottom: 8px;">Hardware Quantum Randomness (QRNG)</h4>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">True entropy beacons derived from quantum optical vacuum noise stamp every vault audit, ensuring audits cannot be spoofed or pre-computed.</p>
        </div>
      </div>
    `
  },
  {
    num: 7,
    title: "5-Year Pro-Forma Revenue & AUC Growth",
    subtitle: "$11.6M Year 1 Net Revenue scaling to $607.5M Year 5",
    content: `
      <table style="width: 100%; margin-top: 20px; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 1px solid #334155; color: #D4AF37; text-align: left;">
            <th style="padding: 10px;">Metric</th>
            <th style="padding: 10px;">Year 1</th>
            <th style="padding: 10px;">Year 2</th>
            <th style="padding: 10px;">Year 3</th>
            <th style="padding: 10px;">Year 4</th>
            <th style="padding: 10px;">Year 5</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff;">
            <td style="padding: 10px;">Vaulted Gold (oz)</td>
            <td style="padding: 10px;">25,000</td>
            <td style="padding: 10px;">85,000</td>
            <td style="padding: 10px;">250,000</td>
            <td style="padding: 10px;">650,000</td>
            <td style="padding: 10px;">1,500,000</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #38bdf8;">
            <td style="padding: 10px;">Assets Under Custody</td>
            <td style="padding: 10px;">$66M</td>
            <td style="padding: 10px;">$225M</td>
            <td style="padding: 10px;">$662M</td>
            <td style="padding: 10px;">$1.72B</td>
            <td style="padding: 10px;">$3.97B</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #4ade80;">
            <td style="padding: 10px;">Net Revenue</td>
            <td style="padding: 10px;">$11.6M</td>
            <td style="padding: 10px;">$45.8M</td>
            <td style="padding: 10px;">$126.9M</td>
            <td style="padding: 10px;">$286.1M</td>
            <td style="padding: 10px;">$607.5M</td>
          </tr>
          <tr style="color: #fbbf24; font-weight: 700;">
            <td style="padding: 10px;">EBITDA Margin</td>
            <td style="padding: 10px;">68%</td>
            <td style="padding: 10px;">74%</td>
            <td style="padding: 10px;">78%</td>
            <td style="padding: 10px;">81%</td>
            <td style="padding: 10px;">83%</td>
          </tr>
        </tbody>
      </table>
    `
  },
  {
    num: 8,
    title: "Phased Capital Formation Roadmap",
    subtitle: "Tranche 1 ($50M) to Public Dual-Track IPO ($300M+)",
    content: `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 30px;">
        <div style="padding: 16px; background: rgba(0,0,0,0.4); border-top: 4px solid #38bdf8; border-radius: 8px;">
          <h4 style="color: #38bdf8; font-size: 15px;">Phase 1: Genesis</h4>
          <div style="font-size: 18px; font-weight: 700; color: #fff; margin: 4px 0;">$50,000,000</div>
          <p style="font-size: 12px; color: #94a3b8;">L1 testnet, 15k oz physical treasury, Reg D 506(c) filing, Zurich enclave.</p>
        </div>
        <div style="padding: 16px; background: rgba(0,0,0,0.4); border-top: 4px solid #4ade80; border-radius: 8px;">
          <h4 style="color: #4ade80; font-size: 15px;">Phase 2: Streaming</h4>
          <div style="font-size: 18px; font-weight: 700; color: #fff; margin: 4px 0;">$100,000,000</div>
          <p style="font-size: 12px; color: #94a3b8;">Spin off Div 3, underwrite 3 commercial mines, first refinery deliveries.</p>
        </div>
        <div style="padding: 16px; background: rgba(0,0,0,0.4); border-top: 4px solid #fbbf24; border-radius: 8px;">
          <h4 style="color: #fbbf24; font-size: 15px;">Phase 3: Prime DvP</h4>
          <div style="font-size: 18px; font-weight: 700; color: #fff; margin: 4px 0;">$150,000,000</div>
          <p style="font-size: 12px; color: #94a3b8;">Licensed ATS exchange, BitGo Trust integration, $660M+ AUC.</p>
        </div>
        <div style="padding: 16px; background: rgba(0,0,0,0.4); border-top: 4px solid #a855f7; border-radius: 8px;">
          <h4 style="color: #a855f7; font-size: 15px;">Phase 4: Public IPO</h4>
          <div style="font-size: 18px; font-weight: 700; color: #fff; margin: 4px 0;">$300,000,000+</div>
          <p style="font-size: 12px; color: #94a3b8;">Dual-track TSX/NYSE listing of streaming arm, central bank integrations.</p>
        </div>
      </div>
    `
  },
  {
    num: 9,
    title: "Competitive Matrix: DGX vs. Market Incumbents",
    subtitle: "Full Sovereign L1 Stack vs. Monolithic Smart Contracts",
    content: `
      <table style="width: 100%; margin-top: 20px; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 1px solid #334155; color: #D4AF37; text-align: left;">
            <th style="padding: 8px;">Feature</th>
            <th style="padding: 8px;">DGX Network</th>
            <th style="padding: 8px;">PAXG</th>
            <th style="padding: 8px;">XAUT</th>
            <th style="padding: 8px;">Franco-Nevada</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff;">
            <td style="padding: 8px;">Own Layer-1 Blockchain</td>
            <td style="padding: 8px; color: #4ade80; font-weight: 700;">YES (Dedicated)</td>
            <td style="padding: 8px; color: #ef4444;">NO (Ethereum)</td>
            <td style="padding: 8px; color: #ef4444;">NO (Ethereum)</td>
            <td style="padding: 8px; color: #ef4444;">NO (Traditional)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff;">
            <td style="padding: 8px;">Mine Streaming Yield</td>
            <td style="padding: 8px; color: #4ade80; font-weight: 700;">YES (70% Margin)</td>
            <td style="padding: 8px; color: #ef4444;">NO</td>
            <td style="padding: 8px; color: #ef4444;">NO</td>
            <td style="padding: 8px; color: #4ade80;">YES (Equity)</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff;">
            <td style="padding: 8px;">Post-Quantum Dilithium-3</td>
            <td style="padding: 8px; color: #4ade80; font-weight: 700;">YES</td>
            <td style="padding: 8px; color: #ef4444;">NO</td>
            <td style="padding: 8px; color: #ef4444;">NO</td>
            <td style="padding: 8px; color: #64748b;">N/A</td>
          </tr>
          <tr style="color: #fff;">
            <td style="padding: 8px;">Atomic 1-Sec DvP Settlement</td>
            <td style="padding: 8px; color: #4ade80; font-weight: 700;">YES</td>
            <td style="padding: 8px; color: #ef4444;">NO</td>
            <td style="padding: 8px; color: #ef4444;">NO</td>
            <td style="padding: 8px; color: #ef4444;">NO (T+3)</td>
          </tr>
        </tbody>
      </table>
    `
  },
  {
    num: 10,
    title: "Regulatory Compliance & Legal Perimeter",
    subtitle: "SEC Regulation D 506(c) • Swiss FinMA • EU MiCA • UCC Title Perfection",
    content: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 24px;">
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px;">
          <h4 style="color: #D4AF37; margin-bottom: 8px;">United States</h4>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">Offered under SEC Reg D 506(c) & Reg S. UCC Article 8/9 title perfection for 100% beneficial gold ownership.</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px;">
          <h4 style="color: #D4AF37; margin-bottom: 8px;">Switzerland / FinMA</h4>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">Asset-backed payment token backed by physical bullion in non-SWIFT Zurich Freezones.</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px;">
          <h4 style="color: #D4AF37; margin-bottom: 8px;">European Union / MiCA</h4>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">Asset-Referenced Token (ART) provisions with full 1:1 segregated custody and continuous independent auditing.</p>
        </div>
      </div>
    `
  },
  {
    num: 11,
    title: "Capital Request & Use of Proceeds ($50M Series A)",
    subtitle: "60% Allocated Directly to Physical Bullion for Investor Protection",
    content: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px;">
        <div style="padding: 24px; background: rgba(0,0,0,0.5); border-radius: 12px;">
          <h4 style="color: #38bdf8; font-size: 18px; margin-bottom: 16px;">Use of Proceeds Allocation</h4>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between;"><span style="color: #4ade80; font-weight: 700;">60% ($30.0M)</span> <span>Physical LBMA Gold Bars (Zurich Vault)</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #38bdf8; font-weight: 700;">24% ($12.0M)</span> <span>Mine Streaming Facility CAPEX (2 Mines)</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #fbbf24; font-weight: 700;">10% ($5.0M)</span> <span>L1 Node Hardening & Validator Consortium</span></div>
            <div style="display: flex; justify-content: space-between;"><span style="color: #a855f7; font-weight: 700;">6% ($3.0M)</span> <span>Legal, Regulatory & Depository SPV Setup</span></div>
          </div>
        </div>
        <div style="padding: 24px; background: rgba(0,0,0,0.5); border-radius: 12px;">
          <h4 style="color: #D4AF37; font-size: 18px; margin-bottom: 12px;">Investor Downside Shield</h4>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Unlike traditional software startups where 100% of capital is burned on headcount, <strong style="color: #4ade80;">$30M remains on the balance sheet as pure physical bullion</strong> insured by Lloyd's of London, creating an unprecedented principal protection floor.</p>
        </div>
      </div>
    `
  },
  {
    num: 12,
    title: "Investment Highlights & Execution Team",
    subtitle: "Built to be Funded • Ready for Global Sovereign Scale",
    content: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px;">
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; text-align: center;">
          <div style="font-size: 28px; color: #4ade80;">32.5%</div>
          <h4 style="color: #fff; margin: 6px 0;">Target Blended IRR</h4>
          <p style="color: #94a3b8; font-size: 12px;">Powered by compounding forward stream yields and protocol fee volume.</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; text-align: center;">
          <div style="font-size: 28px; color: #38bdf8;">5 Independent</div>
          <h4 style="color: #fff; margin: 6px 0;">Liquidity Spin-Offs</h4>
          <p style="color: #94a3b8; font-size: 12px;">Pro-rata equity and token distributions across all 5 autonomous divisions.</p>
        </div>
        <div style="padding: 20px; background: rgba(0,0,0,0.4); border-radius: 10px; text-align: center;">
          <div style="font-size: 28px; color: #D4AF37;">$1 Billion</div>
          <h4 style="color: #fff; margin: 6px 0;">Lloyd's Insurance</h4>
          <p style="color: #94a3b8; font-size: 12px;">Tier-1 institutional risk mitigation across all vaulting enclaves.</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 36px;">
        <a href="https://github.com/FTHTrading/DGX" target="_blank" class="btn btn-primary" style="padding: 14px 32px; font-size: 15px; font-weight: 700; text-decoration: none; display: inline-block;">Explore Repository on GitHub →</a>
      </div>
    `
  }
];

let currentSlideIndex = 0;

function renderSlide(index) {
  const container = document.getElementById('deckSlideContent');
  if (!container) return;
  const slide = deckSlides[index];
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 14px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 12px; color: #D4AF37; font-weight: 700; letter-spacing: 1px;">SLIDE ${slide.num} OF ${deckSlides.length}</div>
        <h3 style="font-size: 22px; font-weight: 800; color: #fff; margin: 4px 0;">${slide.title}</h3>
        <div style="font-size: 13px; color: #94a3b8;">${slide.subtitle}</div>
      </div>
      <div style="font-family: monospace; font-size: 13px; color: #D4AF37; background: rgba(212,175,55,0.1); padding: 6px 14px; border-radius: 20px;">
        ${Math.round(((index + 1) / deckSlides.length) * 100)}%
      </div>
    </div>
    <div class="slide-body">
      ${slide.content}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  renderSlide(0);

  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentSlideIndex > 0) {
        currentSlideIndex--;
        renderSlide(currentSlideIndex);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentSlideIndex < deckSlides.length - 1) {
        currentSlideIndex++;
        renderSlide(currentSlideIndex);
      }
    });
  }

// Primary tab switcher handled by DignityApp.switchView
});
