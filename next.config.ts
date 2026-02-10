import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/landing_page", // リクエストのパスパターン
        destination: "/", // ルーティング先のパス
      },
      {
        source: "/privacy_policy", // リクエストのパスパターン
        destination: "/privacy_policy.html", // ルーティング先のパス
      },
      {
        source: "/child_safety_policy", // リクエストのパスパターン
        destination: "/child_safety_policy.html", // ルーティング先のパス
      },
      {
        source: "/delete_account", // リクエストのパスパターン
        destination: "/delete_account.html", // ルーティング先のパス
      },
    ];
  },
};

export default nextConfig;
