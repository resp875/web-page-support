# Resp Support 開発方針・決定ログ

最終更新日: 2026-03-08

このファイルは、実装前に合意した方針・意思決定を記録するためのログです。  
今後、対応が進展したり方針に追加・修正が発生した場合は、必ずこのファイルを更新します。

## 運用ルール

- 新しい方針決定をしたら、**日付・決定内容・理由・影響範囲**を追記する
- 既存方針を変更した場合は、元の記述を消さずに「変更」として記録する
- 実装PR/コミット時は、関連する決定ログの更新有無を確認する

---

## 決定事項

### 2026-03-01

1. **デプロイ先をVercelへ移行する（確定）**
   - 理由: 今後の機能拡張時にNode.js互換性・SDK利用性・運用性を高めるため
   - 影響: Cloudflare Workers前提の記述や設定を段階的に見直す

2. **Androidクローズドテスト申請は非同期処理で実装する（確定）**
   - 方針: フロントは申請受付を実行し、バックエンドで非同期ジョブとして処理
   - 想定処理: `queued -> awaiting_manual -> done/failed` の手動オペレーション待ちキューとして運用する

3. **iOSは初期段階では案内表示のみ（確定）**
   - 方針: まずは参加方法の案内表示を提供し、申請機能は後続フェーズで追加

4. **ランディングページをログイン前/ログイン後で出し分ける（確定）**
   - ログイン前: Resp概要の理解とAuth0経由のユーザー登録導線
   - ログイン後: テスト参加申請、操作マニュアル閲覧、開発イベント情報表示など

---

## 実装ログ

### 2026-03-01

1. **トップページのログイン前/後出し分けを実装**
   - 内容: `/api/auth/me` で認証状態を判定し、未ログイン時は従来ランディング、ログイン時は会員向け画面を表示
   - 影響: ランディングページの役割を「未ログイン向け」と「ログイン済み向け」で明確化

2. **Androidクローズドテスト申請の受付APIを初期実装**
   - 内容: `POST /api/closed-test/android-request` を追加し、ログイン済みユーザーの申請を `queued` として受け付ける
   - 備考: Google Play Developer API連携と永続化は後続で実装

3. **ログイン後画面の初期情報ブロックを実装**
   - 内容: Android申請、iOS案内（表示のみ）、操作マニュアル（準備中）、開発イベント情報（準備中）を表示

4. **ローカル開発（localhost:3000）向けAuth0設定を明確化**
   - 内容: `README.md` に `.env.local` 設定値とAuth0ダッシュボード設定値を追記
   - 背景: `AUTH0_APP_BASE_URL` 未設定エラーの再発防止

5. **ローカルHTTP環境での認証クッキー設定を修正**
   - 内容: Auth0ルートでクッキーの `secure` 属性を環境依存に変更（本番は `true`、ローカルHTTPは `false`）
   - 影響: `npm run dev` 環境でもログインコールバック後のセッション確立が可能

6. **次フェーズ作業予定を整理して仕様書へ追記**
   - 内容: Android申請ジョブ管理API（`queued -> processing -> done/failed`）を最優先として、後続のGoogle Play連携・UI拡張・運用タスクを整理
   - 備考: 実作業は一時中断し、再開時は仕様書の「次フェーズのタスク予定」から着手する

### 2026-03-02

1. **Android申請ジョブ管理APIを実装（第1段）**
   - 内容: `POST /api/closed-test/android-request` をジョブ保存連携へ拡張し、重複申請時の再利用（idempotent動作）を追加

2. **ジョブステータス参照APIを追加**
   - 内容: `GET /api/closed-test/android-request/:requestId` を追加し、申請ユーザー本人のみ参照可能に設定

3. **状態遷移APIを追加**
   - 内容: `POST /api/closed-test/android-request/:requestId/transition` を追加し、`queued -> processing -> done/failed` の遷移制御を実装
   - 備考: `JOB_ADMIN_KEY` と `x-job-admin-key` による管理者更新をサポート

