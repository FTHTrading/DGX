// ==========================================================================
// DIGNITY GOLD SOVEREIGN L1 — NODE DAEMON & RPC SERVER
// Binary: dgx-node
// Implements: 1.0s PoG-QBFT Block Production, QRNG & JSON-RPC Gateway
// ==========================================================================

use dgx_consensus::ConsensusEngine;
use dgx_core::DGXLedgerState;
use dgx_exchange::{LimitOrder, OrderBook, OrderSide, TradingPair};
use serde_json::json;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

struct NodeState {
    ledger: DGXLedgerState,
    consensus: ConsensusEngine,
    orderbook_digau: OrderBook,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("╔════════════════════════════════════════════════════════════════════╗");
    println!("║       DIGNITY GOLD SOVEREIGN LAYER 1 NODE DAEMON (PoG-QBFT)        ║");
    println!("║      Global Gold Standard • Quantum Randomness • Shielded Privacy  ║");
    println!("╚════════════════════════════════════════════════════════════════════╝");

    let validators = vec![
        "0xVAL_ZURICH_FREEZONE_SWISS_01".to_string(),
        "0xVAL_LONDON_LBMA_ENCLAVE_02".to_string(),
        "0xVAL_DELAWARE_DEPOSITORY_USA_03".to_string(),
        "0xVAL_SINGAPORE_FREEPORT_04".to_string(),
    ];

    let mut initial_orderbook = OrderBook::new(TradingPair::DigAuUsd);
    // Seed initial institutional liquidity
    initial_orderbook.place_order(LimitOrder {
        order_id: "GENESIS-BID-01".to_string(),
        trader_account: "0xINSTITUTIONAL_LIQUIDITY_DESK".to_string(),
        pair: TradingPair::DigAuUsd,
        side: OrderSide::Buy,
        price_usd: 2649.50,
        quantity: 100.0,
        filled_quantity: 0.0,
        timestamp: 1000,
    });
    initial_orderbook.place_order(LimitOrder {
        order_id: "GENESIS-ASK-01".to_string(),
        trader_account: "0xSWISS_ALLOCATED_DESK".to_string(),
        pair: TradingPair::DigAuUsd,
        side: OrderSide::Sell,
        price_usd: 2650.50,
        quantity: 100.0,
        filled_quantity: 0.0,
        timestamp: 1005,
    });

    let node_state = Arc::new(Mutex::new(NodeState {
        ledger: DGXLedgerState::new(),
        consensus: ConsensusEngine::new(validators, b"DIGNITY_GOLD_MAINNET_ENTROPY_2026"),
        orderbook_digau: initial_orderbook,
    }));

    // Pre-produce genesis blocks
    {
        let mut state = node_state.lock().unwrap();
        let NodeState { ref mut consensus, ref mut ledger, .. } = *state;
        for _ in 0..5 {
            consensus.produce_block(ledger, vec![]);
        }
        println!("[GENESIS] 5 Initial PoG-QBFT Blocks sealed with Quantum Randomness.");
        println!("[GENESIS] Physical LBMA Bars: {} | In-Ground Concessions: {}", 
            ledger.physical_bars.len(), ledger.in_ground_reserves.len());
    }

    // Spawn 1.0s Consensus Block Producer Loop
    let producer_state = Arc::clone(&node_state);
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(1000));
        loop {
            interval.tick().await;
            let mut state = producer_state.lock().unwrap();
            let NodeState { ref mut consensus, ref mut ledger, .. } = *state;
            let block = consensus.produce_block(ledger, vec![]);
            if block.header.block_height % 10 == 0 {
                println!("[PoG-QBFT] Block #{} sealed | Proposer: {} | QRNG Seed: {}...",
                    block.header.block_height,
                    block.header.validator_proposer,
                    &block.header.quantum_entropy_pulse.entropy_seed[0..14]
                );
            }
        }
    });

    // Start Async RPC Server on 127.0.0.1:8989
    let rpc_addr = "127.0.0.1:8989";
    let listener = TcpListener::bind(rpc_addr).await?;
    println!("[RPC] Sovereign L1 RPC Server listening on http://{}", rpc_addr);
    println!("[RPC] Ready for Cloudflare Zero-Trust Edge Shield proxy connections.");

    let rpc_state = Arc::clone(&node_state);
    tokio::spawn(async move {
        while let Ok((mut socket, _)) = listener.accept().await {
            let state_clone = Arc::clone(&rpc_state);
            tokio::spawn(async move {
                let mut buf = [0u8; 4096];
                if let Ok(n) = socket.read(&mut buf).await {
                    if n > 0 {
                        let req_str = String::from_utf8_lossy(&buf[..n]);
                        
                        let response_json = {
                            let state = state_clone.lock().unwrap();
                            let latest_block = state.ledger.blocks.last();
                            let height = latest_block.map(|b| b.header.block_height).unwrap_or(0);
                            let hash = latest_block.map(|b| b.block_hash.clone()).unwrap_or_default();
                            let qrng = latest_block.map(|b| b.header.quantum_entropy_pulse.clone());

                            if req_str.contains("dgx_getPhysicalBars") {
                                let bars: Vec<_> = state.ledger.physical_bars.values().cloned().collect();
                                json!({ "status": "success", "data": bars })
                            } else if req_str.contains("dgx_getInGroundReserves") {
                                let reserves: Vec<_> = state.ledger.in_ground_reserves.values().cloned().collect();
                                json!({ "status": "success", "data": reserves })
                            } else if req_str.contains("dgx_getOrderBook") {
                                let (bid, ask) = state.orderbook_digau.get_spread();
                                json!({
                                    "status": "success",
                                    "pair": "DIGau/USD",
                                    "best_bid": bid,
                                    "best_ask": ask,
                                    "bids": state.orderbook_digau.bids,
                                    "asks": state.orderbook_digau.asks,
                                    "trades": state.orderbook_digau.trades
                                })
                            } else {
                                json!({
                                    "status": "online",
                                    "chain": "DGX Gold Sovereign L1",
                                    "consensus": "Proof of Gold & Quantum BFT (PoG-QBFT)",
                                    "block_height": height,
                                    "latest_block_hash": hash,
                                    "qrng_pulse": qrng,
                                    "physical_bars_count": state.ledger.physical_bars.len(),
                                    "in_ground_reserves_count": state.ledger.in_ground_reserves.len(),
                                })
                            }
                        };

                        let body = response_json.to_string();
                        let http_res = format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nContent-Length: {}\r\n\r\n{}",
                            body.len(),
                            body
                        );
                        let _ = socket.write_all(http_res.as_bytes()).await;
                    }
                }
            });
        }
    });

    // Keep main thread alive
    tokio::signal::ctrl_c().await?;
    println!("\n[SHUTDOWN] DGX Gold L1 node gracefully terminated.");
    Ok(())
}
