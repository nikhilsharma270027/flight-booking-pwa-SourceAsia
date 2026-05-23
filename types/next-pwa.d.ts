declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  type PWAOptions = Record<string, any>;
  type WithPWA = (options?: PWAOptions) => (nextConfig: NextConfig) => NextConfig;
  const withPWA: WithPWA;
  export default withPWA;
}
