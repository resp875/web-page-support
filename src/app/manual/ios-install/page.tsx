import Image from "next/image";
import Link from "next/link";

interface Step {
  title: string;
  description: string;
  // public/ 配下の画像パス。スクリーンショットを用意した手順だけ指定する
  image?: string;
}

const steps: Step[] = [
  {
    title: "TestFlight アプリをインストールする",
    description:
      "iPhoneで App Store を開き、「TestFlight」を検索してインストールしてください。TestFlight は Apple 公式のテスト版アプリ配布用アプリです。すでにインストール済みの場合は次の手順へ進んでください。",
  },
  {
    title: "招待メールを開き「View in TestFlight」をタップ",
    description:
      "申請が完了すると、登録メールアドレス宛てに TestFlight の招待メールが届きます。iPhoneでメールを開き、「View in TestFlight」をタップしてください。メールが見当たらない場合は迷惑メールフォルダもご確認ください。",
  },
  {
    title: "TestFlight で「Accept」→「Install」をタップ",
    description:
      "TestFlight に RESP のテスト招待が表示されます。「Accept」をタップしてテストに参加し、続けて「Install」をタップしてアプリをダウンロードしてください。",
  },
  {
    title: "インストール完了 — アプリを起動する",
    description:
      "インストールが完了すると「Open」ボタンが表示されます。「Open」をタップするか、ホーム画面の RESP アイコンからアプリを起動してください。",
  },
  {
    title: "アカウント登録画面",
    description:
      "アプリを初めて起動するとアカウント登録画面が表示されます。ユーザー名・パスワード・ハンドルネーム・メールアドレスを入力し、「登録」ボタンをタップしてアカウントを作成してください。すでにアカウントをお持ちの場合は、画面下部の「ログイン画面へ」から進んでください。",
  },
];

export default function IosInstallPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-[#0d3b66]">iOSインストールガイド</h1>
          <Link href="/" className="text-sm text-[#0d3b66] underline hover:text-[#155a91]">
            ホームに戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-gray-600">
          TestFlight の外部テストに参加して RESP アプリをインストールするまでの手順を説明します。iOS 16.0 以上の iPhone
          が必要です。
        </p>
        <p className="mt-2 text-sm text-gray-600">
          招待メールは、ホーム画面の「iOS 外部テスト(TestFlight)参加申請」から申請し、運用担当の対応が完了すると届きます。
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
                {step.image && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <Image
                      src={step.image}
                      alt={`手順${i + 1}: ${step.title}`}
                      width={390}
                      height={844}
                      className="mx-auto block max-h-[500px] w-auto"
                      priority={i === 0}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-lg bg-[#eef5fb] p-5">
          <p className="text-sm text-[#0d3b66]">
            インストールが完了したら、次は
            <Link href="/manual/app-guide" className="mx-1 font-semibold underline hover:text-[#155a91]">
              アプリ操作ガイド
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
