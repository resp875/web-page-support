import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/manual/android-tutorial", // Android専用だった旧チュートリアル。OS共通の操作ガイドに統合した
        destination: "/manual/app-guide",
        permanent: true,
      },
    ];
  },
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
