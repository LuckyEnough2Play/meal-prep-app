import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import { fetchPublix, fetchTraderJoes, fetchWalmart } from "./scrapers.ts";

export interface Deal {
  item: string;
  store: string;
  price: number;
  unit: string;
  sale: boolean;
  coupon: string | null;
  expires: string;
}

serve(async (req) => {
  try {
    const { zip, vendors } = await req.json() as { zip: string; vendors: string[] };
    let allDeals: Deal[] = [];

    for (const v of vendors) {
      switch (v.toLowerCase()) {
        case "walmart":
          allDeals = allDeals.concat(await fetchWalmart(zip));
          break;
        case "publix":
          allDeals = allDeals.concat(await fetchPublix(zip));
          break;
        case "trader_joes":
        case "trader joe's":
          allDeals = allDeals.concat(await fetchTraderJoes(zip));
          break;
        default:
          // unsupported vendor
          break;
      }
    }

    return new Response(JSON.stringify({ deals: allDeals }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
