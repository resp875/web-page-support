"use client"

import Image from "next/image";

import { motion } from "framer-motion";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Brain, Layers, ArrowRight } from "lucide-react";

export default function Home() {
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
                <a href="#signup">
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
                    <p className="text-xs text-gray-600">Yushi Tanaka : モバイルエンジニア。モダンなコミュニケーション体験を研究中。</p>
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
              <a href="/auth/login?screen_hint=signup">
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