4. **セッション共通処理とジョブストアをライブラリ化**
   - 内容: `src/lib/auth-session.ts`, `src/lib/android-test-request-store.ts` を追加
   - 備考: ジョブ保存は現時点でメモリ実装（次段で永続化予定）

5. **無料寄せ構成での永続化方針を採用**
   - 内容: Vercel Hobby + Neon Free を基本構成として採用し、Upstash Redisは任意導入とした

6. **Android申請ジョブのNeon永続化を実装**
   - 内容: `DATABASE_URL` が設定されている場合、ジョブ作成/参照/遷移をNeon(Postgres)へ保存
   - 補足: `DATABASE_URL` 未設定時は既存メモリストアへフォールバック

7. **Cronによる `queued -> processing` 自動遷移を実装**
   - 内容: `GET /api/cron/android-request-processor` を追加し、`queued` ジョブを最大5件ずつ `processing` へ遷移
   - 運用: Vercel Cron（3分間隔）で起動し、`CRON_SECRET` による保護をサポート

8. **Cronによる `processing -> done/failed` 自動遷移を実装（モック）**
   - 内容: `GET /api/cron/android-request-completer` を追加し、`processing` ジョブを完了または失敗へ遷移
   - 補足: 現時点ではGoogle Play APIの代わりにモック結果を使用し、`ANDROID_TEST_JOIN_URL` を完了時に保存

9. **Android enrollment処理を抽象化レイヤーへ分離**
   - 内容: `src/lib/android-test-enrollment-service.ts` を追加し、Cron完了処理からモック実装を分離
   - 方針: `ANDROID_ENROLLMENT_PROVIDER` で `mock` / `google-play` を切替可能にし、Google Play本実装の差し替えを容易化

### 2026-03-03

1. **Google Playプロバイダー本実装を追加**
   - 内容: サービスアカウントJWTでアクセストークン取得し、Android Publisher APIの edit/testers/commit を実行

2. **申請者メール保存を追加**
   - 内容: 申請受付時にセッションからメールを取得し、ジョブへ `requester_email` として保存

3. **既存DB向けマイグレーションSQLを追加**
   - 内容: `docs/sql/migrations/20260303_add_requester_email.sql` を追加
   - 目的: 既存環境でもGoogle Play連携に必要なメール列を追加可能にする

4. **Google Play testers確認用の一時デバッグAPIを追加**
   - 内容: `GET /api/debug/google-play/testers` を追加し、track上の `googlePlayEmails` を直接取得可能にした
   - セキュリティ: `DEBUG_GOOGLE_PLAY_ENDPOINT=true` で有効化し、Bearer認可を必須化

5. **Google Playテスター更新をgroup運用に対応**
   - 内容: `GOOGLE_PLAY_TESTERS_MODE`（`email` / `group`）を追加し、group運用時は `GOOGLE_PLAY_TESTERS_GROUP` を更新対象として扱う

6. **デバッグAPIの切り分け精度を改善**
   - 内容: `googleGroups` も返却し、トラック不一致時は `GOOGLE_TRACK_NOT_FOUND` を返すように変更

### 2026-03-04

1. **Google Play testers更新を `googleGroups` に統一**
   - 背景: Android Publisher API `edits.testers` が `googlePlayEmails` を受け付けず、`googleGroups` のみ対応のため
   - 内容: `GOOGLE_PLAY_TESTERS_GROUP` を必須として更新処理を一本化

2. **Googleグループメンバー追加をAdmin SDKで自動化（条件付き）**
   - 背景: トラックにグループを紐付けるだけでは、申請者が実際にグループメンバーにならないため
   - 内容: `GOOGLE_WORKSPACE_ADMIN_EMAIL` 設定時に、Directory APIで申請者メールを `GOOGLE_PLAY_TESTERS_GROUP` へ追加
   - 補足: ドメインワイド委任や管理者権限が未整備の場合に備え、未設定時は従来どおり手動運用を許容

