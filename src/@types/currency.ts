// Shared currency types across the application
export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRates {
  [key: string]: number;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  base?: string;
}
