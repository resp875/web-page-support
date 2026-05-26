import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    title: "テスト参加用URLを開く",
    description:
      "クローズドテストへの参加URLをタップすると、URLのポップアップが表示されます。「開く」を選択してGoogle Playのテスター登録ページへ進んでください。",
  },
  {
    title: "テスター招待ページ — 「Become a tester」をタップ",
    description:
      "Google PlayにRESPのテスター招待ページが表示されます。招待メッセージを確認し、「Become a tester」ボタンをタップしてテスター登録を行ってください。",
  },
  {
    title: "テスター登録完了の確認",
    description:
      "「You are a tester.」と緑色で表示されれば、テスター登録は完了です。ページ内のリンク「download it on Google Play」をタップして、アプリのインストールページへ進んでください。",
  },
  {
    title: "アプリをインストールする",
    description:
      "Google PlayにRESP（早期アクセス）のインストール画面が表示されます。「インストール」ボタンをタップしてアプリをダウンロードしてください。",
  },
  {
    title: "インストール完了 — アプリを起動する",
    description:
      "インストールが完了すると「アンインストール」と「開く」ボタンが表示されます。「開く」をタップしてRESPアプリを起動してください。",
  },
  {
    title: "アカウント登録画面",
    description:
      "アプリを初めて起動するとアカウント登録画面が表示されます。ユーザー名・パスワード・ハンドルネーム・メールアドレスを入力し、「登録」ボタンをタップしてアカウントを作成してください。すでにアカウントをお持ちの場合は、画面下部の「ログイン画面へ」から進んでください。",
  },
];

export default function AndroidInstallPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-[#0d3b66]">Androidインストールガイド</h1>
          <Link href="/" className="text-sm text-[#0d3b66] underline hover:text-[#155a91]">
            ホームに戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-gray-600">
          クローズドテストに参加してRESPアプリをインストールするまでの手順を説明します。
        </p>

        <ol className="mt-8 space-y-10">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-6">
              <div className="flex-shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d3b66] text-sm font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-[#0d3b66]">{step.title}</h2>
                <p className="mt-1 text-sm text-gray-700">{step.description}</p>
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <Image
                    src={`/manual/android-install/step${String(i + 1).padStart(2, "0")}.png`}
                    alt={`手順${i + 1}: ${step.title}`}
                    width={390}
                    height={844}
                    className="mx-auto block max-h-[500px] w-auto"
                    priority={i === 0}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-lg bg-[#eef5fb] p-5">
          <p className="text-sm text-[#0d3b66]">
            インストールが完了したら、次は
            <Link href="/manual/android-tutorial" className="mx-1 font-semibold underline hover:text-[#155a91]">
              アプリ基本操作チュートリアル
            </Link>
            をご覧ください。
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-[#0d3b66] underline hover:text-[#155a91]">
            ← ホームに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