3. **個人アカウント前提では手動メンバー追加を既定運用にする**
   - 背景: Google Workspace管理者アカウントがない環境では Admin SDK 自動化が利用できないため
   - 内容: `GOOGLE_WORKSPACE_ADMIN_EMAIL` を未設定にし、Playトラックへのグループ紐付けのみ自動化対象とする

4. **Play Console手動追加運用へ一本化（現時点の標準）**
   - 背景: 個人アカウント運用ではPlay APIによるグループ紐付け自動化も不要になったため
   - 内容: `ANDROID_ENROLLMENT_PROVIDER=manual` を既定とし、テスター追加はPlay Consoleのメーリングリスト画面で手動実施する

5. **不要デバッグAPIを削除**
   - 背景: 運用をPlay Console手動追加へ一本化し、Google API切り分け用エンドポイントが不要になったため
   - 内容: `google-play` / `google-workspace` 配下のデバッグAPIを削除

6. **手動オペレーション待ちキューへ設計変更**
   - 背景: 外部API自動連携を前提にしない運用へ切り替えたため
   - 内容: 状態遷移を `queued -> awaiting_manual -> done/failed` に統一し、Cron processor/completer を廃止
   - 補足: `queued` 新規受付時はSlack Webhookで担当者通知を送る

7. **管理者ダッシュボードを追加**
   - 背景: `curl` ベース運用ではヒューマンエラーが起きやすいため
   - 内容: `/admin/android-requests` で申請一覧表示、状態更新、監査ログ確認を可能にした

8. **状態遷移の監査ログを保存**
   - 背景: 運用トレーサビリティ（誰がいつ更新したか）を担保するため
   - 内容: `android_test_request_audit_logs` を追加し、transition API実行時に記録

10. **E2Eチェックリストを作成**
   - 背景: 手動運用フローの検証手順を標準化し、回帰確認を容易にするため
   - 内容: `docs/e2e-checklist.md` に正常系・失敗系・認可/遷移制御の検証項目を定義

11. **監査ログ活用指標を定義**
   - 背景: 手動運用フローの品質を週次で定量管理するため
   - 内容: `docs/monitoring-metrics.md` を追加し、完了率/失敗率/滞留時間/未処理滞留/遷移異常の確認指標と閾値を定義

12. **ログイン後のマニュアル/イベントを実データ表示へ変更**
   - 背景: プレースホルダー表示のままだと、参加ユーザーが次アクションを取りにくいため
   - 内容: `src/lib/member-content.ts` にコンテンツデータを定義し、`/api/content/manuals` と `/api/content/events` を介してトップページへ表示

13. **週次モニタリング運用テンプレートを追加**
   - 背景: KPI確認と閾値超過時の対応記録を運用者間で標準化するため
   - 内容: `docs/weekly-monitoring-report-template.md` と `docs/monitoring-incident-template.md` を追加し、Runbookに連携

14. **iOS対応検討（8.3）は一旦スキップ**
   - 背景: 現時点はAndroid手動運用の品質安定化を優先するため
   - 内容: 次フェーズでは 8.1/8.2 の継続改善を先行し、iOS方針決定は後続へ延期

15. **週次モニタリング初回実測（2週間）を実施**
   - 背景: 指標定義だけでなく、実データで運用品質を確認するため
   - 内容: `docs/weekly-monitoring-report-2026-03-08.md` を作成し、完了率・失敗率・滞留時間・滞留件数を記録

9. **仕様書の次フェーズタスクを未完了項目へ整理**
   - 背景: 実装済み項目が「次フェーズ」に残り、運用上の優先順位が読み取りづらくなっていたため
   - 内容: `docs/specification.md` の次フェーズを現状の未完了タスクへ更新
