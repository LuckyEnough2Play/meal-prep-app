import config from './config.json';

/**
 * Returns the vendor keys defined in config.json.
 */
export function getVendorKeys(): string[] {
  return Object.keys(config);
}
