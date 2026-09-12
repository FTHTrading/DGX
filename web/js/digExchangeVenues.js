// ==========================================================================
// DIGEXCHANGE MARKETS — JURISDICTIONAL TRADING VENUES & DvP SETTLEMENT
// Multi-Venue Operating Profiles: DigExchange.US, EU, UK, MENA, APAC, Institutional
// ==========================================================================

window.DigExchangeVenues = (function() {
  const venues = [
    {
      id: "venue-us",
      code: "DigExchange.US",
      regulatoryBody: "U.S. SEC / FINRA Regulated ATS Profile",
      eligibleMembers: "Institutional QIBs, Registered Broker-Dealers & Authorized Participants",
      settlementCycle: "Atomic DvP (T+0) via DUSD.SETTLE / Fedwire",
      tradingCalendar: "Monday - Friday (09:30 - 16:00 EST)",
      rulebookVersion: "DIGEX-US-RULEBOOK-2026.2",
      surveillance: "Continuous Wash Trading & Market Abuse Surveillance (Automated Sentinel Hook)",
      activePairs: ["DIGAU.PHYS / USD", "DIGAU.NOTE / USD", "DIGAU.RESOURCE / USD"]
    },
    {
      id: "venue-uk-eu",
      code: "DigExchange.UK / EU",
      regulatoryBody: "UK FCA / EU MiFID II Multilateral Trading Facility (MTF)",
      eligibleMembers: "Professional Clients & Eligible Counterparties (UK/EEA)",
      settlementCycle: "Atomic DvP (T+0) via Euroclear / Swiss Trust Rails",
      tradingCalendar: "Monday - Friday (08:00 - 17:00 GMT/CET)",
      rulebookVersion: "DIGEX-EU-MIFID-2026.1",
      surveillance: "MAR (Market Abuse Regulation) Compliance Feed",
      activePairs: ["DIGAU.PHYS / EUR", "DIGAU.PHYS / GBP", "DIGAU.POOL / USD"]
    },
    {
      id: "venue-mena",
      code: "DigExchange.MENA",
      regulatoryBody: "Dubai Virtual Assets Regulatory Authority (VARA) & DFSA",
      eligibleMembers: "Sovereign Wealth Funds, Regional Islamic Banks & Qualified Family Offices",
      settlementCycle: "Immediate Constructive Title Transfer (AAOIFI Standard 57)",
      tradingCalendar: "Sunday - Thursday (09:00 - 17:00 GST)",
      rulebookVersion: "DIGEX-MENA-HALAL-2026.1",
      surveillance: "Shariah Supervisory Board Real-Time Usufruct Audit Feed",
      activePairs: ["DIGAU.PHYS / AED", "DIGAU.PHYS / USD"]
    },
    {
      id: "venue-inst",
      code: "DigExchange.Institutional",
      regulatoryBody: "Global Bilateral Institutional RFQ & Block Trade Facility",
      eligibleMembers: "Bespoke Liquidity Providers, Central Banks & Primary Refiners",
      settlementCycle: "Bespoke Multi-Party DvP Settlement (Gross or Net Batch)",
      tradingCalendar: "24/7/365 Continuous Institutional Liquidity",
      rulebookVersion: "DIGEX-GLOBAL-BLOCK-2026.4",
      surveillance: "Full Cryptographic Replay from Append-Only Event Logs",
      activePairs: ["DIGAU.PHYS / USD", "DIGAU.STREAM / USD", "DIGAU.RESOURCE / USD"]
    }
  ];

  let currentVenue = venues[0];

  function renderVenuesUI() {
    const selectorEl = document.getElementById('venueSelectorGrid');
    const detailsEl = document.getElementById('selectedVenueDetails');

    if (selectorEl) {
      selectorEl.innerHTML = venues.map(v => `
        <button class="glass-card venue-card-btn ${v.id === currentVenue.id ? 'active' : ''}" data-id="${v.id}" style="padding: 1rem; cursor: pointer; text-align: left; border-radius: 8px; transition: all 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <span class="badge-gold">${v.code}</span>
            <span class="pulse-dot"></span>
          </div>
          <div style="font-weight: 800; font-size: 0.88rem; color: var(--text-pure); margin-bottom: 0.2rem;">${v.regulatoryBody}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${v.settlementCycle}</div>
        </button>
      `).join('');

      selectorEl.querySelectorAll('.venue-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          currentVenue = venues.find(v => v.id === id) || venues[0];
          renderVenuesUI();
        });
      });
    }

    if (detailsEl) {
      detailsEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.8rem; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--gold-core); margin-bottom: 0.2rem;">${currentVenue.code}</h3>
            <span style="font-size: 0.78rem; color: var(--text-secondary); font-family: var(--font-mono);">${currentVenue.regulatoryBody}</span>
          </div>
          <span class="badge-emerald" style="font-size: 0.72rem;">${currentVenue.rulebookVersion}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">SETTLEMENT MODEL</div>
            <div style="font-size: 0.88rem; font-weight: 800; color: var(--emerald-core); font-family: var(--font-mono);">${currentVenue.settlementCycle}</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">TRADING HOURS</div>
            <div style="font-size: 0.88rem; font-weight: 800; color: var(--gold-light); font-family: var(--font-mono);">${currentVenue.tradingCalendar}</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">MARKET SURVEILLANCE</div>
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--cyan-core);">${currentVenue.surveillance}</div>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.3rem;">ACTIVE TRADING PAIRS:</div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${currentVenue.activePairs.map(p => `<span class="badge-gold" style="font-size: 0.75rem;">${p}</span>`).join('')}
          </div>
        </div>
      `;
    }
  }

  return {
    init: renderVenuesUI,
    venues
  };
})();
