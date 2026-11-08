// デプロイ前後のチェックで使う判定ロジック(副作用なし)。
// 値そのものは結果に含めず、キー名だけを返す(秘密情報をログに出さないため)。

/** 本番で必ず Cloudflare の secret か wrangler.jsonc の vars に登録されているべきキー */
export const REQUIRED_PRODUCTION_KEYS = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
  "AUTH0_APP_BASE_URL",
  "DATABASE_URL",
  "JOB_ADMIN_KEY",
];

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "::1"]);

/** URL っぽい値のホストがローカルを指しているか */
export function isLocalhostValue(value) {
  if (typeof value !== "string" || value === "") {
    return false;
  }
  const match = value.match(/^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?(\[[^\]]+\]|[^:/?#]+)/i);
  if (!match) {
    return false;
  }
  return LOCAL_HOSTNAMES.has(match[1].toLowerCase());
}

/** JSONC から // と /* *\/ コメントを取り除く(文字列中の // は残す) */
export function stripJsonComments(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
    } else {
      out += ch;
    }
  }
  return out;
}

/** wrangler.jsonc の vars に定義されたキー名 */
export function parseWranglerVarNames(jsoncText) {
  const config = JSON.parse(stripJsonComments(jsoncText));
  return config.vars && typeof config.vars === "object" ? Object.keys(config.vars) : [];
}

/** `wrangler secret list` の出力から secret 名を取り出す */
export function parseSecretListOutput(stdout) {
  const start = stdout.indexOf("[");
  const end = stdout.lastIndexOf("]");
  if (start < 0 || end < start) {
    throw new Error("wrangler secret list の出力に JSON 配列が見つかりません");
  }
  const list = JSON.parse(stdout.slice(start, end + 1));
  return list.map((entry) => entry.name);
}

/**
 * ビルドに同梱された env(.env.local 等)と、Cloudflare 側に登録済みのキーを突き合わせる。
 * 実行時は secret / vars が優先され、同梱値は未登録のキーだけを埋める(OpenNext の populateProcessEnv)。
 */
export function evaluateBundledEnv({ bundled, configuredKeys, requiredKeys = REQUIRED_PRODUCTION_KEYS }) {
  const configured = new Set(configuredKeys);
  const bundleOnly = Object.keys(bundled).filter((key) => !configured.has(key));
  return {
    missingRequired: requiredKeys.filter((key) => !configured.has(key)),
    localhostOnlyInBundle: bundleOnly.filter((key) => isLocalhostValue(bundled[key])),
    bundleOnly,
  };
}

/** /api/auth/login の Location ヘッダーから redirect_uri を取り出し、本番のコールバックか確認する */
export function checkLoginRedirect(location, expectedOrigin) {
  if (!location) {
    return { ok: false, reason: "Location ヘッダーがありません(ログインURLがリダイレクトしていない)" };
  }
  let redirectUri;
  try {
    redirectUri = new URL(location).searchParams.get("redirect_uri");
  } catch {
    return { ok: false, reason: `Location が URL として解釈できません: ${location}` };
  }
  if (!redirectUri) {
    return { ok: false, reason: "Location に redirect_uri がありません" };
  }
  const expected = `${expectedOrigin.replace(/\/+$/, "")}/api/auth/callback`;
  if (redirectUri !== expected) {
    return { ok: false, redirectUri, reason: `redirect_uri が ${expected} ではありません` };
  }
  return { ok: true, redirectUri };
}
