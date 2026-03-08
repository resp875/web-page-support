# Androidクローズドテスト手動運用 Runbook

最終更新日: 2026-03-08

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
- レポートは `docs/weekly-monitoring-report-template.md` を複製して記録する

2. KPI判定
- 完了率: 95%以上
- 失敗率: 10%以下
- P90滞留時間: 48時間以内
- 48時間超の未処理滞留: 0件

3. 異常時アクション
- 閾値超過があれば、対象requestを監査ログで追跡し、当日中に `done/failed` まで更新する
- `docs/monitoring-incident-template.md` を使って原因と再発防止策を記録する
- 重要判断は `docs/decision-log.md` へ追記する
