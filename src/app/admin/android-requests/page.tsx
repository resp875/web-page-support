"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Status = "queued" | "awaiting_manual" | "done" | "failed";

interface AdminJob {
  requestId: string;
  userId: string;
  requesterEmail: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

interface AuditLog {
  id: string;
  requestId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  queued: "受付済み",
  awaiting_manual: "対応中",
  done: "完了",
  failed: "失敗",
};

export default function AdminAndroidRequestsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [transitioningRequestId, setTransitioningRequestId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = window.localStorage.getItem("androidAdminKey");
    if (savedKey) {
      setAdminKey(savedKey);
    }
  }, []);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [jobs],
  );

  const loadJobs = async () => {
    if (!adminKey) {
      setMessage("管理者キーを入力してください。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const statusQuery = statusFilter === "all" ? "" : `&status=${statusFilter}`;
      const response = await fetch(`/api/admin/android-requests?limit=100${statusQuery}`, {
        headers: {
          "x-job-admin-key": adminKey,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.message || "申請一覧の取得に失敗しました。");
        return;
      }

      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      window.localStorage.setItem("androidAdminKey", adminKey);
    } catch {
      setMessage("申請一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const transitionStatus = async (requestId: string, toStatus: Status) => {
    if (!adminKey) {
      setMessage("管理者キーを入力してください。");
      return;
    }

    setTransitioningRequestId(requestId);
    setMessage("");

    try {
      const response = await fetch(`/api/closed-test/android-request/${requestId}/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-job-admin-key": adminKey,
        },
        body: JSON.stringify({ toStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.message || "状態更新に失敗しました。");
        return;
      }

      await loadJobs();
      if (selectedRequestId === requestId) {
        await loadAuditLogs(requestId);
      }
    } catch {
      setMessage("状態更新に失敗しました。");
    } finally {
      setTransitioningRequestId(null);
    }
  };

  const loadAuditLogs = async (requestId: string) => {
    if (!adminKey) {
      setMessage("管理者キーを入力してください。");
      return;
    }

    setSelectedRequestId(requestId);

    try {
      const response = await fetch(`/api/admin/android-requests/${requestId}/audit`, {
        headers: {
          "x-job-admin-key": adminKey,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.message || "監査ログの取得に失敗しました。");
        return;
      }

      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch {
      setMessage("監査ログの取得に失敗しました。");
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Android申請 管理ダッシュボード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="JOB_ADMIN_KEY を入力"
            />
            <select
              className="h-9 rounded-md border px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | Status)}
            >
              <option value="all">全ステータス</option>
              <option value="queued">queued</option>
              <option value="awaiting_manual">awaiting_manual</option>
              <option value="done">done</option>
              <option value="failed">failed</option>
            </select>
            <Button onClick={loadJobs} disabled={loading}>
              {loading ? "読み込み中..." : "一覧を取得"}
            </Button>
          </div>

          {message && <p className="text-sm text-red-600">{message}</p>}

          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">requestId</th>
                  <th className="px-3 py-2">email</th>
                  <th className="px-3 py-2">status</th>
                  <th className="px-3 py-2">updatedAt</th>
                  <th className="px-3 py-2">actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedJobs.map((job) => (
                  <tr key={job.requestId} className="border-t align-top">
                    <td className="px-3 py-2 font-mono text-xs">{job.requestId}</td>
                    <td className="px-3 py-2">{job.requesterEmail || "-"}</td>
                    <td className="px-3 py-2">{STATUS_LABEL[job.status]}</td>
                    <td className="px-3 py-2">{new Date(job.updatedAt).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {job.status === "queued" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={transitioningRequestId === job.requestId}
                            onClick={() => transitionStatus(job.requestId, "awaiting_manual")}
                          >
                            対応中へ
                          </Button>
                        )}
                        {job.status === "awaiting_manual" && (
                          <>
                            <Button
                              size="sm"
                              disabled={transitioningRequestId === job.requestId}
                              onClick={() => transitionStatus(job.requestId, "done")}
                            >
                              完了へ
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={transitioningRequestId === job.requestId}
                              onClick={() => transitionStatus(job.requestId, "failed")}
                            >
                              失敗へ
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void loadAuditLogs(job.requestId)}
                        >
                          監査ログ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedJobs.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                      データがありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedRequestId && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>監査ログ: {selectedRequestId}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded border p-3">
                  <p>
                    {new Date(log.createdAt).toLocaleString()} / {log.fromStatus} -&gt; {log.toStatus}
                  </p>
                  <p className="text-gray-600">actor: {log.actorType} ({log.actorId || "-"})</p>
                </div>
              ))}
              {auditLogs.length === 0 && <p className="text-gray-500">監査ログはありません。</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
