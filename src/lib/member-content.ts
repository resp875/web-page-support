export interface ManualContentItem {
  id: string
  title: string
  description: string
  href: string
  updatedAt: string
}

export interface EventContentItem {
  id: string
  title: string
  summary: string
  startsAt: string
  format: "online" | "onsite"
  location: string
  href: string
}

export const manualContentItems: ManualContentItem[] = [
  {
    id: "manual-android-install",
    title: "Androidインストールガイド",
    description: "Google Play ストアからRespをインストールする手順を説明します。",
    href: "/manual/android-install",
    updatedAt: "2026-03-17T09:00:00+09:00",
  },
  {
    id: "manual-app-guide",
    title: "アプリ操作ガイド",
    description:
      "アカウント作成から、ツリーの見方、発言・リクエスト・投げ銭、ポートフォリオまで、アプリの使い方を画面つきで説明します(Android・iOS共通)。",
    href: "/manual/app-guide",
    updatedAt: "2026-09-29T09:00:00+09:00",
  },
]

export const eventContentItems: EventContentItem[] = [
  {
    id: "event-weekly-release-note",
    title: "週次アップデート共有会",
    summary: "直近の変更点と次週リリース予定を開発チームが共有します。",
    startsAt: "2026-03-12T19:30:00+09:00",
    format: "online",
    location: "Google Meet",
    href: "https://support.resp.example/events/weekly-release-note",
  },
  {
    id: "event-feedback-session",
    title: "ユーザーフィードバック会",
    summary: "クローズドテスト参加者の意見を収集し、優先改善項目を決定します。",
    startsAt: "2026-03-19T20:00:00+09:00",
    format: "online",
    location: "Zoom",
    href: "https://support.resp.example/events/feedback-session",
  },
]