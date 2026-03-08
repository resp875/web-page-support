create table if not exists android_test_request_jobs (
  request_id text primary key,
  user_id text not null,
  requester_email text,
  platform text not null default 'android',
  status text not null check (status in ('queued', 'awaiting_manual', 'done', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processing_started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  attempt_count integer not null default 0,
  error_code text,
  error_message text,
  test_join_url text
);

create index if not exists idx_android_jobs_user_status
  on android_test_request_jobs (user_id, status);

create index if not exists idx_android_jobs_created_at
  on android_test_request_jobs (created_at desc);

create table if not exists android_test_request_audit_logs (
  id bigserial primary key,
  request_id text not null references android_test_request_jobs (request_id) on delete cascade,
  from_status text not null,
  to_status text not null,
  actor_type text not null,
  actor_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_android_request_audit_logs_request_id_created_at
  on android_test_request_audit_logs (request_id, created_at desc);
