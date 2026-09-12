// ==========================================================================
// DGX SOVEREIGN L1 — IN-GROUND MINING FORGE & STREAMING ROYALTY FACILITY
// Crate: dgx-mining-forge
// ==========================================================================

use chrono::Utc;
use dgx_core::InGroundGoldReserve;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Forward Streaming Deal Status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum StreamingStatus {
    Underwriting,
    ActiveProduction,
    DeliveryPending,
    Matured,
    Defaulted,
}

/// Commercial Mining Forward Streaming Contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForwardStreamingContract {
    pub contract_id: String,
    pub concession_id: String,
    pub mine_name: String,
    pub jurisdiction: String,
    pub operator_name: String,
    pub upfront_capex_usd: f64,
    pub stream_percentage_bps: u32,
    pub fixed_purchase_price_oz_usd: f64,
    pub total_oz_committed: f64,
    pub total_oz_delivered: f64,
    pub status: StreamingStatus,
    pub start_timestamp: i64,
    pub maturity_timestamp: i64,
    pub legal_lien_ucc_filing: String,
}

/// Refinery Delivery Batch Receipt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefineryDeliveryReceipt {
    pub delivery_id: String,
    pub contract_id: String,
    pub refinery: String,
    pub gross_weight_oz: f64,
    pub fine_weight_oz: f64,
    pub assay_fineness: u32,
    pub spot_price_at_delivery: f64,
    pub cash_paid_to_operator: f64,
    pub net_streaming_margin_usd: f64,
    pub minted_dgx_tokens: f64,
    pub delivery_timestamp: i64,
}

/// Mining Concession Forge Manager
pub struct MiningForgeManager {
    pub concessions: HashMap<String, InGroundGoldReserve>,
    pub streaming_contracts: HashMap<String, ForwardStreamingContract>,
    pub delivery_history: Vec<RefineryDeliveryReceipt>,
}

impl MiningForgeManager {
    pub fn new() -> Self {
        Self {
            concessions: HashMap::new(),
            streaming_contracts: HashMap::new(),
            delivery_history: Vec::new(),
        }
    }

    pub fn register_concession(&mut self, reserve: InGroundGoldReserve) {
        self.concessions.insert(reserve.concession_id.clone(), reserve);
    }

    pub fn originate_streaming_facility(
        &mut self,
        concession_id: &str,
        upfront_capex_usd: f64,
        stream_percentage_bps: u32,
        fixed_purchase_price_oz_usd: f64,
        total_oz_committed: f64,
        tenor_years: u32,
        ucc_filing: &str,
    ) -> Result<ForwardStreamingContract, String> {
        let concession = self.concessions.get(concession_id)
            .ok_or_else(|| format!("Concession {} not found", concession_id))?;

        let coverage_ratio = concession.proven_probable_oz / total_oz_committed;
        if coverage_ratio < 2.5 {
            return Err(format!("Underwriting rejected: Reserve coverage ratio ({:.2}x) is below 2.5x threshold", coverage_ratio));
        }

        let now = Utc::now().timestamp();
        let maturity = now + (tenor_years as i64 * 365 * 86400);
        let contract_id = format!("STRM-{}-{:08x}", concession.concession_id, now);

        let contract = ForwardStreamingContract {
            contract_id: contract_id.clone(),
            concession_id: concession.concession_id.clone(),
            mine_name: concession.concession_name.clone(),
            jurisdiction: concession.jurisdiction.clone(),
            operator_name: concession.mining_operator.clone(),
            upfront_capex_usd,
            stream_percentage_bps,
            fixed_purchase_price_oz_usd,
            total_oz_committed,
            total_oz_delivered: 0.0,
            status: StreamingStatus::ActiveProduction,
            start_timestamp: now,
            maturity_timestamp: maturity,
            legal_lien_ucc_filing: ucc_filing.to_string(),
        };

        self.streaming_contracts.insert(contract_id, contract.clone());
        Ok(contract)
    }

    pub fn process_refinery_delivery(
        &mut self,
        contract_id: &str,
        refinery: &str,
        fine_weight_oz: f64,
        spot_price_usd: f64,
    ) -> Result<RefineryDeliveryReceipt, String> {
        let contract = self.streaming_contracts.get_mut(contract_id)
            .ok_or_else(|| format!("Streaming contract {} not found", contract_id))?;

        let cash_paid = fine_weight_oz * contract.fixed_purchase_price_oz_usd;
        let gross_market_val = fine_weight_oz * spot_price_usd;
        let net_margin = gross_market_val - cash_paid;

        contract.total_oz_delivered += fine_weight_oz;
        if contract.total_oz_delivered >= contract.total_oz_committed {
            contract.status = StreamingStatus::Matured;
        }

        let now = Utc::now().timestamp();
        let receipt = RefineryDeliveryReceipt {
            delivery_id: format!("DELIV-{:08x}", now),
            contract_id: contract_id.to_string(),
            refinery: refinery.to_string(),
            gross_weight_oz: fine_weight_oz,
            fine_weight_oz,
            assay_fineness: 9999,
            spot_price_at_delivery: spot_price_usd,
            cash_paid_to_operator: cash_paid,
            net_streaming_margin_usd: net_margin,
            minted_dgx_tokens: fine_weight_oz,
            delivery_timestamp: now,
        };

        self.delivery_history.push(receipt.clone());
        Ok(receipt)
    }
}
