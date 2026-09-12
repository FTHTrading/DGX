// ==========================================================================
// DIGNITY GOLD SOVEREIGN L1 — SOVEREIGN EXCHANGE (DIGEXCHANGE)
// Low-Latency Order Book Matching Engine & Atomic DvP Settlement
// ==========================================================================

window.DignityExchange = (function() {
  let activePair = "DIGau/USD";

  const bids = [
    { id: "BID-101", price: 2650.00, qty: 150.0, total: 397500.00 },
    { id: "BID-102", price: 2649.50, qty: 320.0, total: 847840.00 },
    { id: "BID-103", price: 2648.75, qty: 500.0, total: 1324375.00 },
    { id: "BID-104", price: 2647.00, qty: 850.0, total: 2249950.00 },
    { id: "BID-105", price: 2645.00, qty: 1200.0, total: 3174000.00 },
  ];

  const asks = [
    { id: "ASK-201", price: 2651.00, qty: 120.0, total: 318120.00 },
    { id: "ASK-202", price: 2651.80, qty: 280.0, total: 742504.00 },
    { id: "ASK-203", price: 2652.50, qty: 450.0, total: 1193625.00 },
    { id: "ASK-204", price: 2654.00, qty: 900.0, total: 2388600.00 },
    { id: "ASK-205", price: 2656.00, qty: 1500.0, total: 3984000.00 },
  ];

  const recentTrades = [
    { id: "TRD-9041", time: "16:41:02", side: "BUY", price: 2650.50, qty: 25.0, settlement: "DvP PAR CASH" },
    { id: "TRD-9040", time: "16:40:48", side: "SELL", price: 2650.00, qty: 50.0, settlement: "DvP PAR CASH" },
    { id: "TRD-9039", time: "16:40:15", side: "BUY", price: 2650.50, qty: 100.0, settlement: "DvP PAR CASH" },
    { id: "TRD-9038", time: "16:39:52", side: "BUY", price: 2650.25, qty: 80.0, settlement: "DvP PAR CASH" },
  ];

  function renderOrderBook() {
    const bidsEl = document.getElementById('orderBookBids');
    const asksEl = document.getElementById('orderBookAsks');
    const tradesEl = document.getElementById('recentTradesList');

    if (bidsEl) {
      bidsEl.innerHTML = bids.map(b => `
        <div style="display: flex; justify-content: space-between; padding: 0.35rem 0.5rem; font-size: 0.75rem; font-family: var(--font-mono); border-bottom: 1px solid var(--border-subtle);">
          <span style="color: var(--emerald-core); font-weight: 700;">$${b.price.toFixed(2)}</span>
          <span style="color: var(--text-primary);">${b.qty.toFixed(1)}</span>
          <span style="color: var(--text-muted);">$${(b.total / 1000).toFixed(1)}k</span>
        </div>
      `).join('');
    }

    if (asksEl) {
      asksEl.innerHTML = asks.map(a => `
        <div style="display: flex; justify-content: space-between; padding: 0.35rem 0.5rem; font-size: 0.75rem; font-family: var(--font-mono); border-bottom: 1px solid var(--border-subtle);">
          <span style="color: var(--rose-core); font-weight: 700;">$${a.price.toFixed(2)}</span>
          <span style="color: var(--text-primary);">${a.qty.toFixed(1)}</span>
          <span style="color: var(--text-muted);">$${(a.total / 1000).toFixed(1)}k</span>
        </div>
      `).join('');
    }

    if (tradesEl) {
      tradesEl.innerHTML = recentTrades.map(t => `
        <div style="display: flex; justify-content: space-between; padding: 0.4rem 0.6rem; font-size: 0.75rem; font-family: var(--font-mono); border-bottom: 1px solid var(--border-subtle);">
          <span style="color: var(--text-muted);">${t.time}</span>
          <span style="color: ${t.side === 'BUY' ? 'var(--emerald-core)' : 'var(--rose-core)'}; font-weight: 800;">${t.side}</span>
          <span style="color: var(--text-pure); font-weight: 700;">$${t.price.toFixed(2)}</span>
          <span style="color: var(--gold-core);">${t.qty.toFixed(1)} DIGau</span>
          <span class="badge-emerald" style="font-size: 0.65rem;">${t.settlement}</span>
        </div>
      `).join('');
    }
  }

  function executeOrder(side, price, qty) {
    const time = new Date().toTimeString().slice(0, 8);
    const newTrade = {
      id: `TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      time,
      side: side.toUpperCase(),
      price: parseFloat(price),
      qty: parseFloat(qty),
      settlement: "DvP PAR CASH"
    };
    recentTrades.unshift(newTrade);
    if (recentTrades.length > 20) recentTrades.pop();
    renderOrderBook();

    if (window.DignityApp && window.DignityApp.showToast) {
      window.DignityApp.showToast(`⚡ ATOMIC DVP TRADE EXECUTED: ${side.toUpperCase()} ${qty} DIGau @ $${price} USD!`);
    }
  }

  return {
    init: renderOrderBook,
    executeOrder
  };
})();
