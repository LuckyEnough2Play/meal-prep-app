import type { NextConfig } from 'next';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from the project root .env file so that
// Next.js has access to SUPABASE credentials during build.
config({ path: join(__dirname, '../.env') });

const nextConfig: NextConfig = {
  reactStrictMode: true
};

export default nextConfig;
