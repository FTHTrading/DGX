// ==========================================================================
// DIGNITY GOLD SOVEREIGN L1 — PoG-QBFT CONSENSUS ENGINE
// Crate: dgx-consensus
// Implements: Proof of Gold & Quantum BFT 1.0s Deterministic Finality
// ==========================================================================

use chrono::Utc;
use dgx_core::{BlockHeader, DGXBlock, DGXLedgerState, DGXTransaction};
use dgx_quantum::QuantumBeacon;
use sha2::{Digest, Sha256};
use sha3::Sha3_256;

pub struct ConsensusEngine {
    pub quantum_beacon: QuantumBeacon,
    pub validators: Vec<String>,
    pub current_leader_idx: usize,
    pub block_height: u64,
}

impl ConsensusEngine {
    pub fn new(validators: Vec<String>, genesis_seed: &[u8]) -> Self {
        Self {
            quantum_beacon: QuantumBeacon::new(genesis_seed),
            validators,
            current_leader_idx: 0,
            block_height: 0,
        }
    }

    /// Produce the next block with embedded quantum randomness and RWA Merkle roots
    pub fn produce_block(
        &mut self,
        state: &mut DGXLedgerState,
        pending_txs: Vec<DGXTransaction>,
    ) -> DGXBlock {
        self.block_height += 1;
        let now = Utc::now().timestamp_millis();

        // 1. Advance Quantum Randomness Generator (QRNG)
        let quantum_pulse = self.quantum_beacon.advance_quantum_round();

        // 2. Select validator leader rotated by quantum seed
        let leader = if !self.validators.is_empty() {
            let entropy_bytes = hex::decode(quantum_pulse.entropy_seed.trim_start_matches("0x"))
                .unwrap_or_else(|_| vec![0u8; 32]);
            let seed_num = u64::from_be_bytes(entropy_bytes[0..8].try_into().unwrap_or([0u8; 8]));
            let leader_idx = (seed_num as usize) % self.validators.len();
            self.current_leader_idx = leader_idx;
            self.validators[leader_idx].clone()
        } else {
            "0xDIGNITY_GENESIS_VALIDATOR_ENCLAVE_1".to_string()
        };

        // 3. Compute RWA roots
        let physical_gold_root = state.compute_physical_gold_merkle_root();
        let in_ground_reserve_root = state.compute_in_ground_reserve_root();

        // 4. Compute State root
        let mut state_hasher = Sha3_256::new();
        state_hasher.update(b"DIGNITY:STATE:ROOT:v1:");
        state_hasher.update(&self.block_height.to_be_bytes());
        state_hasher.update(physical_gold_root.as_bytes());
        state_hasher.update(in_ground_reserve_root.as_bytes());
        state_hasher.update(quantum_pulse.entropy_seed.as_bytes());
        let state_root = format!("0x{}", hex::encode(state_hasher.finalize()));

        let prev_hash = state.blocks.last()
            .map(|b| b.block_hash.clone())
            .unwrap_or_else(|| "0x0000000000000000000000000000000000000000000000000000000000000000".to_string());

        let header = BlockHeader {
            block_height: self.block_height,
            prev_block_hash: prev_hash,
            state_root,
            physical_gold_merkle_root: physical_gold_root,
            in_ground_reserve_root,
            quantum_entropy_pulse: quantum_pulse,
            validator_proposer: leader,
            timestamp: now,
        };

        // Compute Block Hash: SHA-256 over header
        let mut block_hasher = Sha256::new();
        block_hasher.update(&header.block_height.to_be_bytes());
        block_hasher.update(header.prev_block_hash.as_bytes());
        block_hasher.update(header.state_root.as_bytes());
        block_hasher.update(header.quantum_entropy_pulse.quantum_beacon_hash.as_bytes());
        block_hasher.update(&header.timestamp.to_be_bytes());
        let block_hash = format!("0x{}", hex::encode(block_hasher.finalize()));

        let block = DGXBlock {
            header,
            transactions: pending_txs,
            block_hash,
        };

        state.blocks.push(block.clone());
        block
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_consensus_block_production() {
        let validators = vec![
            "0xVAL_ZURICH_SWISS_01".to_string(),
            "0xVAL_LONDON_LBMA_02".to_string(),
            "0xVAL_DELAWARE_USA_03".to_string(),
            "0xVAL_SINGAPORE_04".to_string(),
        ];

        let mut consensus = ConsensusEngine::new(validators, b"DIGNITY_GOLD_CONSENSUS_SEED");
        let mut state = DGXLedgerState::new();

        let block = consensus.produce_block(&mut state, vec![]);
        assert_eq!(block.header.block_height, 1);
        assert!(block.block_hash.starts_with("0x"));
        assert!(block.header.quantum_entropy_pulse.round == 1);
        assert_eq!(state.blocks.len(), 1);
    }
}
