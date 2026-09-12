// ==========================================================================
// UNYKORN NEXUS — ISO 20022 FINANCIAL MESSAGING & API INTEGRATION GATEWAY
// Maps DLT Events to Universal Financial Industry Standards (ISO 20022 & LEI)
// ==========================================================================

window.UnyKornNexus = (function() {
  const messages = [
    {
      msgType: "pacs.008.001.09",
      title: "FI-to-FI Customer Credit Transfer",
      purpose: "Settlement Cash Leg Execution (DUSD.SETTLE via Fedwire / Real-Time Payments)",
      senderLei: "5493006MHB84DD0Z1924 (Dignity Markets Group)",
      receiverLei: "549300USTBANK99881122 (UST Bank / USVI Settlement Bank)",
      xmlSnippet: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.09">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>DIGNITY-SETTLE-2026-90412</MsgId>
      <CreDtTm>2026-09-12T16:40:00Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
        <ClrSys><Prtry>FEDWIRE</Prtry></ClrSys>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId><EndToEndId>DVP-PAR-GOLD-99182</EndToEndId></PmtId>
      <IntrBkSttlmAmt Ccy="USD">265050.00</IntrBkSttlmAmt>
      <Dbtr><Nm>Dignity Markets Settlement Desk</Nm></Dbtr>
      <Cdtr><Nm>Zurich Freezone Gold Trustee</Nm></Cdtr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`
    },
    {
      msgType: "sese.023.001.09",
      title: "Securities Settlement Transaction Instruction",
      purpose: "Atomic Delivery-versus-Payment (DvP) instruction for allocated gold bullion",
      senderLei: "5493003BVC81MM2Q7719 (DigExchange Markets)",
      receiverLei: "5493008KLP92CC1Y8810 (Dignity Asset Trust)",
      xmlSnippet: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:sese.023.001.09">
  <SctiesSttlmTxInstr>
    <TxId>DVP-TX-2026-00891</TxId>
    <SttlmTpAndAddtlParams>
      <SctiesMvmntTp>DELI</SctiesMvmntTp>
      <Pmt>APMT</Pmt> <!-- Against Payment (DvP) -->
    </SttlmTpAndAddtlParams>
    <FinInstrmId>
      <OthrId>
        <Id>DIGAU-PHYS-A</Id>
        <Tp><Prtry>UNYKORN-PASSPORT-ID</Prtry></Tp>
      </OthrId>
    </FinInstrmId>
    <QtyAndAcctDetails>
      <SttlmQty><Unit>100.0</Unit></SttlmQty>
    </QtyAndAcctDetails>
    <SttlmAmt Ccy="USD">265050.00</SttlmAmt>
  </SctiesSttlmTxInstr>
</Document>`
    },
    {
      msgType: "camt.053.001.09",
      title: "Bank-to-Customer Statement (Proof-of-Reserve)",
      purpose: "Daily automated custodial cash & bullion ledger reconciliation",
      senderLei: "549300ZURICH99441100 (Zurich Vault Enclave)",
      receiverLei: "5493008KLP92CC1Y8810 (Dignity Asset Trust)",
      xmlSnippet: `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.09">
  <BkToCstmrStmt>
    <Stmt>
      <Id>STMT-2026-09-12-RESERVE</Id>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="XAU">1600.415</Amt> <!-- Fine Troy Ounces Verified -->
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2026-09-12</Dt></Dt>
      </Bal>
    </Stmt>
  </BkToCstmrStmt>
</Document>`
    }
  ];

  function renderNexusUI() {
    const listEl = document.getElementById('nexusMessagesList');
    const previewEl = document.getElementById('nexusXmlPreview');
    const msgTitleEl = document.getElementById('nexusSelectedMsgTitle');

    if (listEl) {
      listEl.innerHTML = messages.map((m, idx) => `
        <div class="glass-card nexus-msg-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="padding: 1rem; margin-bottom: 0.6rem; cursor: pointer; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
            <span class="badge-emerald" style="font-size: 0.68rem;">${m.msgType}</span>
            <span style="font-size: 0.7rem; color: var(--gold-core); font-weight: 700;">ISO 20022</span>
          </div>
          <h4 style="font-size: 0.92rem; font-weight: 800; color: var(--text-pure); margin-bottom: 0.2rem;">${m.title}</h4>
          <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${m.purpose}</p>
        </div>
      `).join('');

      listEl.querySelectorAll('.nexus-msg-item').forEach(card => {
        card.addEventListener('click', () => {
          listEl.querySelectorAll('.nexus-msg-item').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          const idx = parseInt(card.getAttribute('data-idx'), 10);
          showPreview(messages[idx]);
        });
      });

      if (messages.length > 0) {
        showPreview(messages[0]);
      }
    }

    function showPreview(msg) {
      if (msgTitleEl) msgTitleEl.innerText = `${msg.msgType} — ${msg.title}`;
      if (previewEl) previewEl.innerText = msg.xmlSnippet;
    }
  }

  return {
    init: renderNexusUI,
    messages
  };
})();
