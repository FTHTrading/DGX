// ==========================================================================
// DIGNITY GOLD // X402 PAYMENT & STREAMING SETTLEMENT RAILS
// Protocol: X402 (4020/3100 High-Speed Settlement Standard)
// ==========================================================================

window.DignityX402Rails = (function() {
  let isStreaming = false;
  let streamInterval = null;
  let streamedTotalUsd = 482910.45;
  let streamCount = 1420;

  function init() {
    renderStats();
    bindEvents();
  }

  function renderStats() {
    const totalEl = document.getElementById('x402TotalSettled');
    const countEl = document.getElementById('x402TxCount');
    if (totalEl) totalEl.innerText = `$${streamedTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    if (countEl) countEl.innerText = streamCount.toLocaleString();
  }

  function bindEvents() {
    const toggleBtn = document.getElementById('toggleX402StreamBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (isStreaming) {
          stopStream();
          toggleBtn.innerText = "▶ Start X402 Live Settlement Stream";
          toggleBtn.classList.remove('active');
        } else {
          startStream();
          toggleBtn.innerText = "⏹ Pause X402 Live Stream";
          toggleBtn.classList.add('active');
        }
      });
    }
  }

  function startStream() {
    isStreaming = true;
    const feed = document.getElementById('x402LiveFeed');
    streamInterval = setInterval(() => {
      const amount = (50 + Math.random() * 450).toFixed(2);
      streamedTotalUsd += parseFloat(amount);
      streamCount++;
      renderStats();

      if (feed) {
        const row = document.createElement('div');
        row.className = 'x402-stream-row';
        row.innerHTML = `
          <span class="x402-time">${new Date().toLocaleTimeString()}</span>
          <span class="x402-proto mono">X402:4020/3100</span>
          <span class="x402-amt gold">+$${amount} USD</span>
          <span class="x402-dest mono">0xVAL_${Math.floor(1000 + Math.random()*9000)} ➔ 0xDEP_${Math.floor(1000 + Math.random()*9000)}</span>
          <span class="x402-status">PAR CLEARED</span>
        `;
        feed.insertBefore(row, feed.firstChild);
        if (feed.children.length > 20) feed.removeChild(feed.lastChild);
      }
    }, 800);
  }

  function stopStream() {
    isStreaming = false;
    if (streamInterval) clearInterval(streamInterval);
  }

  return {
    init
  };
})();
