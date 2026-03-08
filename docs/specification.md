# Resp Support 仕様書

最終更新日: 2026-03-08
バージョン: v1.10

このファイルは、決定・実装した仕様を記録するための仕様書です。  
今後、仕様の追加・修正があった場合は、必ずこのファイルを更新します。

## 1. 対象

- プロダクト: web-page-support
- 主目的: ログイン状態に応じた適切な情報提供と、テスト参加導線の提供

## 2. 画面仕様

### 2.1 ログイン前画面

目的:
- ユーザーがRespの概要を理解する
- Auth0経由でユーザー登録（ログイン）へ進む

最低要件:
- Respの概要説明
- ユーザー登録/ログイン導線（Auth0）

実装状況（2026-03-01時点）:
- 実装済み（トップページで表示）

### 2.2 ログイン後画面

目的:
- クローズドテスト参加に必要な導線を提供する
- 利用に必要な情報（操作マニュアル・開発イベント等）を集約する

初期機能:
- Androidクローズドテスト参加リクエスト
- iOS参加案内（表示のみ）
- アプリ操作マニュアル閲覧導線
- 開発イベント情報表示

実装状況（2026-03-01時点）:
- 実装済み（トップページで表示）
- Android申請は受付APIへのリクエスト送信まで実装済み
- マニュアル/イベントはプレースホルダー表示（準備中）

拡張想定:
- ログイン後機能は今後段階的に追加する

## 3. Androidクローズドテスト申請仕様（初期方針）

- フロントエンドは「申請受付」を実行する
- バックエンドは「受付・重複防止・状態管理・監査」を担当する
- テスター追加（Play Console操作）は運用担当が手動で実施する

注記:
- 詳細なAPI仕様（入力値、レスポンス、状態遷移、リトライ、失敗時挙動）は後続で定義・追記する

初期API実装（2026-03-01時点）:
- エンドポイント: `POST /api/closed-test/android-request`
- 認証条件: `auth_session` クッキーが存在すること
- 正常時: `202 Accepted` と `requestId`, `status: queued`, `message` を返却
- 異常時:
	- 未ログイン: `401`
	- サーバーエラー: `500`

ジョブ管理API実装（2026-03-02時点）:
- 申請受付: `POST /api/closed-test/android-request`
	- 新規受付時: `202`（`status: queued`）
	- 同一ユーザーに `queued/awaiting_manual` が存在する場合: `200`（既存ジョブ再利用、`reused: true`）
- ステータス参照: `GET /api/closed-test/android-request/:requestId`
	- 申請ユーザー本人のみ参照可能
- 状態遷移: `POST /api/closed-test/android-request/:requestId/transition`
	- 許可遷移: `queued -> awaiting_manual -> done/failed`
	- 不正遷移: `409`
	- `x-job-admin-key`（`JOB_ADMIN_KEY`一致）の管理者のみ更新可能
- 管理者一覧: `GET /api/admin/android-requests`
	- `x-job-admin-key`（`JOB_ADMIN_KEY`一致）の管理者のみ参照可能
- 監査ログ参照: `GET /api/admin/android-requests/:requestId/audit`
	- `x-job-admin-key`（`JOB_ADMIN_KEY`一致）の管理者のみ参照可能
- Cronエンドポイント: 廃止（`410 Gone`）

実装補足（2026-03-02時点）:
- Android enrollment処理は抽象化レイヤー経由で呼び出し
- `mock` プロバイダーは実装済み

Google Playプロバイダー実装（2026-03-03時点）:
- `google-play` プロバイダーでAndroid Publisher APIを呼び出し
- 処理フロー: OAuth2 JWT認証 -> edit作成 -> testers更新 -> edit commit
- 必須環境変数:
	- `GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL`
	- `GOOGLE_PLAY_PRIVATE_KEY`
	- `GOOGLE_PLAY_PACKAGE_NAME`
- 任意環境変数:
	- `GOOGLE_PLAY_TRACK`（デフォルト: `closed`）
 - 必須環境変数:
	- `GOOGLE_PLAY_TESTERS_GROUP`

API制約:
- Android Publisher API `edits.testers` は `googleGroups` のみ更新可能
- `googlePlayEmails` の更新はサポート対象外

Googleグループメンバー自動追加（2026-03-04時点）:
- `GOOGLE_WORKSPACE_ADMIN_EMAIL` が設定されている場合、申請者メール（`requester_email`）を Admin SDK Directory API で `GOOGLE_PLAY_TESTERS_GROUP` に追加する
- 既存メンバー追加時（HTTP 409）は成功扱いで継続する
- 自動追加には Google Workspace のドメインワイド委任と、指定管理者ユーザーへの適切な権限付与が必要
- `GOOGLE_WORKSPACE_ADMIN_EMAIL` 未設定時は、グループ紐付けのみ実行し、メンバー追加は運用手動とする

個人アカウント前提の最小運用（2026-03-06時点）:
- 基本運用は `ANDROID_ENROLLMENT_PROVIDER=manual` を使用する
- テスター追加は Play Console のメーリングリスト画面で手動対応する
- `queued` 新規受付時は Slack Incoming Webhookへ通知し、運用担当へ連携する

