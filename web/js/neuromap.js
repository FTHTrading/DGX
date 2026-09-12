// ==========================================================================
// DGX SOVEREIGN SYSTEM NEUROMAP & MINING TOPOLOGY ENGINE
// Interactive Network Graph showing L1 Core, Vaults, and Mine Concessions
// ==========================================================================

const mineData = [
  {
    id: "EUREKA-NV",
    name: "Eureka Sovereign Concession #1",
    jurisdiction: "Nevada, USA (Carlin Trend)",
    standard: "SEC Regulation S-K 1300 / NI 43-101",
    qpCert: "Qualified Person: Dr. H. Vance, P.Geo (SME #40921)",
    provenReservesOz: 750000,
    annualProductionOz: 45000,
    averageGradeGpt: 4.85,
    upfrontCapexFunded: "$25,000,000 USD",
    streamingDeliveryPrice: "$750.00 / oz",
    currentSpotPrice: "$2,650.50 / oz",
    netMarginPerOz: "$1,865.50 / oz",
    annualNetCashMargin: "$37,310,000 USD",
    insuranceCover: "Mine CGL & Inland Marine (Chubb) + $1B Lloyd's Specie in Zurich",
    benefits: [
      "Non-dilutive $25M equipment advance eliminating junior penny-stock dilution",
      "Refinanced predatory 18.5% mezzanine loan down to 0% debt-service streaming",
      "Tripartite escrow at Valcambi SA providing guaranteed off-take within 48 hours of smelting",
      "Full coverage under mine's existing transit insurance + zero vaulting storage costs to mine"
    ]
  },
  {
    id: "RED-LAKE-ON",
    name: "Red Lake High-Grade Concession",
    jurisdiction: "Ontario, Canada (Archean Greenstone)",
    standard: "Canadian National Instrument 43-101 (EDGAR S-K 1300 Filed)",
    qpCert: "Qualified Person: M. Tremblay, P.Eng (CIM #19482)",
    provenReservesOz: 1120000,
    annualProductionOz: 65000,
    averageGradeGpt: 9.40,
    upfrontCapexFunded: "$35,000,000 USD",
    streamingDeliveryPrice: "$750.00 / oz",
    currentSpotPrice: "$2,650.50 / oz",
    netMarginPerOz: "$1,865.50 / oz",
    annualNetCashMargin: "$55,965,000 USD",
    insuranceCover: "Commercial Transit (Zurich Insurance) + Zurich Freezone Lloyd's Policy",
    benefits: [
      "Deep shaft expansion funded without issuing a single share of common stock",
      "Locked $750/oz production cost certainty against inflationary diesel/explosives",
      "Direct integration into DGX Sovereign L1 automated assay verification registry",
      "Net-Zero Green Gold certification through hydro-electric mine grid credit retirement"
    ]
  },
  {
    id: "SOUTH-PASS-WY",
    name: "South Pass Orogenic Deposit",
    jurisdiction: "Wyoming, USA (Wind River Range)",
    standard: "SEC Regulation S-K subpart 1300 TRS",
    qpCert: "Qualified Person: R. Sterling, CPG (AIPG #11840)",
    provenReservesOz: 480000,
    annualProductionOz: 28000,
    averageGradeGpt: 5.20,
    upfrontCapexFunded: "$15,000,000 USD",
    streamingDeliveryPrice: "$750.00 / oz",
    currentSpotPrice: "$2,650.50 / oz",
    netMarginPerOz: "$1,865.50 / oz",
    annualNetCashMargin: "$23,500,000 USD",
    insuranceCover: "Property & Marine Bailee (Travelers) + Delaware Depository $1B Master",
    benefits: [
      "Permitted heap-leach expansion funded directly from Series A capital pool",
      "UCC Article 9 statutory commercial lien perfected in Wyoming Secretary of State",
      "Direct delivery into Delaware Depository enclave under US statutory trust protection",
      "Local state royalty incentives tied to DGX Wyoming DAO infrastructure"
    ]
  },
  {
    id: "SONORA-MEX",
    name: "Sonora Northern Epithermal Mine",
    jurisdiction: "Sonora, Mexico (Sierra Madre Gold Belt)",
    standard: "SEC S-K 1300 / JORC Code 2012",
    qpCert: "Qualified Person: Ing. Carlos Morales (AIMMGM #8492)",
    provenReservesOz: 620000,
    annualProductionOz: 36000,
    averageGradeGpt: 3.95,
    upfrontCapexFunded: "$20,000,000 USD",
    streamingDeliveryPrice: "$750.00 / oz",
    currentSpotPrice: "$2,650.50 / oz",
    netMarginPerOz: "$1,865.50 / oz",
    annualNetCashMargin: "$30,220,000 USD",
    insuranceCover: "International Cargo (AIG) + Zurich Freezone Enclave Lloyd's Coverage",
    benefits: [
      "Complete CIP (Carbon-in-Pulp) processing circuit buildout without sovereign debt risk",
      "Elimination of currency foreign-exchange risk via direct USD/USDC atomic clearing",
      "Cross-border export clearance facilitated via PAMP SA Swiss refiner escrow",
      "Armored transit from Hermosillo to Zurich Airport insured at 110% of London PM fix"
    ]
  },
  {
    id: "PILBARA-WA",
    name: "Pilbara Basin Gold Concession",
    jurisdiction: "Western Australia (Pilbara Craton)",
    standard: "Australasian JORC Code 2012 (SEC S-K 1300 Compatible)",
    qpCert: "Qualified Person: G. Fitzpatrick, FAusIMM (#204918)",
    provenReservesOz: 890000,
    annualProductionOz: 52000,
    averageGradeGpt: 6.10,
    upfrontCapexFunded: "$30,000,000 USD",
    streamingDeliveryPrice: "$750.00 / oz",
    currentSpotPrice: "$2,650.50 / oz",
    netMarginPerOz: "$1,865.50 / oz",
    annualNetCashMargin: "$43,650,000 USD",
    insuranceCover: "Mine Property Policy (QBE Australia) + Perth/Zurich Lloyd's Specie",
    benefits: [
      "Solar array & battery storage equipment funded to lower diesel operating AISC by 22%",
      "Immediate automated minting of DGX Bullion Tokens upon Perth Mint assay deposit",
      "Direct atomic DvP settlement with Asian institutional bullion houses in Singapore",
      "Certified Zero-Carbon Gold with solar-powered processing audit on L1 ledger"
    ]
  }
];

