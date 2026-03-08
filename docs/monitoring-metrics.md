# Android申請フロー 監査ログ活用指標

最終更新日: 2026-03-08

## 1. 目的

手動オペレーション待ちキュー（`queued -> awaiting_manual -> done/failed`）の運用品質を、
監査ログと申請ジョブのデータで週次に可視化する。

## 2. 週次確認指標（KPI）

1. 受付件数（週次）
- 定義: 対象週に `queued` として作成された件数
- 目的: 申請ボリュームの把握

2. 完了率（週次）
- 定義: `done / (done + failed)`
- 目標: 95%以上

3. 失敗率（週次）
- 定義: `failed / (done + failed)`
- 警戒閾値: 10%超

4. 滞留時間（P50/P90）
- 定義: `queued` から `done/failed` までの経過時間（分）
- 目標: P90が48時間以内

5. 未処理滞留件数
- 定義: 48時間を超えて `queued/awaiting_manual` のままの件数
- 警戒閾値: 1件以上

6. 遷移異常件数
- 定義: 許可外遷移の試行件数（`409 INVALID_TRANSITION`）
- 警戒閾値: 1件以上

## 3. 異常検知ルール

- `失敗率 > 10%` を検知したら、失敗理由を分類し、Runbookの異常時対応を更新する
- `未処理滞留件数 >= 1` を検知したら、担当割り当て漏れとして当日中に対応する
- `遷移異常件数 >= 1` を検知したら、管理UI操作手順と権限運用を見直す

## 4. 週次集計SQL（Neon/Postgres）

```sql
-- 1) 週次件数サマリー（done/failed/未完了）
select
  date_trunc('week', created_at) as week_start,
  count(*) as total_requests,
  count(*) filter (where status = 'done') as done_count,
  count(*) filter (where status = 'failed') as failed_count,
  count(*) filter (where status in ('queued', 'awaiting_manual')) as open_count
from android_test_request_jobs
where created_at >= now() - interval '8 weeks'
group by 1
order by 1 desc;
```

```sql
-- 2) 週次完了率/失敗率
with weekly as (
  select
    date_trunc('week', created_at) as week_start,
    count(*) filter (where status = 'done') as done_count,
    count(*) filter (where status = 'failed') as failed_count
  from android_test_request_jobs
  where created_at >= now() - interval '8 weeks'
  group by 1
)
select
  week_start,
  done_count,
  failed_count,
  case when (done_count + failed_count) = 0 then 0
       else round(done_count::numeric / (done_count + failed_count) * 100, 2)
  end as success_rate_percent,
  case when (done_count + failed_count) = 0 then 0
       else round(failed_count::numeric / (done_count + failed_count) * 100, 2)
  end as failure_rate_percent
from weekly
order by week_start desc;
```

```sql
-- 3) 滞留時間（分）P50/P90
select
  percentile_cont(0.5) within group (order by extract(epoch from (updated_at - created_at)) / 60.0) as p50_minutes,
  percentile_cont(0.9) within group (order by extract(epoch from (updated_at - created_at)) / 60.0) as p90_minutes
from android_test_request_jobs
where status in ('done', 'failed')
  and created_at >= now() - interval '8 weeks';
```

```sql
-- 4) 48時間以上の未処理滞留
select
  request_id,
  status,
  requester_email,
  created_at,
  updated_at,
  round(extract(epoch from (now() - created_at)) / 3600.0, 1) as age_hours
from android_test_request_jobs
where status in ('queued', 'awaiting_manual')
  and created_at < now() - interval '48 hours'
order by created_at asc;
```

```sql
-- 5) 遷移異常の兆候（同一リクエストで短時間に多数遷移）
select
  request_id,
  count(*) as transition_count,
  min(created_at) as first_transition_at,
  max(created_at) as last_transition_at
from android_test_request_audit_logs
where created_at >= now() - interval '7 days'
group by request_id
having count(*) >= 4
order by transition_count desc, last_transition_at desc;
```

## 5. 運用メモ

- 週次レビュー時に、上記SQL結果を `docs/operation-runbook.md` の手順に沿って確認する
- 警戒閾値を超えた場合は、原因・対策・再発防止を意思決定ログへ記録する