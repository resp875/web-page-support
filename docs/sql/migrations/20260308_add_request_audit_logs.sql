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
