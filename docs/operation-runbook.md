# Androidクローズドテスト手動運用 Runbook

最終更新日: 2026-11-08

## 1. 目的

Androidクローズドテスト申請を、手動オペレーション待ちキュー方式（`queued -> awaiting_manual -> done/failed`）で安定運用するための手順を定義します。

## 2. 前提

- 管理者キー `JOB_ADMIN_KEY` が設定されている
- Slack通知が有効（任意）
- 管理者UI `/admin/android-requests` にアクセスできる

## 3. 標準手順

1. 申請受付を確認
- Slack通知、または管理者UIの `queued` を確認

2. 対応中へ更新
- 管理者UIで対象申請を `awaiting_manual` へ更新

3. Play Consoleで手動追加
- クローズドテストの対象に申請者を追加

4. 完了/失敗へ更新
- 成功時: `done`
- 失敗時: `failed`

5. 監査ログ確認
- 管理者UIの監査ログで遷移履歴が残っていることを確認

### 3.1 iOS外部テスト(TestFlight)申請の場合

手順1・2・4・5はAndroidと同じ。管理者UIの「全プラットフォーム」を「iOS」に絞ると探しやすい。手順3の代わりに次を行う。

3. App Store Connect でメール招待
- 管理者UIで対象行の「コピー」ボタンを押し、申請者のメールアドレスをコピーする
- App Store Connect → マイApp → Resp → TestFlight → 外部テストの対象グループ → テスター「+」→「新規テスター」
- コピーしたメールアドレスを入力して追加する（招待メールが自動で送られる）
- グループに外部テスト用の承認済みビルドが割り当てられていることを確認する

補足:
- 招待はApple IDのメールアドレスと一致していなくても受け取れる
- 申請者から「メールが届かない」と連絡があった場合は、迷惑メールフォルダを確認してもらう。App Store Connect のテスター一覧から招待の再送もできる

## 4. 異常時

### 401/403 Unauthorized
- `JOB_ADMIN_KEY` の設定値と送信値を確認

### 409 INVALID_TRANSITION
- 遷移順序が不正
- 必ず `queued -> awaiting_manual -> done/failed`

### 500
- サーバーログを確認
- DB接続エラーやSQL migration未適用を確認

## 5. 参考SQL

```sql
select request_id, status, requester_email, updated_at
from android_test_request_jobs
order by updated_at desc
limit 20;
```

```sql
select request_id, from_status, to_status, actor_type, actor_id, created_at
from android_test_request_audit_logs
order by created_at desc
limit 50;
```

## 6. 週次モニタリング運用

1. 集計の実行
- `docs/monitoring-metrics.md` のSQLを上から順に実行する
- レポートは `docs/weekly-monitoring-reports/weekly-monitoring-report-template.md` を複製して記録する
- ローカル集計補助として `node scripts/generate-weekly-metrics.mjs` でも直近2週間のKPIを取得できる

2. KPI判定
- 完了率: 95%以上
- 失敗率: 10%以下
- P90滞留時間: 48時間以内
- 48時間超の未処理滞留: 0件

3. 異常時アクション
- 閾値超過があれば、対象requestを監査ログで追跡し、当日中に `done/failed` まで更新する
- `docs/monitoring-incident-template.md` を使って原因と再発防止策を記録する
- 重要判断は `docs/decision-log.md` へ追記する

## 7. 本番デプロイと環境変数

本番は Cloudflare Workers の Worker `hello-next-js`(support.resp.work)で稼働している。

### 7.1 環境変数の置き場所(重要)

- 本番の値は、必ず **Cloudflare の secret**(`npx wrangler secret put`)か、**`wrangler.jsonc` の `vars`** に置く。
- `npm run deploy` の時点で、OpenNext は手元の `.env` / `.env.local` などを Worker に同梱する(`.open-next/cloudflare/next-env.mjs`)。同梱された値は、secret / vars に無いキーだけを埋める。そのため secret が未登録だと、`.env.local` の開発用の値(`http://localhost:3000` など)がそのまま本番で使われる。
- 本番必須のキー(`scripts/lib/deploy-checks.mjs` の `REQUIRED_PRODUCTION_KEYS`):
  - `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` / `AUTH0_SECRET` / `AUTH0_APP_BASE_URL`
  - `DATABASE_URL` / `JOB_ADMIN_KEY`
- `AUTH0_APP_BASE_URL` の本番値は `https://support.resp.work`(末尾スラッシュなし)。
- 任意の secret: `ANDROID_REQUEST_NOTIFY_WEBHOOK_URL`(Slack 通知)、`ANDROID_REQUEST_NOTIFY_BEARER_TOKEN`。
- 秘密でない値は `wrangler.jsonc` の `vars` に書く(例: `ANDROID_REQUEST_ADMIN_PAGE_URL`)。
- 本番で使っていない秘密の値(`GOOGLE_PLAY_*`、`CRON_SECRET` など)は `.env.local` に置かない。置くと、使っていなくても Worker のコードに同梱される。

### 7.2 secret の設定手順

- `npx wrangler secret put <KEY>` は対話入力で値を受け取る。**Claude Code の `!` から実行すると入力を受け取れず、空の値が登録される**。それでも「Success!」と表示されるので注意する。
  - 秘密の値: 手元のターミナルで実行する。
  - 秘密でない値: `printf '%s' '<値>' | npx wrangler secret put <KEY>` のようにパイプで渡してもよい。
- 登録済みの secret の名前は `npx wrangler secret list` で確認できる。値は表示されない。
- secret の更新は再デプロイなしで即時に反映される。更新後は必ず次を実行する。
  ```bash
  npm run verify:prod-auth
  ```

### 7.3 デプロイ時の自動チェック

`npm run deploy` は次の順で実行される。チェックに失敗すると、その時点で中断する。

1. `opennextjs-cloudflare build`
2. `scripts/check-bundled-env.mjs`(デプロイ前)
   - 本番必須のキーが secret / vars に未登録なら中止する。
   - `.env` から同梱された localhost の値が、上書きされずに本番へ入る場合も中止する。
   - 秘密情報らしい名前(`*_KEY` / `*_SECRET` / `*_TOKEN` / `DATABASE_URL` / `*_WEBHOOK_URL` など)の値が、secret で上書きされずに同梱される場合も中止する。
   - secret / vars に無く `.env` の値で動くキーは、警告として表示する。
   - 出力はキー名のみで、値は表示しない。
3. `opennextjs-cloudflare deploy`
4. `scripts/verify-prod-auth.mjs`(デプロイ後)
   - 本番の `/api/auth/login` が Auth0 に渡す `redirect_uri` が `https://support.resp.work/api/auth/callback` かを確認する。
   - secret の値自体の誤り(2026-11-08 の障害)は、この方法でしか検出できない。
   - 確認先は環境変数 `PROD_BASE_URL` で変更できる。既定値は `https://support.resp.work`。

### 7.4 ログインできない時

1. `npm run verify:prod-auth` を実行し、`redirect_uri` を確認する。
2. 結果に応じて対処する。
   - `redirect_uri` が localhost になっている: `AUTH0_APP_BASE_URL` の secret を本番値で設定し直す。
   - `HTTP 500: Location ヘッダーがありません`: secret が空か未登録。`curl -s https://support.resp.work/api/auth/login` の `details` で、欠けているキーを確認する。
   - Auth0 で「Callback URL mismatch」が出る: Auth0 ダッシュボードの Allowed Callback URLs に `https://support.resp.work/api/auth/callback` があるか確認する。
