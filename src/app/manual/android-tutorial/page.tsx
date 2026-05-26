import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    title: "アプリを起動する",
    description:
      "インストール済みのRespアイコンをタップしてアプリを起動します。",
  },
  {
    title: "ログイン／アカウント作成",
    description:
      "既存のアカウントでログインするか、新規アカウントを作成します。",
  },
  {
    title: "メールアドレスを入力する",
    description:
      "登録に使用するメールアドレスを入力し、「次へ」をタップします。",
  },
  {
    title: "プロフィールを設定する",
    description:
      "表示名やプロフィール画像を設定します。後から変更することも可能です。",
  },
  {
    title: "ホーム画面を確認する",
    description:
      "ログイン後のホーム画面が表示されます。議論一覧や通知などが確認できます。",
  },
  {
    title: "議論一覧を見る",
    description:
      "参加中の議論や注目の議論が一覧で表示されます。タップして詳細を確認できます。",
  },
  {
    title: "新しい議論を作成する",
    description:
      "「＋」ボタンをタップして新しい議論を作成します。テーマと説明を入力します。",
  },
  {
    title: "議題を入力する",
    description:
      "議論のテーマを入力します。明確で参加者が理解しやすいテーマを設定しましょう。",
  },
  {
    title: "参加者を招待する",
    description:
      "議論に参加してほしいメンバーをメールアドレスやユーザー名で招待します。",
  },
  {
    title: "議論に参加する",
    description:
      "参加中の議論を選択して議論画面を開きます。他の参加者の意見が表示されます。",
  },
  {
    title: "意見を投稿する",
    description:
      "入力フィールドに自分の意見を入力して投稿します。ツリー構造で整理されます。",
  },
  {
    title: "他の意見にリアクションする",
    description:
      "他の参加者の意見に対してリアクションボタンをタップして評価を送ります。",
  },
  {
    title: "リアクションの種類を確認する",
    description:
      "さまざまな種類のリアクションがあります。意見の内容に合ったリアクションを選びましょう。",
  },
  {
    title: "議論の全体像を俯瞰する",
    description:
      "ツリービューを使って議論の構造全体を確認できます。どの意見がどの意見に対応しているかが一目でわかります。",
  },
  {
    title: "振り返り機能を使う",
    description:
      "議論終了後に振り返り機能を活用して、重要なポイントをまとめます。次回の議論に役立てましょう。",
  },
];

export default function AndroidTutorialPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-[#0d3b66]">アプリ基本操作チュートリアル</h1>
          <Link href="/" className="text-sm text-[#0d3b66] underline hover:text-[#155a91]">
            ホームに戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-gray-600">
          Respアプリの基本的な操作方法を順を追って説明します。
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
                    src={`/manual/android-tutorial/step${String(i + 1).padStart(2, "0")}.png`}
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
            ご不明な点は
            <a
              href="mailto:respwork11+support@gmail.com"
              className="mx-1 font-semibold underline hover:text-[#155a91]"
            >
              サポート窓口
            </a>
            までお問い合わせください。
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
