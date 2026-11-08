// デプロイ前チェック: `opennextjs-cloudflare build` の後、deploy の前に実行する。
// - 本番必須のキーが Cloudflare の secret / wrangler.jsonc の vars に登録されているか
// - .env.local などから同梱された localhost の値が、上書きされずに本番へ入らないか
// 値は表示せず、キー名だけを出力する。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { evaluateBundledEnv, parseSecretListOutput, parseWranglerVarNames } from "./lib/deploy-checks.mjs";

const root = process.cwd();
const nextEnvPath = path.join(root, ".open-next/cloudflare/next-env.mjs");

if (!fs.existsSync(nextEnvPath)) {
  console.error(`✘ ${nextEnvPath} がありません。先に opennextjs-cloudflare build を実行してください。`);
  process.exit(1);
}

const { production: bundled = {} } = await import(pathToFileURL(nextEnvPath).href);
const secretNames = parseSecretListOutput(
  execFileSync("npx", ["wrangler", "secret", "list"], { cwd: root, encoding: "utf8" }),
);
const varNames = parseWranglerVarNames(fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8"));

const { missingRequired, localhostOnlyInBundle, bundleOnly } = evaluateBundledEnv({
  bundled,
  configuredKeys: [...secretNames, ...varNames],
});

if (bundleOnly.length > 0) {
  console.warn(`⚠ secret / vars に無く、ローカルの .env から同梱された値で動くキー: ${bundleOnly.join(", ")}`);
}

let failed = false;
if (missingRequired.length > 0) {
  failed = true;
  console.error(`✘ 本番必須なのに secret / vars に未登録: ${missingRequired.join(", ")}`);
  console.error("  npx wrangler secret put <KEY> で登録してください(手元のターミナルで実行)。");
}
if (localhostOnlyInBundle.length > 0) {
  failed = true;
  console.error(`✘ localhost を指す値が上書きされずに本番へ入ります: ${localhostOnlyInBundle.join(", ")}`);
  console.error("  本番用の値を secret / vars に登録してください。");
}

if (failed) {
  console.error("デプロイを中止しました。");
  process.exit(1);
}
console.log("✔ 同梱 env チェック OK");
