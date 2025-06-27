import type { NextApiRequest, NextApiResponse } from 'next';
import { getScraper } from '../../services/scraperFactory';
import { supabase } from '../../services/supabaseClient';

const VENDORS = ['publix', 'walmart', 'traderjoes'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const results: Array<any> = [];

  for (const vendor of VENDORS) {
    try {
      const scraper = getScraper(vendor);
      const deals = await scraper.getDeals();
      const { error } = await supabase
        .from('deals')
        .upsert(deals.map(d => ({ ...d, vendor })), {
          onConflict: 'id,vendor'
        });
      if (error) throw error;
      results.push({ vendor, count: deals.length, status: 'ok' });
    } catch (err: any) {
      console.error('Schedule scrape error:', vendor, err);
      await supabase.from('scrapeLogs').insert({
        vendor,
        error: err.message || String(err),
        timestamp: new Date()
      });
      results.push({ vendor, status: 'error', message: err.message || String(err) });
    }
  }

  res.status(200).json(results);
}
