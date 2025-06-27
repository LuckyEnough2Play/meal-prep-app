import puppeteer, { Browser, Page } from 'puppeteer';
import { VendorScraper, Deal, Product } from '../vendorScraperInterface';
import config from '../config.json';

export class PublixScraper implements VendorScraper {
  vendorName = 'publix';
  private url = config.publix.dealsUrl;
  private selector = config.publix.dealSelector;

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
      return page.evaluate((sel: string) => {
        return Array.from(document.querySelectorAll(sel)).map(el => {
          const element = el as HTMLElement;
          const id = element.getAttribute('data-id') || '';
          const title = element.querySelector('.title')?.textContent?.trim() || '';
          const oldPriceText = element.querySelector('.old-price')?.textContent || '';
          const newPriceText = element.querySelector('.new-price')?.textContent || '';
          const priceBefore = parseFloat(oldPriceText.replace('$', '')) || 0;
          const priceAfter = parseFloat(newPriceText.replace('$', '')) || 0;
          const link = (element.querySelector('a') as HTMLAnchorElement)?.href || '';
          return { id, title, priceBefore, priceAfter, link } as Deal;
        });
      }, this.selector);
    });
  }

  async getProducts(): Promise<Product[]> {
    // Implement product scraping if needed; stub returns empty list for now
    return [];
  }
}
