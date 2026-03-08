[Next.js](https://nextjs.org)プロジェクトです。[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)で作成されました。

## プロジェクトドキュメント

- 方針・意思決定ログ: `docs/decision-log.md`
- 仕様書: `docs/specification.md`
- 運用Runbook: `docs/operation-runbook.md`
- 監査ログ活用指標: `docs/monitoring-metrics.md`
- E2Eチェックリスト: `docs/e2e-checklist.md`

## 無料寄せ構成（推奨初期構成）

- Hosting: Vercel Hobby
- DB: Neon Free
- KV: Upstash Redis Free（任意、初期は未導入でも可）

### Neon Free セットアップ

1. Neonでプロジェクトを作成し、接続文字列を取得
2. `docs/sql/android_test_request_jobs.sql` を実行してテーブルを作成
   - 既存テーブルがある場合は `docs/sql/migrations/20260303_add_requester_email.sql` と `docs/sql/migrations/20260306_status_to_awaiting_manual.sql` と `docs/sql/migrations/20260308_add_request_audit_logs.sql` を実行
3. `.env.local` に `DATABASE_URL` を追加

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
```

4. `npm run dev` を再起動

### 動作モード

- `DATABASE_URL` がある場合: Android申請ジョブはNeonに永続化
- `DATABASE_URL` がない場合: メモリ保存で動作（開発用フォールバック）

### 手動オペレーション待ちキューフロー

- ステータス遷移: `queued -> awaiting_manual -> done/failed`
- `queued`: 申請受付直後
- `awaiting_manual`: 運用担当が手動対応中
- `done`: 手動対応完了
- `failed`: 手動対応失敗

`queued` から先の状態更新は管理者APIで実施します。

推奨設定:

```env
CRON_SECRET=your_random_long_secret
ANDROID_ENROLLMENT_PROVIDER=manual
ANDROID_TEST_JOIN_URL=https://play.google.com/apps/testing/com.example.resp
JOB_ADMIN_KEY=your_admin_key
# 任意: 強制的に失敗させる場合
# ANDROID_MOCK_FORCE_FAIL=true
# 任意: requestIdの末尾が一致する場合に失敗させる（カンマ区切り）
# ANDROID_MOCK_FAIL_SUFFIXES=a,b,c
```

`ANDROID_ENROLLMENT_PROVIDER` は次の値を取ります。

- `manual`（デフォルト）: 外部APIを呼ばずに完了処理（Play Consoleでの手動テスター追加運用向け）
- `mock`: `manual` と同等（後方互換）
- `google-play`: Google Play Developer APIでトラックの `googleGroups` 更新（将来オプション）

管理者ステータス更新API:

- エンドポイント: `POST /api/closed-test/android-request/:requestId/transition`
- 認可: `x-job-admin-key: <JOB_ADMIN_KEY>`
- 監査ログ: 遷移ごとに `android_test_request_audit_logs` へ保存

管理者UI（推奨）:

- 画面: `GET /admin/android-requests`
- 機能: 一覧確認、`queued -> awaiting_manual -> done/failed` 更新、監査ログ表示
- 初回アクセス時に `JOB_ADMIN_KEY` を入力して利用

実行手順（`queued -> awaiting_manual`）:

1. ユーザーの申請受付レスポンス、またはDBから `requestId` を取得
2. `x-job-admin-key` ヘッダーに `JOB_ADMIN_KEY` を設定して transition API を実行
3. レスポンスの `status` が `awaiting_manual` になっていることを確認

`requestId` をDBから取得する例:

```sql
select request_id, status, requester_email, created_at
from android_test_request_jobs
where status = 'queued'
order by created_at desc
limit 5;
```

`queued -> awaiting_manual`:

```bash
curl -X POST \
   -H "Content-Type: application/json" \
   -H "x-job-admin-key: $JOB_ADMIN_KEY" \
   -d '{"toStatus":"awaiting_manual"}' \
   "http://localhost:3000/api/closed-test/android-request/<requestId>/transition"
```

成功時レスポンス例:

```json
{
   "requestId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
   "status": "awaiting_manual",
   "updatedAt": "2026-03-06T12:34:56.000Z"
}
```

`awaiting_manual -> done`:

```bash
curl -X POST \
   -H "Content-Type: application/json" \
   -H "x-job-admin-key: $JOB_ADMIN_KEY" \
   -d '{"toStatus":"done"}' \
   "http://localhost:3000/api/closed-test/android-request/<requestId>/transition"
```

`awaiting_manual -> failed`:

```bash
curl -X POST \
   -H "Content-Type: application/json" \
   -H "x-job-admin-key: $JOB_ADMIN_KEY" \
   -d '{"toStatus":"failed","errorCode":"MANUAL_OPERATION_FAILED","errorMessage":"manual operation failed"}' \
   "http://localhost:3000/api/closed-test/android-request/<requestId>/transition"
```

個人アカウント最小運用フロー:

1. 申請APIでジョブ受付（`queued`）
2. Slack通知を受けた運用担当が Play Console で手動対応
3. 管理者APIで `awaiting_manual` / `done` / `failed` を更新

`queued` 受付時の担当者通知（任意）:

```env
# 設定時のみ、queued新規作成時にWebhookへ通知
ANDROID_REQUEST_NOTIFY_WEBHOOK_URL=https://example.com/hooks/android-request
# 任意: WebhookのBearer認証
# ANDROID_REQUEST_NOTIFY_BEARER_TOKEN=your_token
# 任意: 通知ペイロードに含める運用画面URL
# ANDROID_REQUEST_ADMIN_PAGE_URL=https://example.com/admin/android-requests
```

通知は新規受付時（`reused: false`）のみ送信されます。通知失敗時も申請受付は継続されます。

`google-play` プロバイダーを使う場合のみ必要な環境変数（任意）:

```env
GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PLAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PLAY_PACKAGE_NAME=com.example.resp
# 任意（未指定時は closed）
GOOGLE_PLAY_TRACK=closed
# 必須: クローズドテスト用 Google グループ
GOOGLE_PLAY_TESTERS_GROUP=your-group@googlegroups.com
```

Google Workspace がある場合のみ使う追加設定（任意）:

```env
# 設定すると申請時に Directory API でグループメンバー自動追加を試行
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@your-domain.com
```

注意:

- Android Publisher API (`edits.testers`) は `googleGroups` のみサポートします
- Play Console UI の「メーリングリスト」表示でも、API更新はグループ運用で扱います
- 個人アカウントのみの場合は `ANDROID_ENROLLMENT_PROVIDER=manual` を使用し、Play Consoleで手動追加してください
- `GOOGLE_WORKSPACE_ADMIN_EMAIL` を設定した場合は、申請時に Admin SDK で `GOOGLE_PLAY_TESTERS_GROUP` へ申請者メールを自動追加します（既存メンバーはスキップ）
- 自動追加を使うには Google Workspace 側でサービスアカウントのドメインワイド委任と、管理者ユーザーの権限付与が必要です

### Cronについて

- `android-request-processor` / `android-request-completer` は廃止済みです（`410 Gone` を返します）
- `vercel.json` の Cron 設定は空配列にしています

確認SQL例:

```sql
select request_id, status, requester_email, test_join_url, error_code, updated_at
from android_test_request_jobs
order by created_at desc
limit 5;
```

## はじめに

### ローカル開発

開発サーバーを起動します：

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて結果を確認してください。

### Cloudflare Workersでのプレビュー

Cloudflare Workers環境でアプリをローカルテストします：

```bash
npm run preview
```

ブラウザで [http://localhost:8787](http://localhost:8787) を開いて結果を確認してください。

`app/page.tsx`を編集してページを変更できます。ファイルを編集すると自動的にページが更新されます。

このプロジェクトは[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)を使用して、Vercel用の新しいフォントファミリー[Geist](https://vercel.com/font)を自動的に最適化して読み込みます。

## より詳しく学ぶ

Next.jsについて詳しく学ぶには、以下のリソースをご覧ください：

- [Next.js ドキュメント](https://nextjs.org/docs) - Next.jsの機能とAPIについて学習
- [Learn Next.js](https://nextjs.org/learn) - インタラクティブなNext.jsチュートリアル

[Next.js GitHubリポジトリ](https://github.com/vercel/next.js)もチェックしてください - フィードバックや貢献を歓迎します！

## Cloudflare Workersへのデプロイ

このアプリは[OpenNext Cloudflare](https://opennext.js.org/cloudflare)を使用してCloudflare Workersにデプロイされています。

### 前提条件

1. Cloudflareアカウント（無料プランあり）
2. R2バケットの有効化
3. Wrangler CLI（開発依存関係としてインストール済み）

### セットアップ

1. **Cloudflareにログイン**:
   ```bash
   npx wrangler login
   ```

2. **R2バケットを作成**（まだ存在しない場合）:
   ```bash
   npx wrangler r2 bucket create cache
   ```

3. **環境変数を設定**:
   ```bash
   npx wrangler secret put AUTH0_DOMAIN
   npx wrangler secret put AUTH0_CLIENT_ID
   npx wrangler secret put AUTH0_CLIENT_SECRET
   npx wrangler secret put AUTH0_SECRET
   npx wrangler secret put AUTH0_APP_BASE_URL
   ```

4. **本番環境にデプロイ**:
   ```bash
   npm run deploy
   ```

### デプロイの更新

コード変更後、最新版をデプロイします：

```bash
npm run deploy
```

変更は https://support.resp.work に反映されます。

### 設定ファイル

- **wrangler.jsonc**: Cloudflare Workers設定
- **open-next.config.ts**: OpenNext Cloudflare設定
- **.dev.vars**: ローカル環境変数（gitにコミットされません）

## Auth0連携

このアプリはAuth0を使用した認証機能を実装しており、Cloudflare Workersと互換性のあるカスタムOAuth2実装を使用しています。

### `npm run dev`（localhost:3000）でのローカル設定

`npm run dev` で認証を動かす場合は、プロジェクトルートに `.env.local` を作成して以下を設定してください。

```env
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_APP_BASE_URL=http://localhost:3000
AUTH0_SECRET=random_32_character_string
```

Auth0アプリケーション側の設定値:

- Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
- Allowed Logout URLs: `http://localhost:3000`
- Allowed Web Origins: `http://localhost:3000`

その後、開発サーバーを再起動してください。

```bash
npm run dev
```

### ローカル環境のセットアップ

1. https://manage.auth0.com/ でAuth0アプリケーションを作成
   - **Domain**、**Client ID**、**Client Secret**をメモ

2. プロジェクトルートに`.dev.vars`ファイルを作成：
   ```
   AUTH0_DOMAIN=your-tenant.us.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   AUTH0_SECRET=random_32_character_string
   AUTH0_APP_BASE_URL=http://localhost:8787
   ```

3. Auth0アプリケーションの設定を行う：
   - **Allowed Callback URLs**: `http://localhost:8787/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:8787`
   - **Allowed Web Origins**: `http://localhost:8787`

4. プレビューサーバーを起動：
   ```bash
   npm run preview
   ```

5. http://localhost:8787 にアクセスしてヘッダーの「Log in」をクリック

### 本番環境のセットアップ

https://support.resp.work での本番デプロイ用：

1. Auth0に本番URLを追加：
   - **Allowed Callback URLs**: `https://support.resp.work/api/auth/callback`
   - **Allowed Logout URLs**: `https://support.resp.work`
   - **Allowed Web Origins**: `https://support.resp.work`

2. 本番環境のシークレットを設定（上記のデプロイセクションを参照）

### 実装の詳細

- **認証フロー**: Next.js API Routesを使用したカスタムOAuth2実装
- **APIエンドポイント**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/callback`, `/api/auth/me`
- **セッション保存**: HTTPオンリークッキー
- **クライアントコンポーネント**: `src/components/AuthButton.tsx`
- **ランタイム**: Node.js（Cloudflare Workers互換）
