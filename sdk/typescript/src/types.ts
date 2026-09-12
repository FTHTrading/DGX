export enum OrderSide {
  BUY = "BUY",
  SELL = "SELL"
}

export interface BarPassport {
  serial: string;
  refiner: string;
  fineness: number;
  grossWeightOz: number;
  fineWeightOz: number;
  vaultEnclave: string;
  depositoryBin: string;
  insurancePolicyId: string;
  isEncumbered: boolean;
  auditedTimestamp: number;
}

export interface DvpOrderParams {
  side: OrderSide;
  pair: string;
  quantityOz: number;
  limitPriceUsd: number;
  settlementCurrency: string;
}

export interface DvpReceipt {
  orderId: string;
  status: string;
  blockHeight: number;
  totalConsiderationUsd: number;
}
