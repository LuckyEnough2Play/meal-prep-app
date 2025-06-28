import type { NextApiRequest, NextApiResponse } from 'next';
import { getScraper } from '../../services/scraperFactory';
import { supabase } from '../../services/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const vendorParam = (req.query.vendor as string)?.toLowerCase();
  if (!vendorParam) {
    return res.status(400).json({ error: 'Query parameter "vendor" is required.' });
  }

  try {
    const scraper = getScraper(vendorParam);
    const deals = await scraper.getDeals();

    // Upsert deals into Supabase
    const { error } = await supabase
      .from('deals')
      .upsert(deals.map(d => ({ ...d, vendor: vendorParam })), {
        onConflict: 'id,vendor'
      });

    if (error) {
      throw error;
    }

    return res.status(200).json({ vendor: vendorParam, count: deals.length });
  } catch (err) {
    console.error('Scrape error:', vendorParam, err);
    const message = err instanceof Error ? err.message : String(err);
    // Log error to Supabase
    await supabase.from('scrapeLogs').insert({
      vendor: vendorParam,
      error: message,
      timestamp: new Date()
    });
    return res.status(500).json({ error: message || 'Scrape failed' });
  }
}

