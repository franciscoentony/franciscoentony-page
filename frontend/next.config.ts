import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  //basePath: '/franciscoentony-page', 
  //assetPrefix: '/franciscoentony-page',
  images: {
    unoptimized: true,    
  },
};

export default nextConfig;