データ要件:
- 申請者メールアドレス（`requester_email`）をジョブに保存して利用
- 既存環境は `docs/sql/migrations/20260303_add_requester_email.sql` の適用が必要
- 状態遷移監査ログ（`android_test_request_audit_logs`）を保存
- 既存環境は `docs/sql/migrations/20260308_add_request_audit_logs.sql` の適用が必要

補足:
- `DATABASE_URL` 設定時はNeon(Postgres)へ永続化
- `DATABASE_URL` 未設定時はアプリ内メモリ実装にフォールバック（開発・検証用）

無料寄せ構成（2026-03-02時点）:
- Hosting: Vercel Hobby
- DB: Neon Free
- KV: Upstash Redis Free（任意、初期は未導入可）

## 4. iOSクローズドテスト仕様（初期方針）

- 初期段階は案内情報の表示のみ
- 申請機能は後続フェーズで追加

## 5. インフラ・デプロイ方針

- デプロイ先はVercelに移行する
- 背景: 将来拡張時のNode.js機能制約リスクを下げるため

## 6. 仕様更新ルール

- 仕様を新規決定したら、本書へ対象セクションを追加する
- 仕様を変更したら、変更日・変更内容・理由を追記する
- 実装完了時は、実装済み範囲をこの仕様書へ反映する

## 7. 変更履歴

- 2026-03-01: 初版作成（ログイン前後の画面方針、Android非同期申請、iOS案内のみ、Vercel移行方針）
- 2026-03-01: v0.2 更新（ログイン前/後画面出し分け実装、Android申請受付API初期実装、実装状況を追記）
- 2026-03-01: v0.3 更新（`npm run dev` 向けAuth0ローカル設定を明確化、ローカルHTTPで認証クッキーが機能するように実装修正）
- 2026-03-02: v0.5 更新（Android申請ジョブ管理APIを実装: 申請受付の再利用、ステータス参照、状態遷移）
- 2026-03-02: v0.6 更新（Neon永続化を実装、`DATABASE_URL` 未設定時フォールバックを追加、無料寄せ構成を追記）
- 2026-03-02: v0.7 更新（Vercel Cronによる `queued -> processing` 自動遷移を追加）
- 2026-03-02: v0.8 更新（Vercel Cronによる `processing -> done/failed` 自動遷移を追加、モック失敗制御を追加）
- 2026-03-02: v0.9 更新（Android enrollment処理を抽象化、`ANDROID_ENROLLMENT_PROVIDER` で実装切替可能に変更）
- 2026-03-03: v1.0 更新（Google Playプロバイダー本実装、申請者メール保存、DBマイグレーションSQL追加）
- 2026-03-03: v1.1 更新（Google Play testers確認用デバッグAPIを追加）
- 2026-03-03: v1.2 更新（Google Play group運用対応、デバッグAPIでgoogleGroups表示とトラック不一致検知を追加）
- 2026-03-04: v1.3 更新（Google Play testers更新を `googleGroups` のみに統一、API制約を明記）
- 2026-03-04: v1.4 更新（Google Workspace Admin SDKによるGoogleグループメンバー自動追加を追加）
- 2026-03-04: v1.4 更新（Google Workspace group member確認用デバッグAPIを追加）
- 2026-03-04: v1.5 更新（個人アカウント前提の最小運用フローを既定として明記）
- 2026-03-04: v1.6 更新（Play Console手動追加運用を既定化、`manual` プロバイダーを既定値に変更）
- 2026-03-04: v1.7 更新（不要となった `google-play` / `google-workspace` デバッグAPIを削除）
- 2026-03-06: v1.8 更新（手動オペレーション待ちキュー: `queued -> awaiting_manual -> done/failed` に変更、Cron廃止）
- 2026-03-08: v1.9 更新（管理者ダッシュボードと監査ログ保存/参照APIを追加）
- 2026-03-08: v1.10 更新（ユーザー画面の状態表示を改善: 状態説明、最終更新表示、自動再取得を追加）

## 8. 次フェーズのタスク予定（作業中断時点）

### 8.1 Android申請ジョブ管理API（優先）

目的:
- `queued -> awaiting_manual -> done/failed` の状態遷移を管理できるようにする

予定タスク:
- データモデル定義（例: `requestId`, `userId`, `platform`, `status`, `errorCode`, `createdAt`, `updatedAt`）
- 受付APIの保存処理追加（`POST /api/closed-test/android-request`）
- ステータス参照API追加（例: `GET /api/closed-test/android-request/:requestId`）
- 管理者向け状態更新の運用UI整備
- 監査ログ項目の強化

### 8.2 Google Play Developer API連携

予定タスク:
- サービスアカウント鍵管理方式の決定（Vercel環境変数/Secret管理）
- メーリングリスト追加処理の実装
- 成功時の参加URL連携方式決定（画面表示/メール通知）
- API失敗時のエラー分類と運用アラート設計

### 8.3 ログイン後画面の拡張

予定タスク:
- Android申請の処理状態をUI表示（queued/awaiting_manual/done/failed）
- マニュアルコンテンツ実データ化
- 開発イベント情報の実データ化

### 8.4 運用・品質

予定タスク:
- 監査ログ項目の定義
- E2E確認シナリオ作成（ログイン〜申請〜状態確認）
- Vercel移行手順の実行計画を別ドキュメント化

- 2026-03-01: v0.4 更新（作業中断時点の次フェーズタスク予定を追加）
