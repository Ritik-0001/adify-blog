/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    // amazon-paapi uses broken relative requires (e.g. 'model/BrowseNode' instead of
    // './model/BrowseNode') that webpack can't resolve. Exclude it from bundling so
    // Next.js loads it via native Node require() instead.
    serverComponentsExternalPackages: ['amazon-paapi'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.adify.store' }],
        destination: 'https://adify.store/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
