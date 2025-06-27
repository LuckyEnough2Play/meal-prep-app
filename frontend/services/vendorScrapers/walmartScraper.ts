import puppeteer, { Browser, Page } from 'puppeteer';
import { VendorScraper, Deal, Product } from '../vendorScraperInterface';
import config from '../config.json';

export class WalmartScraper implements VendorScraper {
  vendorName = 'walmart';
  private url = config.walmart.dealsUrl;
  private selector = config.walmart.dealSelector;

  private async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const browser: Browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    const page: Page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    const result = await fn(page);
    await page.close();
    await browser.close();
    return result;
  }

  async getDeals(): Promise<Deal[]> {
    return this.withPage(async page => {
      await page.goto(this.url, { waitUntil: 'networkidle2' });
      // If infinite scroll is needed:
      if (config.walmart.scroll) {
        let previousHeight = await page.evaluate('document.body.scrollHeight');
        while (true) {
          await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const newHeight = await page.evaluate('document.body.scrollHeight');
          if (newHeight === previousHeight) break;
          previousHeight = newHeight;
        }
      }
      await page.waitForSelector(this.selector);
      return page.evaluate((sel: string) => {
        return Array.from(document.querySelectorAll(sel)).map(el => {
          const element = el as HTMLElement;
          const linkEl = element.querySelector('a') as HTMLAnchorElement;
          const link = linkEl?.href || '';
          const title = element.querySelector('.search-result-product-title')?.textContent?.trim() || '';
          const priceText = element.querySelector('.price-main .visuallyhidden')?.textContent || '';
          const price = parseFloat(priceText.replace('$', '')) || 0;
          return { id: link, title, priceBefore: price, priceAfter: price, link } as Deal;
        });
      }, this.selector);
    });
  }

  async getProducts(): Promise<Product[]> {
    // Stub: implement if product listings differ
    return [];
  }
}
