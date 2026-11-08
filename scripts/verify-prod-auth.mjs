// 本番ログインの戻り先チェック: デプロイ後、または secret を更新した後に実行する。
// /api/auth/login が Auth0 に渡す redirect_uri が本番のコールバックかを確認する。
// secret の値はビルド時に読めないため、AUTH0_APP_BASE_URL の誤設定はこの方法でしか検出できない。
import { checkLoginRedirect } from "./lib/deploy-checks.mjs";

const baseUrl = process.env.PROD_BASE_URL ?? "https://support.resp.work";
const attempts = 3;
const retryDelayMs = 5000;

let result;
for (let i = 1; i <= attempts; i++) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/auth/login`, { redirect: "manual" });
  result = checkLoginRedirect(response.headers.get("location"), baseUrl);
  if (result.ok) {
    break;
  }
  result.reason = `HTTP ${response.status}: ${result.reason}`;
  if (i < attempts) {
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
}

if (!result.ok) {
  console.error(`✘ 本番ログインの戻り先が不正です。${result.reason}`);
  console.error("  AUTH0_APP_BASE_URL の secret を確認してください(docs/operation-runbook.md §7)。");
  process.exit(1);
}
console.log(`✔ 本番ログインの戻り先 OK: ${result.redirectUri}`);
