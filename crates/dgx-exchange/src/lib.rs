// ==========================================================================
// DIGNITY GOLD SOVEREIGN L1 — SOVEREIGN EXCHANGE & DvP MATCHING ENGINE
// Crate: dgx-exchange
// Implements: Price-Time Priority Order Book for DIGau, Physical XAU, & In-Ground
// ==========================================================================

use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderSide {
    Buy,
    Sell,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradingPair {
    DigAuUsd,        // DGX Gold Security Token / USD Par
    XauPhysUsd,      // LBMA 400 oz Allocated Physical Gold / USD
    XauInGroundUsd,  // Forward Production In-Ground Gold Notes / USD
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LimitOrder {
    pub order_id: String,
    pub trader_account: String,
    pub pair: TradingPair,
    pub side: OrderSide,
    pub price_usd: f64,
    pub quantity: f64,
    pub filled_quantity: f64,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeExecution {
    pub trade_id: String,
    pub maker_order_id: String,
    pub taker_order_id: String,
    pub pair: TradingPair,
    pub price_usd: f64,
    pub quantity: f64,
    pub volume_usd: f64,
    pub timestamp: i64,
    pub settlement_type: String, // "ATOMIC_DVP_PAR_USD"
}

pub struct OrderBook {
    pub pair: TradingPair,
    pub bids: Vec<LimitOrder>, // Sorted descending by price, then timestamp
    pub asks: Vec<LimitOrder>, // Sorted ascending by price, then timestamp
    pub trades: Vec<TradeExecution>,
}

impl OrderBook {
    pub fn new(pair: TradingPair) -> Self {
        Self {
            pair,
            bids: Vec::new(),
            asks: Vec::new(),
            trades: Vec::new(),
        }
    }

    /// Place a limit order and match against existing liquidity
    pub fn place_order(&mut self, mut order: LimitOrder) -> Vec<TradeExecution> {
        let mut executions = Vec::new();
        let now = Utc::now().timestamp_millis();

        match order.side {
            OrderSide::Buy => {
                // Match against asks
                let mut ask_idx = 0;
                while ask_idx < self.asks.len() && order.quantity > order.filled_quantity {
                    let ask = &mut self.asks[ask_idx];
                    if order.price_usd >= ask.price_usd {
                        let match_qty = (order.quantity - order.filled_quantity)
                            .min(ask.quantity - ask.filled_quantity);

                        order.filled_quantity += match_qty;
                        ask.filled_quantity += match_qty;

                        executions.push(TradeExecution {
                            trade_id: format!("TRD-{}-{}", now, executions.len() + 1),
                            maker_order_id: ask.order_id.clone(),
                            taker_order_id: order.order_id.clone(),
                            pair: self.pair.clone(),
                            price_usd: ask.price_usd,
                            quantity: match_qty,
                            volume_usd: match_qty * ask.price_usd,
                            timestamp: now,
                            settlement_type: "ATOMIC_DVP_PAR_USD".to_string(),
                        });

                        if ask.filled_quantity >= ask.quantity {
                            self.asks.remove(ask_idx);
                            continue;
                        }
                    } else {
                        break;
                    }
                    ask_idx += 1;
                }

                // If unfilled balance remains, add to bids
                if order.quantity > order.filled_quantity {
                    self.bids.push(order);
                    self.bids.sort_by(|a, b| {
                        b.price_usd
                            .partial_cmp(&a.price_usd)
                            .unwrap_or(std::cmp::Ordering::Equal)
                            .then_with(|| a.timestamp.cmp(&b.timestamp))
                    });
                }
            }
            OrderSide::Sell => {
                // Match against bids
                let mut bid_idx = 0;
                while bid_idx < self.bids.len() && order.quantity > order.filled_quantity {
                    let bid = &mut self.bids[bid_idx];
                    if order.price_usd <= bid.price_usd {
                        let match_qty = (order.quantity - order.filled_quantity)
                            .min(bid.quantity - bid.filled_quantity);

                        order.filled_quantity += match_qty;
                        bid.filled_quantity += match_qty;

                        executions.push(TradeExecution {
                            trade_id: format!("TRD-{}-{}", now, executions.len() + 1),
                            maker_order_id: bid.order_id.clone(),
                            taker_order_id: order.order_id.clone(),
                            pair: self.pair.clone(),
                            price_usd: bid.price_usd,
                            quantity: match_qty,
                            volume_usd: match_qty * bid.price_usd,
                            timestamp: now,
                            settlement_type: "ATOMIC_DVP_PAR_USD".to_string(),
                        });

                        if bid.filled_quantity >= bid.quantity {
                            self.bids.remove(bid_idx);
                            continue;
                        }
                    } else {
                        break;
                    }
                    bid_idx += 1;
                }

                // If unfilled balance remains, add to asks
                if order.quantity > order.filled_quantity {
                    self.asks.push(order);
                    self.asks.sort_by(|a, b| {
                        a.price_usd
                            .partial_cmp(&b.price_usd)
                            .unwrap_or(std::cmp::Ordering::Equal)
                            .then_with(|| a.timestamp.cmp(&b.timestamp))
                    });
                }
            }
        }

        self.trades.extend(executions.clone());
        executions
    }

    /// Retrieve best bid and best ask spread
    pub fn get_spread(&self) -> (Option<f64>, Option<f64>) {
        let best_bid = self.bids.first().map(|o| o.price_usd);
        let best_ask = self.asks.first().map(|o| o.price_usd);
        (best_bid, best_ask)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_orderbook_matching() {
        let mut book = OrderBook::new(TradingPair::DigAuUsd);
        
        let sell_order = LimitOrder {
            order_id: "ORD-SELL-001".to_string(),
            trader_account: "0xSELLER".to_string(),
            pair: TradingPair::DigAuUsd,
            side: OrderSide::Sell,
            price_usd: 2650.00,
            quantity: 10.0,
            filled_quantity: 0.0,
            timestamp: 1000,
        };
        book.place_order(sell_order);

        let buy_order = LimitOrder {
            order_id: "ORD-BUY-001".to_string(),
            trader_account: "0xBUYER".to_string(),
            pair: TradingPair::DigAuUsd,
            side: OrderSide::Buy,
            price_usd: 2650.00,
            quantity: 5.0,
            filled_quantity: 0.0,
            timestamp: 1005,
        };
        let trades = book.place_order(buy_order);

        assert_eq!(trades.len(), 1);
        assert_eq!(trades[0].quantity, 5.0);
        assert_eq!(trades[0].volume_usd, 13250.00);
        assert_eq!(book.asks[0].filled_quantity, 5.0);
    }
}
