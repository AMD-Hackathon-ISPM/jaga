/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // PWA service-worker registration is intentionally NOT added here yet.
  // Design constraint (project-architecture.md §3.1): no service-worker cache
  // may ever contain patient inputs. Add a strictly scoped SW only when the
  // caching policy is reviewed against that rule.
};

export default nextConfig;
