#!/usr/bin/env python3
import sys
import json

def fetch_walmart_deals(zip_code: str) -> list[dict]:
    # TODO: Replace stub with real requests + BeautifulSoup or Playwright logic
    return [
        {
            "item": "Chicken Breast",
            "store": "Walmart",
            "price": 2.99,
            "unit": "lb",
            "sale": True,
            "coupon": None,
            "expires": "2025-06-30"
        }
    ]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "ZIP code argument missing"}))
        sys.exit(1)
    zip_code = sys.argv[1]
    deals = fetch_walmart_deals(zip_code)
    print(json.dumps(deals))
