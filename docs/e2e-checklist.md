# Android申請フロー E2Eチェックリスト

最終更新日: 2026-03-08

## 1. 目的

手動オペレーション待ちキュー方式（`queued -> awaiting_manual -> done/failed`）で、ユーザー体験と運用フローが一貫して動作することを確認します。

## 2. 事前準備

- `DATABASE_URL` が設定済み
- `JOB_ADMIN_KEY` が設定済み
- `ANDROID_REQUEST_NOTIFY_WEBHOOK_URL` が設定済み（Slack通知確認を行う場合）
- 開発サーバー起動済み（`npm run dev`）

## 3. シナリオA: 正常系（完了）

1. ログイン済みユーザーで Android申請を送信
2. レスポンスで `status=queued` と `requestId` を確認
3. Slack通知が1件送信されることを確認
4. 管理者UI `/admin/android-requests` で対象申請を `awaiting_manual` に更新
5. 同画面で `done` に更新
6. ユーザー画面で「ステータスを再取得」を押し、表示が「完了」になることを確認
7. 監査ログに `queued -> awaiting_manual -> done` が記録されることを確認

期待結果:
- ユーザー画面: 完了表示
- 管理者画面: `done`
- 監査ログ: 2件以上（遷移分）

## 4. シナリオB: 失敗系（手動対応失敗）

1. 新規申請を送信し `queued` を確認
2. 管理者UIで `awaiting_manual` に更新
3. 管理者UIで `failed` に更新
4. ユーザー画面で再取得し、表示が「失敗」になることを確認
5. ユーザー画面に再申請/問い合わせ案内が表示されることを確認
6. 監査ログに `awaiting_manual -> failed` が記録されることを確認

期待結果:
- ユーザー画面: 失敗表示と次アクション案内
- 管理者画面: `failed`
- 監査ログ: 失敗遷移ログを確認可能

## 5. シナリオC: 認可・遷移制御

1. `x-job-admin-key` なしで transition API を実行し `403` を確認
2. 不正キーで transition API を実行し `403` を確認
3. `queued` を飛ばして `done` 更新を試し `409` を確認

期待結果:
- 認可・状態遷移が仕様どおり拒否される

## 6. 参考コマンド

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-job-admin-key: $JOB_ADMIN_KEY" \
  -d '{"toStatus":"awaiting_manual"}' \
  "http://localhost:3000/api/closed-test/android-request/<requestId>/transition"
```

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-job-admin-key: $JOB_ADMIN_KEY" \
  -d '{"toStatus":"done"}' \
  "http://localhost:3000/api/closed-test/android-request/<requestId>/transition"
```

## 7. 合格条件

- シナリオA/B/Cがすべて期待結果を満たす
- 監査ログが全遷移で欠落なく記録される
- ユーザー画面表示とDB状態が一致する