function initNeuromap() {
  const container = document.getElementById("neuromapCanvasContainer");
  if (!container) return;

  // Render Mine Selector Buttons
  const selectorContainer = document.getElementById("neuromapMineSelector");
  if (selectorContainer) {
    selectorContainer.innerHTML = mineData.map((m, idx) => `
      <button class="mine-select-pill ${idx === 0 ? "active" : ""}" data-mine-id="${m.id}" style="padding: 10px 18px; background: ${idx === 0 ? "rgba(212, 175, 55, 0.25)" : "rgba(15, 23, 42, 0.6)"}; border: 1px solid ${idx === 0 ? "#D4AF37" : "rgba(255, 255, 255, 0.15)"}; border-radius: 8px; color: #fff; cursor: pointer; font-size: 13px; font-weight: 600; text-align: left; transition: all 0.2s;">
        <div style="font-size: 11px; color: #D4AF37; font-family: monospace;">CONCESSION #${idx + 1}</div>
        <div>${m.name}</div>
        <div style="font-size: 11px; color: #94a3b8;">${m.jurisdiction}</div>
      </button>
    `).join("");

    selectorContainer.querySelectorAll(".mine-select-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        selectorContainer.querySelectorAll(".mine-select-pill").forEach(b => {
          b.style.background = "rgba(15, 23, 42, 0.6)";
          b.style.borderColor = "rgba(255, 255, 255, 0.15)";
          b.classList.remove("active");
        });
        btn.style.background = "rgba(212, 175, 55, 0.25)";
        btn.style.borderColor = "#D4AF37";
        btn.classList.add("active");
        renderMineDetails(btn.getAttribute("data-mine-id"));
      });
    });
  }

  renderMineDetails(mineData[0].id);
}

