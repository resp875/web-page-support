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
    id: "manual-account-setup",
    title: "アカウント初期設定ガイド",
    description: "プロフィール編集、通知設定、基本設定を最初に完了する手順です。",
    href: "https://support.resp.example/manuals/account-setup",
    updatedAt: "2026-03-05T09:00:00+09:00",
  },
  {
    id: "manual-discussion-start",
    title: "議論の開始とトピック作成",
    description: "新しい議論を立てるときのテンプレートと進行のコツをまとめています。",
    href: "https://support.resp.example/manuals/discussion-start",
    updatedAt: "2026-03-06T10:30:00+09:00",
  },
  {
    id: "manual-reaction-review",
    title: "リアクションと評価機能の使い方",
    description: "リアクション、評価、振り返り機能を活用して議論の質を上げる方法です。",
    href: "https://support.resp.example/manuals/reaction-review",
    updatedAt: "2026-03-07T14:15:00+09:00",
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