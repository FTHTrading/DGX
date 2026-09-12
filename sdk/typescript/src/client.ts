import { BarPassport, DvpOrderParams, DvpReceipt } from "./types";

export interface DGXClientConfig {
  rpcUrl: string;
  apiKey?: string;
}

export class DGXClient {
  private rpcUrl: string;
  private apiKey?: string;

  constructor(config: DGXClientConfig) {
    this.rpcUrl = config.rpcUrl;
    this.apiKey = config.apiKey;
  }

  public async getBarPassport(barSerial: string): Promise<BarPassport> {
    const res = await this.rpcCall("dgx_getBarPassport", { barSerial });
    return res as BarPassport;
  }

  public async submitDvpOrder(params: DvpOrderParams): Promise<DvpReceipt> {
    const res = await this.rpcCall("dgx_submitDvpOrder", params);
    return res as DvpReceipt;
  }

  public async getQrngBeacon(round?: number): Promise<{ round: number; entropySeed: string }> {
    const res = await this.rpcCall("dgx_queryQrngBeacon", { round });
    return res;
  }

  private async rpcCall(method: string, params: any): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params
      })
    });
    const json = await response.json();
    if (json.error) {
      throw new Error(`DGX RPC Error: ${json.error.message}`);
    }
    return json.result;
  }
}
