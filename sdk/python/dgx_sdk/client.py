import requests
from enum import Enum
from typing import Dict, Any, Optional

class OrderSide(Enum):
    BUY = "BUY"
    SELL = "SELL"

class DGXClient:
    def __init__(self, rpc_url: str = "https://rpc.dgx.unykorn.org", api_key: Optional[str] = None):
        self.rpc_url = rpc_url
        self.api_key = api_key

    def _call(self, method: str, params: Dict[str, Any]) -> Any:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        resp = requests.post(self.rpc_url, json=payload, headers=headers, timeout=10)
        data = resp.json()
        if "error" in data:
            raise RuntimeError(f"DGX RPC Error: {data['error']}")
        return data.get("result")

    def get_bar_passport(self, bar_serial: str) -> Dict[str, Any]:
        return self._call("dgx_getBarPassport", {"barSerial": bar_serial})

    def submit_dvp_order(self, side: OrderSide, pair: str, quantity_oz: float, price_usd: float) -> Dict[str, Any]:
        params = {
            "side": side.value,
            "pair": pair,
            "quantityOz": quantity_oz,
            "limitPriceUsd": price_usd
        }
        return self._call("dgx_submitDvpOrder", params)

    def query_qrng_beacon(self, round_id: int) -> Dict[str, Any]:
        return self._call("dgx_queryQrngBeacon", {"round": round_id})
