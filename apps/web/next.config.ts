import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/guidesIndex",
        destination: "/guides",
        permanent: true,
      },
      {
        source: "/caloriesIndex",
        destination: "/calories",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
