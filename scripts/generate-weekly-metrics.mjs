import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const adminKey = process.env.JOB_ADMIN_KEY || "";
if (!adminKey) {
  console.log(JSON.stringify({ ok: false, error: "JOB_ADMIN_KEY missing" }));
  process.exit(0);
}

const endpoint = "http://localhost:3000/api/admin/android-requests?limit=200";
const response = await fetch(endpoint, {
  headers: {
    "x-job-admin-key": adminKey,
  },
});

const raw = await response.text();
if (!response.ok) {
  console.log(JSON.stringify({ ok: false, status: response.status, body: raw.slice(0, 200) }));
  process.exit(0);
}

const payload = JSON.parse(raw);
const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];

const now = new Date();
const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
const week2Start = new Date(now.getTime() - oneWeekMs);
const week1Start = new Date(now.getTime() - 2 * oneWeekMs);

function inRange(dateValue, start, end) {
  return dateValue >= start && dateValue < end;
}

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }

  const index = (values.length - 1) * p;
  const low = Math.floor(index);
  const high = Math.ceil(index);

  if (low === high) {
    return Number(values[low].toFixed(2));
  }

  return Number((values[low] + (values[high] - values[low]) * (index - low)).toFixed(2));
}

function calculate(items) {
  const total = items.length;
  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "failed").length;
  const resolved = done + failed;

  const successRate = resolved > 0 ? Number(((done / resolved) * 100).toFixed(2)) : 0;
  const failureRate = resolved > 0 ? Number(((failed / resolved) * 100).toFixed(2)) : 0;

  const durations = items
    .filter((item) => item.status === "done" || item.status === "failed")
    .map((item) => {
      const created = new Date(item.createdAt).getTime();
      const updated = new Date(item.updatedAt).getTime();
      return (updated - created) / 60000;
    })
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0)
    .sort((a, b) => a - b);

  const staleCount = items.filter((item) => {
    const isOpen = item.status === "queued" || item.status === "awaiting_manual";
    if (!isOpen) {
      return false;
    }

    return now.getTime() - new Date(item.createdAt).getTime() > 48 * 60 * 60 * 1000;
  }).length;

  return {
    total,
    done,
    failed,
    successRate,
    failureRate,
    p50Minutes: percentile(durations, 0.5),
    p90Minutes: percentile(durations, 0.9),
    staleCount,
  };
}

const week1Jobs = jobs.filter((job) => {
  const createdAt = new Date(job.createdAt);
  return inRange(createdAt, week1Start, week2Start);
});

const week2Jobs = jobs.filter((job) => {
  const createdAt = new Date(job.createdAt);
  return inRange(createdAt, week2Start, now);
});

const result = {
  ok: true,
  asOf: now.toISOString(),
  sampleCount: jobs.length,
  week1Range: [week1Start.toISOString(), week2Start.toISOString()],
  week2Range: [week2Start.toISOString(), now.toISOString()],
  week1: calculate(week1Jobs),
  week2: calculate(week2Jobs),
};

fs.writeFileSync("/tmp/metrics-report.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
