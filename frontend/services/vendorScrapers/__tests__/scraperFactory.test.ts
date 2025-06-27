import config from '../../config.json';
import { getScraper } from '../../scraperFactory';

describe('scraperFactory', () => {
  it('returns a scraper instance for each configured vendor', () => {
    Object.keys(config).forEach(vendorKey => {
      const scraper = getScraper(vendorKey);
      expect(scraper.vendorName).toBe(vendorKey);
      expect(typeof scraper.getDeals).toBe('function');
      expect(typeof scraper.getProducts).toBe('function');
    });
  });

  it('throws on unsupported vendor', () => {
    expect(() => getScraper('unknown')).toThrow(/Unsupported vendor/);
  });
});