function renderMineDetails(mineId) {
  const mine = mineData.find(m => m.id === mineId) || mineData[0];
  const target = document.getElementById("neuromapDetailsContainer");
  if (!target) return;

  target.innerHTML = `
    <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 28px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 12px; color: #D4AF37; font-weight: 700; font-family: monospace; letter-spacing: 1px;">[GEOLOGICAL CONCESSION DATA SHEET]</div>
          <h3 style="font-size: 24px; font-weight: 800; color: #fff; margin: 4px 0;">${mine.name}</h3>
          <div style="font-size: 14px; color: #38bdf8;">${mine.jurisdiction} • Standard: ${mine.standard}</div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${mine.qpCert}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #64748b;">RESERVE COVERAGE RATIO</div>
          <div style="font-size: 22px; font-weight: 800; color: #4ade80;">${(mine.provenReservesOz / (mine.annualProductionOz * 4)).toFixed(1)}x Verified</div>
          <div style="font-size: 11px; color: #94a3b8;">Threshold: >= 2.5x</div>
        </div>
      </div>

      <!-- Key Financial & Operational Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
        <div style="padding: 14px; background: rgba(0,0,0,0.4); border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">PROVEN RESERVES (P&P)</div>
          <div style="font-size: 18px; font-weight: 700; color: #fff;">${mine.provenReservesOz.toLocaleString()} oz</div>
          <div style="font-size: 11px; color: #94a3b8;">Avg Grade: ${mine.averageGradeGpt} g/t</div>
        </div>
        <div style="padding: 14px; background: rgba(0,0,0,0.4); border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">UPFRONT CAPEX ADVANCE</div>
          <div style="font-size: 18px; font-weight: 700; color: #38bdf8;">${mine.upfrontCapexFunded}</div>
          <div style="font-size: 11px; color: #4ade80;">Non-Dilutive Equipment Facility</div>
        </div>
        <div style="padding: 14px; background: rgba(0,0,0,0.4); border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">FIXED DELIVERY PRICE</div>
          <div style="font-size: 18px; font-weight: 700; color: #fbbf24;">${mine.streamingDeliveryPrice}</div>
          <div style="font-size: 11px; color: #64748b;">Spot: ${mine.currentSpotPrice}</div>
        </div>
        <div style="padding: 14px; background: rgba(0,0,0,0.4); border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">NET STREAMING MARGIN</div>
          <div style="font-size: 18px; font-weight: 700; color: #4ade80;">${mine.netMarginPerOz}</div>
          <div style="font-size: 11px; color: #4ade80;">Annual: ${mine.annualNetCashMargin}</div>
        </div>
      </div>

      <!-- Why Mine Benefits from Dignity RWA -->
      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 16px; font-weight: 700; color: #D4AF37; margin-bottom: 12px;">HOW THIS MINE BENEFITS FROM DIGNITY RWA PARTNERSHIP:</h4>
        <div class="neuromap-benefits-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${mine.benefits.map((b, i) => `
            <div style="padding: 12px 16px; background: rgba(0,0,0,0.3); border-left: 3px solid #D4AF37; border-radius: 6px; font-size: 13px; color: #e2e8f0; line-height: 1.5;">
              <strong style="color: #D4AF37;">Benefit ${i+1}:</strong> ${b}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Dual-Layer Insurance & Self-Custody Explainer -->
      <div style="padding: 18px; background: rgba(2, 132, 199, 0.1); border: 1px solid rgba(2, 132, 199, 0.3); border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-size: 15px; font-weight: 700; color: #38bdf8;">DUAL-LAYER INSURANCE & STATUTORY SELF-CUSTODY STRUCTURE</h4>
          <span style="font-size: 11px; font-family: monospace; color: #4ade80; background: rgba(74,222,128,0.1); padding: 4px 10px; border-radius: 12px;">Zero Coverage Gap Verified</span>
        </div>
        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
          <strong>Layer 1 (Mine-Level):</strong> ${mine.insuranceCover.split(" + ")[0]} covers blasting, stockpiles, and armored transport up to the Swiss refinery doorstep.<br>
          <strong>Layer 2 (Vault Enclave):</strong> ${mine.insuranceCover.split(" + ")[1]} covers allocated Good Delivery bars inside bonded Zurich Freezone enclaves under Delaware Statutory Trust title perfection.
        </div>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  initNeuromap();
});
