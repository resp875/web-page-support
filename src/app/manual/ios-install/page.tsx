import Image from "next/image";
import Link from "next/link";

interface Step {
  title: string;
  description: string;
  // public/ 配下の画像パス。スクリーンショットを用意した手順だけ指定する
  image?: string;
}

const img = (n: number) => `/manual/ios-install/step${String(n).padStart(2, "0")}.png`;

const steps: Step[] = [
  {
    title: "TestFlight アプリをインストールする",
    description:
      "iPhoneで App Store を開き、「TestFlight」を検索してインストールしてください。TestFlight は Apple 公式のテスト版アプリ配布用アプリです。すでにインストール済みの場合(ボタンが「開く」になっている場合)は次の手順へ進んでください。",
    image: img(1),
  },
  {
    title: "招待メールを開き「View in TestFlight」をタップ",
    description:
      "申請が完了すると、登録メールアドレス宛てに TestFlight の招待メールが届きます。iPhoneでメールを開き、「View in TestFlight」をタップしてください。メールが見当たらない場合は迷惑メールフォルダもご確認ください。",
    image: img(2),
  },
  {
    title: "「同意する」をタップ",
    description:
      "TestFlight が開き、RESP のテスト招待が表示されます。「同意する」をタップしてテストに参加してください。",
    image: img(3),
  },
  {
    title: "「インストール」をタップ",
    description: "ボタンが「インストール」に変わります。タップしてアプリをダウンロードしてください。",
    image: img(4),
  },
  {
    title: "インストール完了 — 「開く」をタップ",
    description:
      "インストールが完了すると「開く」ボタンが表示されます。「開く」をタップするか、ホーム画面の RESP アイコンからアプリを起動してください。",
    image: img(5),
  },
  {
    title: "テスト内容の案内 — 「続ける」をタップ",
    description:
      "初めて起動したときは、TestFlight によるテスト内容の案内が表示されます。内容を確認して「続ける」をタップしてください。",
    image: img(6),
  },
  {
    title: "フィードバックの案内 — 「続ける」をタップ",
    description:
      "スクリーンショットを撮るとアプリから直接フィードバックを送れることが案内されます。「続ける」をタップするとアプリが始まります。",
    image: img(7),
  },
  {
    title: "ログイン画面 — 新規の方は「サインアップ」へ",
    description:
      "RESP のログイン画面が表示されます。初めての方は画面下部の「サインアップ」からアカウントを作成してください。すでにアカウントをお持ちの場合は、ユーザー名とパスワードを入力して「ログイン」をタップしてください。",
    image: img(8),
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
                      width={750}
                      height={1334}
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
