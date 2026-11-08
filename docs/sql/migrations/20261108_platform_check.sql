-- iOS外部テスト(TestFlight)申請の追加に伴い、platform 列の値を制限し、
-- プラットフォーム別の再利用判定用インデックスを追加する。
-- 既存行はすべて platform = 'android'(列の既定値)のため、制約追加で失敗しない。

alter table android_test_request_jobs
  drop constraint if exists android_test_request_jobs_platform_check;

alter table android_test_request_jobs
  add constraint android_test_request_jobs_platform_check
  check (platform in ('android', 'ios'));

create index if not exists idx_android_jobs_user_platform_status
  on android_test_request_jobs (user_id, platform, status);
