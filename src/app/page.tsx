"use client"

import { useEffect, useState } from "react";
import Image from "next/image";

import { motion } from "framer-motion";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Brain, Layers, ArrowRight } from "lucide-react";

type AuthState = "loading" | "guest" | "member";
type AndroidRequestStatus = "queued" | "awaiting_manual" | "done" | "failed";

interface User {
  name?: string;
  picture?: string;
  email?: string;
}

function LoggedInHome({ user }: { user: User | null }) {
  const [isSubmittingAndroidRequest, setIsSubmittingAndroidRequest] = useState(false);
  const [androidRequestMessage, setAndroidRequestMessage] = useState<string>("");
  const [androidRequestStatus, setAndroidRequestStatus] = useState<AndroidRequestStatus | null>(null);
  const [androidRequestId, setAndroidRequestId] = useState<string | null>(null);
  const [androidRequestUpdatedAt, setAndroidRequestUpdatedAt] = useState<string | null>(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const statusLabelMap: Record<AndroidRequestStatus, string> = {
    queued: "受付済み",
    awaiting_manual: "対応中",
    done: "完了",
    failed: "失敗",
  };

  const statusDescriptionMap: Record<AndroidRequestStatus, string> = {
    queued: "申請を受け付けました。担当者への通知を送信済みです。",
    awaiting_manual: "担当者が Play Console で手動対応中です。完了までしばらくお待ちください。",
    done: "手続きが完了しました。クローズドテスト参加の準備ができています。",
    failed: "手続きに失敗しました。時間をおいて再申請いただくか、お問い合わせください。",
  };

  const refreshAndroidRequestStatus = async (requestId: string) => {
    setIsRefreshingStatus(true);

    try {
      const response = await fetch(`/api/closed-test/android-request/${requestId}`, {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        setAndroidRequestMessage(data?.message || "申請ステータスの取得に失敗しました。");
        return;
      }

      const statusFromApi = data?.status as AndroidRequestStatus | undefined;
      setAndroidRequestStatus(statusFromApi || null);
      setAndroidRequestUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : null);
    } catch {
      setAndroidRequestMessage("申請ステータスの取得に失敗しました。");
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  useEffect(() => {
    const savedRequestId = window.localStorage.getItem("latestAndroidRequestId");
    if (!savedRequestId) {
      return;
    }

    setAndroidRequestId(savedRequestId);
    void refreshAndroidRequestStatus(savedRequestId);
  }, []);

  const handleAndroidRequest = async () => {
    if (isSubmittingAndroidRequest) {
      return;
    }

    setIsSubmittingAndroidRequest(true);
    setAndroidRequestMessage("");

    try {
      const response = await fetch("/api/closed-test/android-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setAndroidRequestStatus(null);
        setAndroidRequestMessage(data?.message || "参加リクエストの送信に失敗しました。時間をおいて再度お試しください。");
        return;
      }

      const requestIdFromApi = typeof data?.requestId === "string" ? data.requestId : null;
      if (requestIdFromApi) {
        setAndroidRequestId(requestIdFromApi);
        window.localStorage.setItem("latestAndroidRequestId", requestIdFromApi);
      }

      const statusFromApi = data?.status as AndroidRequestStatus | undefined;
      setAndroidRequestStatus(statusFromApi || null);
      setAndroidRequestUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : null);
      setAndroidRequestMessage(data?.message || "参加リクエストを受け付けました。運用担当が手動で対応します。");
    } catch {
      setAndroidRequestStatus(null);
      setAndroidRequestMessage("参加リクエストの送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmittingAndroidRequest(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[#0d3b66]">ようこそ、{user?.name || "Respユーザー"} さん</h1>
          <p className="mt-3 text-gray-600">
            テスト参加申請、マニュアル確認、開発イベント情報の確認をこのページから行えます。
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#0d3b66]">Android クローズドテスト参加申請</h2>
              <p className="mt-2 text-sm text-gray-600">
                参加リクエストを送信すると、運用担当が手動でテスター追加を実施します。ステータスは受付後に順次更新されます。
              </p>
              <Button
                className="mt-5 bg-[#0d3b66] text-white hover:bg-[#155a91]"
                onClick={handleAndroidRequest}
                disabled={isSubmittingAndroidRequest}
              >
                {isSubmittingAndroidRequest ? "送信中..." : "Androidテスト参加をリクエスト"}
              </Button>
              {androidRequestMessage && (
                <p className="mt-3 text-sm text-gray-700">{androidRequestMessage}</p>
              )}
              {androidRequestStatus && (
                <div className="mt-2 rounded-md bg-[#eef5fb] p-3 text-sm text-[#0d3b66]">
                  <p>
                    現在のステータス: <span className="font-semibold">{statusLabelMap[androidRequestStatus]}</span>
                  </p>
                  <p className="mt-1 text-xs text-[#275f90]">{statusDescriptionMap[androidRequestStatus]}</p>
                  {androidRequestUpdatedAt && (
                    <p className="mt-1 text-xs text-[#275f90]">
                      最終更新: {new Date(androidRequestUpdatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {androidRequestId && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    className="border-[#0d3b66] text-[#0d3b66] hover:bg-[#e6f0fa]"
                    onClick={() => void refreshAndroidRequestStatus(androidRequestId)}
                    disabled={isRefreshingStatus}
                  >
                    {isRefreshingStatus ? "更新中..." : "ステータスを再取得"}
                  </Button>
                </div>
              )}
              {androidRequestStatus === "failed" && (
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

          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#0d3b66]">iOS クローズドテスト（案内）</h2>
              <p className="mt-2 text-sm text-gray-600">
                iOSは現在、参加案内のみ提供しています。申請機能は後続フェーズで追加予定です。
              </p>
              <p className="mt-4 text-sm text-gray-700">
                準備ができ次第、この画面で申請導線を公開します。
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#0d3b66]">操作マニュアル</h2>
              <p className="mt-2 text-sm text-gray-600">Respアプリの詳しい操作手順を確認できます。</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>アカウント初期設定（準備中）</li>
                <li>議論の開始方法（準備中）</li>
                <li>リアクション・評価機能の使い方（準備中）</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-[#0d3b66]">開発イベント情報</h2>
              <p className="mt-2 text-sm text-gray-600">アップデート情報やイベント予定を確認できます。</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>次回アップデート告知（準備中）</li>
                <li>ユーザーフィードバック会（準備中）</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer id="contact" className="mt-auto bg-gray-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-sm text-gray-600 sm:flex-row sm:px-6">
          <p>© 2025 Resp</p>
          <nav className="flex gap-4">
            <a href="/privacy" className="hover:text-[#0d3b66]">プライバシーポリシー</a>
            <a href="/terms" className="hover:text-[#0d3b66]">利用規約</a>
            <a href="mailto:respwork11+support@gmail.com" className="hover:text-[#0d3b66]">お問い合わせ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function LoggedOutHome() {
  return (
    <>
      <Head>
        <title>Resp - あなたの議論をもっと深く、もっと面白く</title>
        <meta name="description" content="Respは複数人でテーマごとに議論を整理・深化できる新しいツールです。ベータ版参加受付中。" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex min-h-screen flex-col font-sans">
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0d3b66] via-[#1d70b8] to-[#155a91] px-4 sm:px-6 py-24 md:py-32 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-lg"
              >
                あなたの議論をもっと深く、もっと面白く
              </motion.h1>
              <p className="mt-5 text-lg text-white/90 leading-relaxed">
                Respは複数人でテーマごとに議論を整理・深化できる新しいツールです。
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a href="/api/auth/login?screen_hint=signup">
                  <Button className="rounded-full bg-white text-[#0d3b66] font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform">
                    今すぐベータ版に参加する
                  </Button>
                </a>
              </div>
            </div>
            {/* Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mx-auto h-[480px] w-[216px] sm:h-[540px] sm:w-[243px] rounded-[32px] bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden relative"
              aria-label="アプリ画面のモックアップ"
            >
              <motion.div
                className="flex h-[540px] w-[729px] text-gray-500 text-sm sm:text-base"
                initial={{ x: 0 }}
                animate={{ x: [0, -243, -486, 0] }}
                transition={{ delay: 3, duration: 10, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/hero_image_00.png"
                  alt="アプリ画面モックアップ01"
                  className="h-[480px] w-[216px] sm:h-[540px] sm:w-[243px] rounded-[32px] shadow-2xl ring-1 ring-black/5 flex items-center justify-center px-4 py-4"
                />
                <img
                  src="/hero_image_02.png"
                  alt="アプリ画面モックアップ02"
                  className="h-[480px] w-[216px] sm:h-[540px] sm:w-[243px] rounded-[32px] shadow-2xl ring-1 ring-black/5 flex items-center justify-center px-4 py-4"
                />
                <img
                  src="/hero_image_03.png"
                  alt="アプリ画面モックアップ03"
                  className="h-[480px] w-[216px] sm:h-[540px] sm:w-[243px] rounded-[32px] shadow-2xl ring-1 ring-black/5 flex items-center justify-center px-4 py-4"
                />
              </motion.div>
            </motion.div>
          </div>

          {/* 背景装飾 */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/30 blur-2xl" />
          <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-[#1d70b8]/30 blur-2xl" />
        </section>

        {/* ===== Problem → Solution ===== */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold text-[#0d3b66]">課題提起 → 解決</h2>
            <p className="mt-3 text-gray-600">諦めていた悩みをRespで解消</p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[{
                icon: <MessageCircle className="text-[#1d70b8]" size={24} />,
                title: "議論が一方通行になりがち",
                desc: "Respなら 対話を重視するシステム",
              }, {
                icon: <Brain className="text-[#1d70b8]" size={24} />,
                title: "議論の全体像が見えない",
                desc: "Respなら ツリー構造で俯瞰可能",
              }, {
                icon: <Layers className="text-[#1d70b8]" size={24} />,
                title: "意見が埋もれる",
                desc: "Respなら 価値ある発言を評価",
              }].map((item, i) => (
                <Card key={i} className="shadow-sm hover:shadow-lg transition rounded-xl">
                  <CardContent className="p-6 text-left">
                    <div className="mb-4 flex items-center gap-3">
                      {item.icon}
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                    </div>
                    <p className="text-gray-600 text-sm"><span className="font-medium text-gray-800">{item.desc}</span></p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Use Cases ===== */}
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold text-[#0d3b66]">利用シーン</h2>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[{
                title: "オンラインで公開討論",
                desc: "参加者と協力し合って議論を展開。",
              }, {
                title: "議論する練習",
                desc: "中高生や大学生・社会人の学習に。",
              }, {
                title: "社内ブレスト",
                desc: "テーマごとにアイデアを収集。",
              }].map((u, i) => (
                <Card key={i} className="shadow-sm hover:shadow-lg transition rounded-xl">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg">{u.title}</h3>
                    <p className="mt-2 text-gray-600 text-sm">{u.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Trust / About ===== */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold text-[#0d3b66]">Respについて</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 text-left">
              <Card className="md:col-span-2 shadow-sm rounded-xl">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg">開発背景</h3>
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                    良い議論を促進する仕組みを作りたいという想いで開発をスタート。参加者のフィードバックを取り込みながら、機能の改善・追加を継続します。
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm rounded-xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden">
                    <Image
                      src="/me-androidified.png"
                      alt="Yushi Tanaka"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">開発者プロフィール</p>
                    <p className="text-xs text-gray-600">田中 雄志 : 東京大学卒業、公共政策大学院修了。公共的な言論空間のあり方について課題意識を持つ。外務省、戦略コンサルティングなどの経歴を経て、現在はフリーランスのITエンジニアとして活動中。</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {["議論についての新しい感覚！", "議論の全体を俯瞰できる感じが良い。", "返答が楽しみになった。"].map((t, i) => (
                <Card key={i} className="shadow-sm rounded-xl">
                  <CardContent className="p-4 text-gray-700 text-sm">“{t}”</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Final CTA ===== */}
        <section id="signup" className="bg-gradient-to-r from-[#0d3b66] via-[#1d70b8] to-[#155a91] py-20 text-white text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold">今すぐRespベータ版に参加しよう</h2>
            <p className="mt-3 text-white/90 text-base">無料で登録して議論を始めましょう。</p>

            <div className="mx-auto mt-8 flex justify-center">
              <a href="/api/auth/login?screen_hint=signup">
                <Button className="rounded-full bg-white text-[#0d3b66] font-semibold hover:scale-105 transition-transform px-8 py-6 text-lg">
                  無料で登録する
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            <p className="mt-4 text-xs text-white/80">※ ダウンロード導線は後日ご案内します（現在はベータ登録優先）。</p>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer id="contact" className="bg-gray-100 py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-gray-600">
            <p>© 2025 Resp</p>
            <nav className="flex gap-4">
              <a href="/privacy" className="hover:text-[#0d3b66]">プライバシーポリシー</a>
              <a href="/terms" className="hover:text-[#0d3b66]">利用規約</a>
              <a href="mailto:respwork11+support@gmail.com" className="hover:text-[#0d3b66]">お問い合わせ</a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (data?.user) {
          setUser(data.user);
          setAuthState("member");
          return;
        }
      } catch {
      }

      setAuthState("guest");
    };

    loadUser();
  }, []);

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 text-gray-600">
        読み込み中...
      </div>
    );
  }

  if (authState === "member") {
    return <LoggedInHome user={user} />;
  }

  return <LoggedOutHome />;
}
