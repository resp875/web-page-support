[Next.js](https://nextjs.org)プロジェクトです。[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)で作成されました。

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
