/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cover/banner images currently use a public placeholder service. They are
  // served unoptimized so they load directly in the browser without the image
  // optimizer needing outbound network. When you wire your own CDN, set
  // `unoptimized: false` and tighten `remotePatterns` to your host(s).
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      // ImageKit CDN — where uploaded covers/banners/pages are served from
      // when IMAGEKIT_PRIVATE_KEY is configured.
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // ESLint is intentionally not wired into the build pipeline for this UI template.
  // Add an ESLint config and remove this if you want lint-on-build.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
