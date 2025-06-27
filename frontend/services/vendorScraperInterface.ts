export interface Deal {
  id: string;
  title: string;
  description?: string;
  priceBefore: number;
  priceAfter: number;
  validUntil?: Date;
  link: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  unit?: string;
  link: string;
}

export interface VendorScraper {
  vendorName: string;
  getDeals(): Promise<Deal[]>;
  getProducts(): Promise<Product[]>;
}
