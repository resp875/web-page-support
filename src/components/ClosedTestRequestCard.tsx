"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type TestRequestStatus = "queued" | "awaiting_manual" | "done" | "failed";
export type TestRequestPlatform = "android" | "ios";

export interface ClosedTestRequestCardCopy {
  title: string;
  description: ReactNode;
  buttonLabel: string;
  statusDescription: Record<TestRequestStatus, string>;
  // done のときにステータス欄の下へ出す補足(インストールガイドへのリンクなど)
  doneExtra?: ReactNode;
}

const STATUS_LABEL: Record<TestRequestStatus, string> = {
  queued: "受付済み",
  awaiting_manual: "対応中",
  done: "完了",
  failed: "失敗",
};

const STORAGE_KEY: Record<TestRequestPlatform, string> = {
  android: "latestAndroidRequestId",
  ios: "latestIosRequestId",
};

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
  }
}

export function ClosedTestRequestCard({
  platform,
  copy,
}: {
  platform: TestRequestPlatform;
  copy: ClosedTestRequestCardCopy;
}) {
  const apiBase = `/api/closed-test/${platform}-request`;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<TestRequestStatus | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = useCallback(
    async (targetRequestId: string) => {
      setIsRefreshing(true);

      try {
        const response = await fetch(`${apiBase}/${targetRequestId}`, { method: "GET" });
        const data = await response.json();

        if (!response.ok) {
          setMessage(data?.message || "申請ステータスの取得に失敗しました。");
          return;
        }

        setStatus((data?.status as TestRequestStatus | undefined) || null);
        setUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : null);
      } catch {
        setMessage("申請ステータスの取得に失敗しました。");
      } finally {
        setIsRefreshing(false);
      }
    },
    [apiBase],
  );

  useEffect(() => {
    const savedRequestId = readStorage(STORAGE_KEY[platform]);
    if (!savedRequestId) {
      return;
    }

    setRequestId(savedRequestId);
    void refreshStatus(savedRequestId);
  }, [platform, refreshStatus]);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(null);
        setMessage(data?.message || "参加リクエストの送信に失敗しました。時間をおいて再度お試しください。");
        return;
      }

      const requestIdFromApi = typeof data?.requestId === "string" ? data.requestId : null;
      if (requestIdFromApi) {
        setRequestId(requestIdFromApi);
        writeStorage(STORAGE_KEY[platform], requestIdFromApi);
      }

      setStatus((data?.status as TestRequestStatus | undefined) || null);
      setUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : null);
      setMessage(data?.message || "参加リクエストを受け付けました。運用担当が手動で対応します。");
    } catch {
      setStatus(null);
      setMessage("参加リクエストの送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-[#0d3b66]">{copy.title}</h2>
        <div className="mt-2 text-sm text-gray-600">{copy.description}</div>
        <Button
          className="mt-5 bg-[#0d3b66] text-white hover:bg-[#155a91]"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "送信中..." : copy.buttonLabel}
        </Button>
        {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
        {status && (
          <div className="mt-2 rounded-md bg-[#eef5fb] p-3 text-sm text-[#0d3b66]">
            <p>
              現在のステータス: <span className="font-semibold">{STATUS_LABEL[status]}</span>
            </p>
            <p className="mt-1 text-xs text-[#275f90]">{copy.statusDescription[status]}</p>
            {updatedAt && (
              <p className="mt-1 text-xs text-[#275f90]">最終更新: {new Date(updatedAt).toLocaleString()}</p>
            )}
          </div>
        )}
        {status === "done" && copy.doneExtra}
        {requestId && (
          <div className="mt-3">
            <Button
              variant="outline"
              className="border-[#0d3b66] text-[#0d3b66] hover:bg-[#e6f0fa]"
              onClick={() => void refreshStatus(requestId)}
              disabled={isRefreshing}
            >
              {isRefreshing ? "更新中..." : "ステータスを再取得"}
            </Button>
          </div>
        )}
        {status === "failed" && (
          <p className="mt-3 text-sm text-gray-700">
            再申請を行うか、
            <a href="mailto:respwork11+support@gmail.com" className="text-[#0d3b66] underline">
              サポート窓口
            </a>
            へご連絡ください。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
