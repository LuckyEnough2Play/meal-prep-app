import { VendorScraper } from './vendorScraperInterface';
import { PublixScraper } from './vendorScrapers/publixScraper';
import { WalmartScraper } from './vendorScrapers/walmartScraper';
import { TraderJoesScraper } from './vendorScrapers/traderJoesScraper';

const mapping: Record<string, new () => VendorScraper> = {
  publix: PublixScraper,
  walmart: WalmartScraper,
  traderjoes: TraderJoesScraper,
};

/**
 * Returns an instance of the scraper for the given vendor key.
 * @param vendorKey Lowercased key matching a property in config.json (e.g., 'publix').
 */
export function getScraper(vendorKey: string): VendorScraper {
  const ScraperClass = mapping[vendorKey];
  if (!ScraperClass) {
    throw new Error(`Unsupported vendor: ${vendorKey}`);
  }
  return new ScraperClass();
}
