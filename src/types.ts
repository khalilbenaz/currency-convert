export interface Currency {
  code: string;
  name: string;
}

export interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  rate: number;
  convertedAmount: number;
}

export interface HistoryPoint {
  date: string;
  rate: number;
}

export interface FavoritePair {
  from: string;
  to: string;
}
