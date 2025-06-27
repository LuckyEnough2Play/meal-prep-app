import fs from 'fs';
import path from 'path';
import { PublixScraper } from '../publixScraper';

describe('PublixScraper.getDeals', () => {
  it('parses deals from HTML fixture correctly', async () => {
    const html = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'publixDeals.html'),
      'utf-8'
    );
    const scraper = new PublixScraper();
    // Override withPage to use fixture HTML instead of launching Puppeteer
    // @ts-ignore
    scraper['withPage'] = async (fn: any) => {
      const fakePage = {
        goto: async () => {},
        waitForSelector: async () => {},
        evaluate: (evaluateFn: Function, sel: string) => evaluateFn(sel === undefined ? html : html)
      };
      return fn(fakePage);
    };

    const deals = await scraper.getDeals();
    expect(deals).toHaveLength(1);
    expect(deals[0]).toMatchObject({
      id: '1',
      title: 'Test Deal',
      priceBefore: 10,
      priceAfter: 8,
      link: 'https://example.com/deal/1'
    });
  });
});
