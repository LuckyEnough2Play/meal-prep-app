import { getVendorKeys } from '../vendorUtils';
import config from '../config.json';

describe('getVendorKeys', () => {
  it('returns all vendors from config', () => {
    expect(getVendorKeys().sort()).toEqual(Object.keys(config).sort());
  });
});
