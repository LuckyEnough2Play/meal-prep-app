import puppeteer, { Browser, Page } from 'puppeteer';
import { VendorScraper, Deal, Product } from '../vendorScraperInterface';
import config from '../config.json';

export class TraderJoesScraper implements VendorScraper {
  vendorName = 'traderjoes';
  private url = config.traderjoes.dealsUrl;
  private selector = config.traderjoes.dealSelector;

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
      await page.waitForSelector(this.selector);
      // For any required loading delays:
      if (config.traderjoes.scroll) {
        let prevHeight = await page.evaluate('document.body.scrollHeight');
        while (true) {
          await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const newHeight = await page.evaluate('document.body.scrollHeight');
          if (newHeight === prevHeight) break;
          prevHeight = newHeight;
        }
      }
      return page.evaluate((sel: string) => {
        return Array.from(document.querySelectorAll(sel)).map(el => {
          const element = el as HTMLElement;
          const linkEl = element.querySelector('a') as HTMLAnchorElement;
          const link = linkEl?.href || '';
          const title = element.querySelector('.deal-card__title')?.textContent?.trim() || '';
          const priceText = element.querySelector('.deal-card__new-price')?.textContent || '';
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
