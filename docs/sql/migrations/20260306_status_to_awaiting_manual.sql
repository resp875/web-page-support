-- Replace processing status with awaiting_manual for manual operation queue flow.
alter table android_test_request_jobs
drop constraint if exists android_test_request_jobs_status_check;

update android_test_request_jobs
set
  status = 'awaiting_manual',
  processing_started_at = coalesce(processing_started_at, updated_at)
where status = 'processing';

alter table android_test_request_jobs
add constraint android_test_request_jobs_status_check
check (status in ('queued', 'awaiting_manual', 'done', 'failed'));
