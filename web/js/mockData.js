// ==========================================================================
// DIGNITY GLOBAL GOLD NETWORK — CANONICAL IDENTITY GRAPH & TRUST STACK
// Apex Umbrella: Dignity Global Gold Network
// Infrastructure OS: UnyKorn LLC (Atlas, Sentinel, Nexus, Ledger)
// Canonical Namespace: uny://<env>/<jurisdiction>/<entity>/<domain>/<type>/<id>
// ==========================================================================

window.DIGNITY_GLOBAL_NETWORK = {
  // 1. Organization Graph: Canonical legal entities with LEIs and regulatory perimeters
  entities: [
    {
      id: "ORG-DIGNITY-MARKETS",
      name: "Dignity Markets Group LLC",
      lei: "5493006MHB84DD0Z1924",
      jurisdiction: "US-DE (Delaware, United States)",
      role: "Broker-Dealer & Regulated Capital Markets Distribution",
      regulatoryPerimeter: "SEC / FINRA Regulated Broker-Dealer & ATS Operator",
      products: ["DIGAU.PHYS", "DIGAU.NOTE", "DIGAU.RESOURCE", "DIGAU.CARBON"],
      namespaceRoot: "uny://prod/us-de/dignity-markets-group",
      status: "ACTIVE • LICENSED"
    },
    {
      id: "ORG-DIGNITY-ASSET-TRUST",
      name: "Dignity Asset Trust (Sovereign Custody)",
      lei: "5493008KLP92CC1Y8810",
      jurisdiction: "US-WY (Wyoming Sovereign Trust)",
      role: "Physical Bullion Issuance & Vault Trustee",
      regulatoryPerimeter: "Wyoming Statutory Trust Act • Independent Fiduciary Trustee",
      products: ["DIGAU.PHYS", "DIGAU.POOL"],
      namespaceRoot: "uny://prod/us-wy/dignity-asset-trust",
      status: "ACTIVE • REGISTERED"
    },
    {
      id: "ORG-DIGNITY-RESOURCE-FIN",
      name: "Dignity Resource Finance SPV",
      lei: "5493001NZA73XX5T4402",
      jurisdiction: "CA-ON (Ontario, Canada)",
      role: "Mining Royalties, Streams & Geological Disclosures",
      regulatoryPerimeter: "NI 43-101 / JORC Geological Reporting Issuer",
      products: ["DIGAU.ROYALTY", "DIGAU.STREAM", "DIGAU.RESOURCE", "DIGAU.CARBON"],
      namespaceRoot: "uny://prod/ca-on/dignity-resource-finance",
      status: "ACTIVE • AUDITED"
    },
    {
      id: "ORG-DIGEXCHANGE-MARKETS",
      name: "DigExchange Markets International Ltd",
      lei: "5493003BVC81MM2Q7719",
      jurisdiction: "UK / UAE / US Multi-Venue",
      role: "Regulated Trading Venue & Clearing Facility",
      regulatoryPerimeter: "Multilateral Trading Facility (MTF) & Regulated Digital Venue",
      products: ["DIGAU.PHYS", "DIGAU.POOL", "DUSD.SETTLE", "CARBON.T1"],
      namespaceRoot: "uny://prod/global/digexchange-markets",
      status: "ACTIVE • MULTI-VENUE"
    },
    {
      id: "ORG-UNYKORN-INFRA",
      name: "UnyKorn LLC",
      lei: "5493007XYZ99AA8B3310",
      jurisdiction: "US-WY (Wyoming, United States)",
      role: "Neutral Technology, Identity, Evidence & Settlement OS",
      regulatoryPerimeter: "Non-Custodial Enterprise Software & Protocol Engineering Provider",
      products: ["Atlas OS", "Sentinel Engine", "Nexus Gateway", "Ledger Core"],
      namespaceRoot: "uny://prod/global/unykorn-infrastructure",
      status: "ACTIVE • TECHNOLOGY OS"
    }
  ],

  // 2. Canonical Product Families
  productFamilies: [
    {
      family: "DIGAU.PHYS",
      title: "Allocated Physical Bullion",
      meaning: "Direct legal title to specific LBMA 400 oz Good Delivery bars in accredited vaults.",
      prohibitedConfusion: "Must NEVER be confused with unallocated gold, ETFs, or mining claims.",
      redemptionModel: "Direct physical bar delivery at vault enclave or wire redemption at par.",
      unit: "1 DIGAU.PHYS = 1 Troy Ounce of Allocated 999.9 Fine Gold",
      backingRatio: "100.0% Vaulted Physical Bullion"
    },
    {
      family: "DIGAU.POOL",
      title: "Unallocated Pooled Bullion Exposure",
      meaning: "Contractual undivided fractional claim against a vaulted institutional gold pool.",
      prohibitedConfusion: "Must NEVER be confused with specific bar serial ownership.",
      redemptionModel: "Cash par redemption or conversion to DIGAU.PHYS upon minimum batch size.",
      unit: "1 DIGAU.POOL = 1 Troy Ounce Pool Entitlement",
      backingRatio: "100.0% Pooled Metal Reserve"
    },
    {
      family: "DIGAU.RESOURCE",
      title: "In-Ground Geological Resource Interest",
      meaning: "Tokenized beneficial interest in proven & probable in-ground reserves (NI 43-101 / JORC).",
      prohibitedConfusion: "Must NEVER be confused with vaulted bullion or immediately deliverable gold.",
      redemptionModel: "Subject to 65-68% extraction haircut; convertible upon refining.",
      unit: "1 DIGAU.RESOURCE = 1 Ounce Proven In-Ground Geological Claim",
      backingRatio: "NI 43-101 Verified Geological Deposit"
    },
    {
      family: "DIGAU.STREAM",
      title: "Mining Royalty & Production Stream",
      meaning: "Contractual claim to ongoing percentage of physical production from specific operating mines.",
      prohibitedConfusion: "Must NEVER be confused with existing refined warehouse gold.",
      redemptionModel: "Forward physical doré or cash delivery upon mine production batches.",
      unit: "1 DIGAU.STREAM = 1 Ounce Forward Mine Production Allocation",
      backingRatio: "Signed Mining Concession Royalty Agreement"
    },
    {
      family: "DIGAU.CARBON",
      title: "Tier-1 Mine ESG Carbon Offset Credit",
      meaning: "Verra VCS / Gold Standard certified carbon credits generated from mine remediation, clean power, and tailings recycling.",
      prohibitedConfusion: "Must NEVER be confused with physical gold; represents verifiable carbon sequestration.",
      redemptionModel: "Permanent on-chain retirement with registry certificate generation.",
      unit: "1 DIGAU.CARBON = 1 Metric Tonne CO2e Offset",
      backingRatio: "Verified Environmental Sequestration Audit"
    },
    {
      family: "DUSD.SETTLE",
      title: "Settlement Cash Leg",
      meaning: "1:1 USD par payment stablecoin or bank ledger cash token for atomic DvP clearing.",
      prohibitedConfusion: "Must NEVER be confused with an unbacked stablecoin or gold derivative.",
      redemptionModel: "Instant 24/7 par redemption ($1.00 USD) via Fedwire / RTP APIs.",
      unit: "1 DUSD.SETTLE = $1.00 USD Cash Reserve",
      backingRatio: "100.0% Insured Cash & Short-Dated US Treasuries"
    }
  ],

  // 3. Allocated Physical LBMA Good Delivery 400 oz Bars
  bars: [
    {
      serial: "VAL-CH-994820",
      refiner: "Valcambi SA (Switzerland)",
      fineness: "999.9 Fine 24K",
      grossWeightOz: 400.125,
      fineWeightOz: 400.085,
      vaultLocation: "Zurich Freezone Depository, Switzerland",
      vaultAccount: "ALLOC-001882",
      acquisitionDate: "2024-03-15",
      assayReportHash: "0x89a1f4b2c3d0e9a8f7e6d5c4b3a201f9e8d7c6b5a49382716059483726150493",
      insurancePolicy: "Lloyd's of London Specie LLOYDS-LBN-VAL-9918",
      insuranceCap: "$50,000,000 USD",
      status: "ALLOCATED & SECURED",
      namespace: "uny://prod/ch-zurich/dignity-asset-trust/asset/bar/VAL-CH-994820"
    },
    {
      serial: "PAMP-CH-881029",
      refiner: "PAMP SA (Switzerland)",
      fineness: "999.9 Fine 24K",
      grossWeightOz: 400.050,
      fineWeightOz: 400.010,
      vaultLocation: "Zurich Freezone Depository, Switzerland",
      vaultAccount: "ALLOC-001882",
      acquisitionDate: "2024-05-20",
      assayReportHash: "0x4b7c89a0e1f2d3c4b5a697887766554433221100ffeeddccbbaa998877665544",
      insurancePolicy: "Lloyd's of London Specie LLOYDS-LBN-PAMP-7721",
      insuranceCap: "$50,000,000 USD",
      status: "ALLOCATED & SECURED",
      namespace: "uny://prod/ch-zurich/dignity-asset-trust/asset/bar/PAMP-CH-881029"
    },
    {
      serial: "ARGOR-CH-710492",
      refiner: "Argor-Heraeus SA (Switzerland)",
      fineness: "999.9 Fine 24K",
      grossWeightOz: 400.220,
      fineWeightOz: 400.180,
      vaultLocation: "London LBMA Vaults, United Kingdom",
      vaultAccount: "ALLOC-002194",
      acquisitionDate: "2024-06-11",
      assayReportHash: "0x332211445566778899aabbccddeeff00112233445566778899aabbccddeeff00",
      insurancePolicy: "Marsh McLennan All-Risks MARSH-UK-LBMA-4402",
      insuranceCap: "$75,000,000 USD",
      status: "ALLOCATED & SECURED",
      namespace: "uny://prod/uk-london/dignity-asset-trust/asset/bar/ARGOR-CH-710492"
    },
    {
      serial: "PERTH-AU-609124",
      refiner: "The Perth Mint (Australia)",
      fineness: "999.9 Fine 24K",
      grossWeightOz: 400.180,
      fineWeightOz: 400.140,
      vaultLocation: "Delaware Depository, United States",
      vaultAccount: "ALLOC-003401",
      acquisitionDate: "2024-08-01",
      assayReportHash: "0x77889900aabbccddeeff11223344556677889900aabbccddeeff112233445566",
      insurancePolicy: "AON Risk Depository Vault AON-US-DEL-5510",
      insuranceCap: "$40,000,000 USD",
      status: "ALLOCATED & SECURED",
      namespace: "uny://prod/us-de/dignity-asset-trust/asset/bar/PERTH-AU-609124"
    }
  ],

  // 4. In-Ground NI 43-101 Mining Concessions
  concessions: [
    {
      id: "NI43-101-EUREKA-NV",
      name: "Eureka Gold Basin Mining Claims",
      jurisdiction: "Nevada, United States",
      provenReservesOz: 2150000,
      measuredOz: 4380000,
      avgGrade: "2.85 g/t Au",
      qpAuthor: "Dr. Marcus Vance, P.Geo, M.Sc.",
      reportDate: "2024-04-12",
      extractionHaircut: "68.0%",
      discountedNavUsd: 1823200000,
      spvEntity: "Eureka Gold Basin Development SPV LLC",
      docHash: "0xaa11bb22cc33dd44ee55ff6677889900112233445566778899aabbccddeeff11",
      namespace: "uny://prod/us-nv/dignity-resource-finance/project/NI43-101-EUREKA-NV"
    },
    {
      id: "NI43-101-WINDRIVER-WY",
      name: "Wind River Placer & Lode Concession",
      jurisdiction: "Wyoming, United States",
      provenReservesOz: 1300000,
      measuredOz: 2920000,
      avgGrade: "3.40 g/t Au",
      qpAuthor: "Sarah Jenkins, FAusIMM, QP Mining",
      reportDate: "2024-07-28",
      extractionHaircut: "65.0%",
      discountedNavUsd: 1205750000,
      spvEntity: "Wind River Mineral Resources Trust",
      docHash: "0xbb22cc33dd44ee55ff6677889900112233445566778899aabbccddeeff112233",
      namespace: "uny://prod/us-wy/dignity-resource-finance/project/NI43-101-WINDRIVER-WY"
    }
  ],

  // 5. Tier-1 Mine ESG Carbon Offset Credits
  carbonCredits: [
    {
      id: "VCS-1849-MINE-RECLAIM",
      projectName: "Eureka Basin Solar Microgrid & Tailings Wetlands Remediation",
      registry: "Verra Verified Carbon Standard (VCS)",
      serialRange: "VCS-1849-2024-001 to 085000",
      vintage: "2024",
      totalTonsCO2e: 85000,
      availableTons: 64200,
      retiredTons: 20800,
      auditor: "Bureau Veritas Certification",
      methodology: "VM0007 / ACM0002 Clean Mine Energy",
      status: "ACTIVE • VERIFIED",
      offsetRatePerOzGold: "0.45 tCO2e / oz",
      docHash: "0xee44bb9911ff00223344556677889900aabbccddeeff112233445566778899aa"
    },
    {
      id: "GS-5012-SOLAR-MILL",
      projectName: "Wind River Clean Hydro Placer Electrification",
      registry: "Gold Standard for the Global Goals (GS)",
      serialRange: "GS-5012-2024-001 to 062500",
      vintage: "2024",
      totalTonsCO2e: 62500,
      availableTons: 49100,
      retiredTons: 13400,
      auditor: "DNV GL Business Assurance",
      methodology: "GS TPDD v3.1 Clean Hydro Offsets",
      status: "ACTIVE • VERIFIED",
      offsetRatePerOzGold: "0.38 tCO2e / oz",
      docHash: "0xff55cc0022aa113344556677889900aabbccddeeff112233445566778899bb"
    }
  ],

  // 6. Real-Time IoT Sensor Telemetry from Mine Sites
  iotSensors: [
    {
      id: "SN-IOT-EUK-PH01",
      site: "Eureka Basin Mine (NV)",
      parameter: "Tailings Water Quality (pH)",
      reading: "7.42 pH",
      status: "OPTIMAL",
      range: "7.0 - 8.5 pH",
      telemetrySource: "Endress+Hauser Digital Memosens Gateway",
      lastTimestamp: "Just now"
    },
    {
      id: "SN-IOT-EUK-SOLAR02",
      site: "Eureka Basin Mine (NV)",
      parameter: "Solar Microgrid Power Output",
      reading: "4.85 MW",
      status: "ACTIVE (100% Zero-Carbon Mill)",
      range: "0 - 5.0 MW Peak",
      telemetrySource: "Schneider Electric EcoStruxure IoT",
      lastTimestamp: "1s ago"
    },
    {
      id: "SN-IOT-EUK-EMISS03",
      site: "Eureka Basin Mine (NV)",
      parameter: "Methane / Fugitive Gas Flaring",
      reading: "0.02 ppm",
      status: "ZERO FLARING",
      range: "< 0.5 ppm threshold",
      telemetrySource: "Honeywell SPM Gas Analyzer",
      lastTimestamp: "3s ago"
    },
    {
      id: "SN-IOT-WND-HYD01",
      site: "Wind River Concession (WY)",
      parameter: "Hydro-Kinetic Mill Turbine Flow",
      reading: "1,240 gal/min",
      status: "RUNNING 1.2 MW",
      range: "1,000 - 1,500 gal/min",
      telemetrySource: "Siemens Sitrans F M MAG Flowmeter",
      lastTimestamp: "Just now"
    },
    {
      id: "SN-IOT-WND-TAIL02",
      site: "Wind River Concession (WY)",
      parameter: "Tailings Basin Geotechnical Settling",
      reading: "14.8 m (Stable)",
      status: "VERIFIED STABLE",
      range: "Max safe height 22.0 m",
      telemetrySource: "RST Instruments Digital Piezometer Array",
      lastTimestamp: "2s ago"
    }
  ],

  // 7. Internal Cold Vault Depositories & Insurance Desk
  vaults: [
    {
      vaultId: "VAULT-ZURICH-01",
      facilityName: "Zurich Freezone Depository Enclave",
      operator: "Zurich Bullion Safe Depository AG",
      jurisdiction: "Zurich, Switzerland",
      securityRating: "Class 10 Euro-Norm 1143-1 Vault Enclave",
      auditor: "Bureau Veritas LBMA Annual Physical Count",
      barsStored: 2,
      totalFineOz: 800.095,
      insurancePolicy: "Lloyd's of London Specie Policy LLOYDS-LBN-VAL-9918",
      insuranceUnderwriter: "Lloyd's Syndicate 2003 / Catlin",
      coverageLimitUsd: 50000000,
      segregatedAccount: "ALLOC-001882",
      status: "ACTIVE • UNDER SECURE CUSTODY"
    },
    {
      vaultId: "VAULT-LONDON-02",
      facilityName: "London City Bullion Depository",
      operator: "London Security Storage Corp",
      jurisdiction: "London, United Kingdom",
      securityRating: "LBMA Approved Precious Metal Deep Vault",
      auditor: "PwC UK Physical Assay Attestation",
      barsStored: 1,
      totalFineOz: 400.180,
      insurancePolicy: "Marsh McLennan Comprehensive Specie MARSH-UK-LBMA-4402",
      insuranceUnderwriter: "Chubb European Group SE",
      coverageLimitUsd: 75000000,
      segregatedAccount: "ALLOC-002194",
      status: "ACTIVE • UNDER SECURE CUSTODY"
    },
    {
      vaultId: "VAULT-DELAWARE-03",
      facilityName: "Delaware Depository Vault Enclave",
      operator: "Delaware Depository Service Company",
      jurisdiction: "Wilmington, Delaware, United States",
      securityRating: "Class 3 UL Listed Commercial Vault Facility",
      auditor: "RSM US LLP Vault Physical Verification",
      barsStored: 1,
      totalFineOz: 400.140,
      insurancePolicy: "AON Risk Depository Vault AON-US-DEL-5510",
      insuranceUnderwriter: "Travelers Casualty and Surety Co",
      coverageLimitUsd: 40000000,
      segregatedAccount: "ALLOC-003401",
      status: "ACTIVE • UNDER SECURE CUSTODY"
    }
  ],

  // 8. Sovereign Smart Contracts (Rust / CosmWasm / Solana)
  smartContracts: [
    {
      contractId: "DignityGoldL1::VaultLienRegistry.rs",
      chain: "Dignity Sovereign L1 (Rust Native)",
      standard: "PoG-QBFT Title Standard",
      description: "Registers allocated LBMA bullion bars, binds UCC-1 commercial liens, and executes immutable title transfers.",
      gasModel: "Zero Gas / Stake-Weighted Allocation",
      abiMethods: [
        { name: "registerAllocatedBar", args: ["serial: String", "refiner: String", "fine_weight_oz: u64", "vault_acc: String", "assay_hash: [u8; 32]"] },
        { name: "transferAllocatedTitle", args: ["serial: String", "from_entity: Address", "to_entity: Address", "policy_decision_id: String"] },
        { name: "queryBarTitle", args: ["serial: String"], returns: "BarTitleRecord" }
      ],
      rustCodeSnippet: `// Dignity Sovereign L1: VaultLienRegistry.rs
pub fn transfer_allocated_title(
    ctx: &mut Context,
    serial: BarSerial,
    from: LegalEntityId,
    to: LegalEntityId,
    decision_id: PolicyDecisionId,
) -> Result<TitleReceipt, SystemError> {
    // 1. Verify Sentinel policy signature before any state mutation
    sentinel_engine::verify_signed_decision(ctx, &decision_id, &from, &to)?;
    
    // 2. Load bar from vault inventory
    let mut bar = ctx.ledger.get_bar_mut(&serial)?;
    assert_eq!(bar.current_owner, from, "Unauthorized title claim");
    
    // 3. Atomically reassign legal title & emit immutable title receipt
    bar.current_owner = to.clone();
    let receipt = TitleReceipt::new(serial, from, to, ctx.block_height(), ctx.qrng_seed());
    ctx.emit_event(receipt.clone());
    Ok(receipt)
}`
    },
    {
      contractId: "DignityExchange::DvPClearing.rs",
      chain: "Dignity Sovereign L1 (Rust Native)",
      standard: "DvP Par Settlement Standard",
      description: "Executes atomic Delivery-versus-Payment clearing between DIGau gold token leg and DUSD.SETTLE cash leg with zero principal risk.",
      gasModel: "Zero Gas / Priority Queue",
      abiMethods: [
        { name: "settleAtomicDvP", args: ["order_buy_id: u64", "order_sell_id: u64", "qty_oz: u64", "price_usd: u64"] },
        { name: "cancelUnmatched", args: ["order_id: u64"] }
      ],
      rustCodeSnippet: `// Dignity Sovereign L1: DvPClearing.rs
pub fn settle_atomic_dvp(
    ctx: &mut Context,
    buy_id: u64,
    sell_id: u64,
    qty_oz: u64,
    unit_price: u64,
) -> Result<DvPClearingReceipt, ClearingError> {
    let total_cash = qty_oz * unit_price;
    // Atomic dual-leg clearing: both legs succeed or whole tx reverts
    ctx.ledger.transfer_cash_leg(buy_id, sell_id, total_cash)?;
    ctx.ledger.transfer_gold_token_leg(sell_id, buy_id, qty_oz)?;
    
    Ok(DvPClearingReceipt {
        buy_id,
        sell_id,
        qty_oz,
        total_cash_usd: total_cash,
        settled_at: ctx.timestamp(),
    })
}`
    },
    {
      contractId: "DignityMining::ConcessionPassport.rs",
      chain: "Dignity Sovereign L1 (Rust Native)",
      standard: "NI 43-101 Mineral Reserve Standard",
      description: "Anchors mineral rights chains of title, QP geological reports, and continuous production stream royalty distributions.",
      gasModel: "Zero Gas / Fiduciary Validator Endorsed",
      abiMethods: [
        { name: "anchorConcession", args: ["concession_id: String", "proven_oz: u64", "avg_grade: String", "report_hash: [u8; 32]"] },
        { name: "recordDoréProductionBatch", args: ["concession_id: String", "gross_oz: u64", "smelter_receipt: String"] }
      ],
      rustCodeSnippet: `// Dignity Sovereign L1: ConcessionPassport.rs
pub fn anchor_concession(
    ctx: &mut Context,
    concession_id: String,
    proven_oz: u64,
    doc_hash: [u8; 32],
) -> Result<PassportReceipt, MiningError> {
    let passport = MiningPassport {
        concession_id,
        proven_oz,
        qp_report_hash: doc_hash,
        haircut_percent: 68,
        registered_at: ctx.timestamp(),
    };
    ctx.ledger.save_concession(&passport)?;
    Ok(PassportReceipt::new(passport))
}`
    },
    {
      contractId: "DignityEsg::CarbonOffsetCredits.rs",
      chain: "Dignity Sovereign L1 (Rust Native)",
      standard: "Verra VCS / Gold Standard Offset Standard",
      description: "Connects live IoT environmental sensors to Tier-1 Carbon Offset credit generation and on-chain retirement against gold production.",
      gasModel: "Zero Gas / Green Staking",
      abiMethods: [
        { name: "ingestIoTSensorTelemetry", args: ["sensor_id: String", "reading_val: String", "gateway_sig: [u8; 64]"] },
        { name: "retireOffsetAgainstGold", args: ["credit_id: String", "tons_co2e: u64", "beneficiary_entity: String"] }
      ],
      rustCodeSnippet: `// Dignity Sovereign L1: CarbonOffsetCredits.rs
pub fn retire_offset_against_gold(
    ctx: &mut Context,
    credit_id: String,
    tons_co2e: u64,
    beneficiary: LegalEntityId,
) -> Result<RetirementCertificate, EsgError> {
    let mut credit = ctx.ledger.get_carbon_credit_mut(&credit_id)?;
    assert!(credit.available_tons >= tons_co2e, "Insufficient carbon tonnage");
    
    credit.available_tons -= tons_co2e;
    credit.retired_tons += tons_co2e;
    
    let cert = RetirementCertificate {
        certificate_id: format!("CERT-ESG-{}-{}", ctx.block_height(), tons_co2e),
        credit_id,
        retired_tons: tons_co2e,
        beneficiary,
        retired_at: ctx.timestamp(),
        qrng_audit_beacon: ctx.qrng_seed(),
    };
    ctx.emit_event(cert.clone());
    Ok(cert)
}`
    }
  ],

  // 9. Hardware Enclave Validators
  validators: [
    { name: "Zurich Freezone Enclave (CH)", region: "CH", status: "ONLINE", type: "FIPS 140-2 Level 3", address: "0xVAL_ZURICH_FREEZONE_SWISS_01" },
    { name: "London LBMA Enclave (UK)", region: "GB", status: "ONLINE", type: "Nitro Secure Enclave", address: "0xVAL_LONDON_LBMA_ENCLAVE_02" },
    { name: "Delaware Depository (USA)", region: "US", status: "ONLINE", type: "FIPS 140-3 Hardware", address: "0xVAL_DELAWARE_DEPOSITORY_USA_03" },
    { name: "Singapore Freeport (SG)", region: "SG", status: "ONLINE", type: "SGX Attested Enclave", address: "0xVAL_SINGAPORE_FREEPORT_04" }
  ]
};

// Global aliases for full cross-module compatibility
window.DIGNITY_GLOBAL_NETWORK.physicalBars = window.DIGNITY_GLOBAL_NETWORK.bars;
window.DIGNITY_GOLD_STATE = window.DIGNITY_GLOBAL_NETWORK;

