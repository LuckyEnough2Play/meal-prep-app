import { Deal } from "./index.ts";

/**
 * Stub implementations for vendor scrapers.
 * Replace with real HTTP fetch + parsing logic.
 */

export async function fetchWalmart(zip: string): Promise<Deal[]> {
  // TODO: Fetch Walmart deals for given ZIP
  return [];
}

export async function fetchPublix(zip: string): Promise<Deal[]> {
  // TODO: Fetch Publix deals for given ZIP
  return [];
}

export async function fetchTraderJoes(zip: string): Promise<Deal[]> {
  // TODO: Fetch Trader Joe's deals for given ZIP
  return [];
}
