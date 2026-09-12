# DGX SOVEREIGN L1 // JSON-RPC v2.0 API SPECIFICATION
## Institutional Protocol Interface for Bullion Banks, Custodians & Exchanges

All institutional queries, trade orders, and cryptographic proof-of-reserves checks interact with the DGX node via standard **JSON-RPC 2.0** over HTTPS or WebSockets.

* **Mainnet RPC**: `https://rpc.dgx.unykorn.org`
* **Testnet RPC**: `https://testnet-rpc.dgx.unykorn.org`
* **WebSocket Stream**: `wss://ws.dgx.unykorn.org`

---

### Authentication & Transport
Requests must include standard headers:
```http
POST /rpc HTTP/1.1
Host: rpc.dgx.unykorn.org
Content-Type: application/json
X-DGX-Client-Version: 1.2.0
Authorization: Bearer <INSTITUTIONAL_API_KEY>
```

---

### Methods Index

| Method | Category | Description |
| :--- | :--- | :--- |
| `dgx_getBarPassport` | Custody & PoR | Retrieves the complete legal & physical passport for an allocated LBMA bar. |
| `dgx_submitDvpOrder` | DigExchange | Commits an atomic Delivery-versus-Payment order to the order book. |
| `dgx_queryQrngBeacon` | Cryptography | Queries the verifiable hardware Quantum Random Number Generation beacon. |
| `dgx_getConcessionPassport` | Mine Streaming | Inspects NI 43-101 reserve metrics, stream status, and assay receipts. |
| `dgx_getChainStatus` | Consensus | Returns current block height, PoG validator round, and active stake. |
| `dgx_retireCarbonOffset` | ESG Labs | Retires voluntary carbon credits against gold ounces for Net-Zero certification. |

---

### Detailed Method Specifications

#### 1. `dgx_getBarPassport`
Retrieves physical weight, assay fineness, refiner stamp, vault enclave bin reference, and Lloyd's insurance certificate for a serialized 400 oz gold bar.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "dgx_getBarPassport",
  "params": {
    "barSerial": "VAL-CH-994820"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "barSerialNumber": "VAL-CH-994820",
    "refiner": "Valcambi SA",
    "finenessBps": 9999,
    "grossWeightOz": 401.240,
    "fineWeightOz": 401.199,
    "vaultEnclave": "ZurichFreezoneSwitzerland",
    "depositoryBin": "ZH-VAULT-BAY-14-SHELF-02",
    "insurancePolicyId": "LLOYDS-SPECIE-2026-VAL-001",
    "allocatedOwner": "0x4E574939D460d284B5D990646D4aeaEF2D49Fa13",
    "isEncumbered": false,
    "auditedTimestamp": 1789201948,
    "dilithiumSignature": "0x89aef3...d49fa1"
  }
}
```

---

#### 2. `dgx_submitDvpOrder`
Submits an atomic Delivery-versus-Payment order. Matches instant physical gold ownership transfer against USD/USDC cash settlement.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "dgx_submitDvpOrder",
  "params": {
    "side": "BUY",
    "pair": "DIGAU.PHYS/USD",
    "quantityOz": 50.0,
    "limitPriceUsd": 2650.50,
    "settlementToken": "USDC",
    "vaultEnclave": "ZurichFreezoneSwitzerland",
    "dilithiumSignature": "0x78df...cba4"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "orderId": "DVP-20260912-9948",
    "status": "Committed",
    "blockHeight": 1849204,
    "clearingTimestamp": 1789201955,
    "totalConsiderationUsd": 132525.00,
    "escrowAddress": "0x8aced25DC8530FDaf0f86D53a0A1E02AAfA7Ac7A"
  }
}
```

---

#### 3. `dgx_queryQrngBeacon`
Queries the hardware optical quantum vacuum fluctuation beacon ensuring unpredictability in audit scheduling and validator elections.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "dgx_queryQrngBeacon",
  "params": {
    "round": 1849200
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "round": 1849200,
    "entropySeed": "0xe2b49c71a39f018349cbde9320af847291aebc38472910fa84e7293a10be8394",
    "source": "IDQ-Quantis-Hardware-Vacuum-Fluctuation",
    "timestamp": 1789201920,
    "signaturePQ": "0x98af38...38ae"
  }
}
```

---

#### 4. `dgx_getConcessionPassport`
Inspects in-ground mining concession reserve audits, forward streaming contracts, and historical refinery deliveries.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "dgx_getConcessionPassport",
  "params": {
    "concessionId": "NI43-101-EUREKA-NV"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "concessionId": "NI43-101-EUREKA-NV",
    "concessionName": "Eureka Sovereign Mine #1",
    "jurisdiction": "Nevada, USA",
    "standard": "NI 43-101 / SEC S-K 1300",
    "provenProbableOz": 750000.0,
    "upfrontCapexFundedUsd": 25000000.0,
    "fixedDeliveryPriceOz": 750.00,
    "totalCommittedOz": 125000.0,
    "totalDeliveredOz": 14250.0,
    "reserveCoverageRatio": 6.0,
    "operator": "Eureka Mining & Exploration Corp",
    "lienFiling": "UCC-1-NV-2026-994820",
    "status": "ActiveProduction"
  }
}
```
