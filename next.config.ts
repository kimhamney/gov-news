/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "news.gov.bc.ca", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "source.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "live.staticflickr.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};
module.exports = nextConfig;
