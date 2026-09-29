import Image from "next/image";
import Link from "next/link";

// 画像は docs/manual-capture-guide.md の手順でAndroidエミュレーターから撮影したもの(長辺900px)。
// 撮り直した場合はファイル名を変えずに差し替える。
const SCREEN_WIDTH = 405;
const SCREEN_HEIGHT = 900;

interface GuideImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface GuideStep {
  title: string;
  description: string;
  image?: GuideImage;
}

interface GuideSection {
  id: string;
  title: string;
  lead?: string[];
  steps: GuideStep[];
}

const img = (name: string, alt: string, size?: { width: number; height: number }): GuideImage => ({
  src: `/manual/app-guide/${name}.png`,
  alt,
  ...size,
});

const sections: GuideSection[] = [
  {
    id: "intro",
    title: "はじめに",
    lead: [
      "Respは、参加者どうしで良い議論をするためのアプリです。Respでは、すべての発言が、ほかの発言に対する「レスポンス」として扱われます。発言は木(ツリー)の形につながるので、どの発言がどの発言に応えているのかを、あとからたどることができます。",
      "このガイドは、Android版とiOS版の共通の説明です。画面はAndroid版のものですが、iOS版でも同じように操作できます。",
    ],
    steps: [],
  },
  {
    id: "account",
    title: "アカウント",
    steps: [
      {
        title: "アカウントを作成する",
        description:
          "初めてアプリを起動すると、アカウント作成の画面が表示されます。ユーザー名・ハンドルネーム・メールアドレス・パスワードを入力し、「アカウント登録」をタップします。登録が終わると、そのままログインした状態になります。ユーザー名はあとから変更できません。ハンドルネームは画面に表示される名前で、あとから変更できます。",
        image: img("02-01", "アカウント作成画面に入力したところ"),
      },
      {
        title: "ログインする",
        description:
          "すでにアカウントをお持ちの場合は、アカウント作成画面の下にある「ログイン」をタップし、ユーザー名とパスワードでログインします。パスワードを忘れた場合は「パスワードを忘れた場合」をタップすると、再設定のページが開きます。",
        image: img("02-02", "ログイン画面"),
      },
    ],
  },
  {
    id: "menu",
    title: "メニュー画面",
    steps: [
      {
        title: "画面の構成",
        description:
          "ログインすると、メニュー画面が表示されます。画面下のタブで「リクエスト」「ピン」「トピック」を切り替えます。右上の2つのアイコンは、左が自分のポートフォリオ、右がユーザー情報です。",
        image: img("03-01", "メニュー画面(リクエストタブ)"),
      },
      {
        title: "表示を絞り込む",
        description:
          "左上の「≡」をタップすると、表示を絞り込むメニューが開きます。中身はタブごとに変わります。たとえば「リクエスト」タブでは、受信ボックスと送信済みを切り替えられます。",
        image: img("03-02", "リクエストタブの絞り込みメニュー"),
      },
    ],
  },
  {
    id: "topic",
    title: "トピック",
    steps: [
      {
        title: "トピックを探す",
        description:
          "「トピック」タブには、議論のテーマ(トピック)が並んでいます。上の検索欄でトピックを探せます。「OPEN」の札が付いたトピックは投稿を受け付けています。札のないトピックは終了(クローズ)していて、読むことだけできます。トピック名の下には、参加しているユーザーのアイコンが並びます。トピックをタップすると、ツリー画面が開きます。",
        image: img("04-01", "トピック一覧"),
      },
      {
        title: "公開・秘密で絞り込む",
        description:
          "左上の「≡」から、「すべてのトピック」「公開トピック」「秘密のトピック」を切り替えられます。秘密のトピックには鍵のマークが付きます。",
        image: img("04-02", "トピックタブの絞り込みメニュー"),
      },
      {
        title: "新しいトピックを作る",
        description:
          "トピック一覧の右下にある「＋」をタップすると、新しいトピックを作成できます。テーマを入力して「投稿」をタップすると、作成したトピックのツリー画面が開きます。",
        image: img("04-03", "新しいトピックの作成画面"),
      },
    ],
  },
  {
    id: "tree",
    title: "ツリー画面の見方",
    steps: [
      {
        title: "縦のつながり:下のカードは上のカードへのレスポンス",
        description:
          "トピックを開くと、背景が緑のツリー画面が表示されます。いちばん上のカードがトピックのテーマです。その下に発言がカードになって縦に並び、下のカードは、すぐ上のカードへのレスポンスです。上下にスクロールして読み進めます。続きがあるときは「上にさらに続きがあります」「下にさらに続きがあります」と表示され、端までスクロールすると続きが読み込まれます。自分の発言には、カードの左端に線が付きます。",
        image: img("05-01", "ツリー画面"),
      },
      {
        title: "横のつながり:スワイプで兄弟を切り替える",
        description:
          "カードの左右に別のカードの端が見えているときは、同じ発言に対するレスポンスがほかにもあります。このガイドでは、同じ発言へのレスポンスどうしを「兄弟」と呼びます。カードを左右にスワイプすると兄弟が切り替わり、その下に続く発言も切り替わります。兄弟はスコアの高い順に並んでいて、左にあるほどスコアが高い発言です。",
        image: img("05-02", "兄弟を切り替えたところ"),
      },
    ],
  },
  {
    id: "post",
    title: "発言する",
    steps: [
      {
        title: "入力欄を開いて書く",
        description:
          "レスポンスしたいカードの本文をタップすると、カードの下に入力欄が開きます。もう一度タップすると閉じます。文章を入力して、右側の送信ボタンをタップします。クローズしたトピックでは、入力欄に「このトピックはクローズされています」と表示され、投稿できません。",
        image: img("06-01", "カードの下に開いた入力欄"),
      },
      {
        title: "リクエストする相手を選んで投稿する",
        description:
          "送信ボタンを押すと「誰にリクエストしますか?」と表示されます。特定の人に返事をしてほしいときは、その人にリクエストを送れます。「リクエストしない」「(返信先の人)さんに返信」「自分に送る」から選ぶか、ユーザーを検索して選びます。ピンしたユーザーは「よく使う相手」に表示されます。最後に「投稿する」をタップすると、発言が投稿されます。発言するたびに、スコアを1消費します。",
        image: img("06-02", "リクエスト先を選ぶ画面", { width: 405, height: 435 }),
      },
    ],
  },
  {
    id: "detail",
    title: "長押しメニュー(投げ銭・ピン)",
    steps: [
      {
        title: "発言の詳細を見る",
        description:
          "カードを長押しすると、発言の詳細が下から表示されます。投稿者、本文、投稿日時、スコア(ピンク色の数字)と、兄弟の中での順位(「1st」など)が確認できます。",
        image: img("07-01", "発言の詳細"),
      },
      {
        title: "投げ銭する・ピンする",
        description:
          "「＄」ボタンをタップすると、その発言に投げ銭できます。良いと思った発言に送りましょう。投げ銭はスコアを消費しません。1つの発言には1回だけ投げ銭でき、投げ銭をするとボタンがグレーになります。自分の発言と、自分宛てのリクエストには投げ銭できません。ピンのボタンをタップすると、発言をピンに追加できます。ピンした発言にはピンのマークが付き、メニューの「ピン」タブから見返せます。もう一度タップするとピンが外れます。",
        image: img("07-02", "投げ銭とピンをしたあとの詳細"),
      },
      {
        title: "兄弟の一覧を見る",
        description:
          "詳細に表示される「1st」などの順位をタップすると、兄弟の一覧が開きます。一覧の発言をタップすると、その発言に移動します。",
        image: img("07-03", "兄弟の一覧"),
      },
    ],
  },
  {
    id: "request",
    title: "リクエスト",
    lead: [
      "リクエストは、特定の人に「この発言に答えてほしい」と頼む機能です。リクエストに応えて発言すると、通常よりも多くのスコアを獲得できます。",
    ],
    steps: [
      {
        title: "自分宛てのリクエストに応える",
        description:
          "誰かからリクエストされると、ツリーでは、その発言の下に「リクエストされています」というカードが表示されます。メニューの「リクエスト」タブ(受信ボックス)にも届きます。応えるときは、リクエストされた発言(「リクエストされています」のすぐ上のカード)をタップして、ふつうに発言します。",
        image: img("05-02", "「リクエストされています」のカード"),
      },
      {
        title: "うなずき・懐疑で応える",
        description:
          "文章で答える代わりに、リクエストされた発言を長押しし、「うなずき」(同意)か「懐疑」(疑問)をタップして応えることもできます。この2つのボタンは、自分宛てのリクエストにだけ表示されます。",
        image: img("08-01", "自分宛てのリクエストの詳細(うなずき・懐疑のボタン)"),
      },
      {
        title: "うなずき・懐疑の表示",
        description:
          "うなずきや懐疑で応えると、その発言へのレスポンスとして、それぞれのイラストのカードが付きます。",
        image: img("08-02", "うなずきのカード"),
      },
      {
        title: "",
        description: "こちらは懐疑で応えた例です。",
        image: img("08-03", "懐疑のカード"),
      },
      {
        title: "このトピックで受けているリクエストを見る",
        description:
          "ツリー画面の左下のアイコンに付く数字は、このトピックであなたがまだ応えていないリクエストの数です。アイコンをタップすると、一覧が表示されます。",
        image: img("08-04", "このトピックのリクエスト一覧"),
      },
      {
        title: "受信ボックスと送信済みのリクエスト",
        description:
          "メニューの「リクエスト」タブでは、受信ボックスのリクエストを左にスワイプするとアーカイブできます。アーカイブしたものは「受信ボックス・すべて」で確認できます。「≡」から「送信済み・すべて」「送信済み・未返信」を選ぶと、自分が送ったリクエストを確認できます。",
        image: img("08-05", "送信済みのリクエスト"),
      },
    ],
  },
  {
    id: "tree-tools",
    title: "ツリー画面のその他の機能",
    steps: [
      {
        title: "表示を切り替える",
        description:
          "ツリー画面の左上の「≡」から、表示を切り替えられます。「戻る」でメニュー画面へ、「ツリービュー」でツリーの表示に戻ります。",
        image: img("09-01", "ツリー画面のメニュー"),
      },
      {
        title: "タイムライン",
        description:
          "「タイムライン」では、このトピックの発言を新しい順に一覧で見られます。発言をタップすると、その発言をツリーで開きます。",
        image: img("09-02", "タイムライン"),
      },
      {
        title: "タイムラインを絞り込む",
        description:
          "タイムラインの右上にあるフィルターのアイコンをタップすると、自分の発言だけ、または特定のユーザーの発言だけに絞り込めます。「フィルターを解除する」ですべての発言の表示に戻ります。",
        image: img("09-03", "タイムラインの絞り込み"),
      },
      {
        title: "全体図",
        description:
          "「全体図」では、トピック全体が、どのように枝分かれしているかを図で確認できます。",
        image: img("09-04", "全体図"),
      },
      {
        title: "トピックの統計とランキング",
        description:
          "ツリー画面の上部にあるトピック名をタップすると、トピックの統計(レスポンス数・参加ユーザー数・投げ銭合計)と、ユーザーと発言のランキングが表示されます。「通常」と「投げ銭」で、ランキングを切り替えられます。",
        image: img("09-05", "トピックの統計とランキング"),
      },
      {
        title: "このトピックでの自分のスコア",
        description:
          "ツリー画面の右下の数字は、このトピックでのあなたのスコアです。タップすると「サマリ」に、このトピックでの自分の発言と、それぞれのスコアが表示されます。",
        image: img("09-06", "スコアのサマリ"),
      },
      {
        title: "",
        description: "「時系列」では、このトピックで、誰が誰の発言にレスポンスしたかを、時間の順に確認できます。",
        image: img("09-07", "スコアの時系列"),
      },
    ],
  },
  {
    id: "portfolio",
    title: "ポートフォリオとスコア",
    lead: [
      "発言にレスポンスや投げ銭が付くと、その発言のスコアが上がり、上がった分は発言した人に配分されます。投げ銭した発言が、そのあと多くのレスポンスを集めた場合は、投げ銭した人にも配分されます。参加者は、スコアを多く獲得することを目指します。",
    ],
    steps: [
      {
        title: "自分のポートフォリオ",
        description:
          "メニュー画面の右上にあるポートフォリオのアイコンをタップすると、自分のポートフォリオが開きます。純資産額・含み益・キャッシュと、自分の発言の一覧がスコア付きで表示されます。「発言」と「投げ銭」で、自分の発言と、投げ銭した発言を切り替えられます。",
        image: img("10-01", "自分のポートフォリオ"),
      },
      {
        title: "利益を確定する・ロックする",
        description:
          "各発言の「＄」ボタンをタップすると、確認のあと、その発言の利益を確定(利確)できます。「全て利確」を押すと、ロックしていないすべての発言の利益をまとめて確定します。鍵のボタンで発言をロックすると、その発言は「全て利確」の対象から外れます。",
        image: img("10-02", "利益確定の確認"),
      },
      {
        title: "ほかの人のポートフォリオ",
        description:
          "ツリーや一覧でユーザーのアイコンをタップすると、その人のポートフォリオが開きます。ほかの人のポートフォリオでは、純資産額と発言の一覧が表示されます。",
        image: img("10-03", "ほかのユーザーのポートフォリオ"),
      },
    ],
  },
  {
    id: "pin",
    title: "ピン",
    steps: [
      {
        title: "ピンしたものを見返す",
        description:
          "メニューの「ピン」タブで、ピンしたものを見返せます。左上の「≡」から「レスポンス」「ユーザー」「トピック」を切り替えます。「ユーザー」の画面ではユーザーを検索でき、☆をタップしてピンする・外すを切り替えられます。",
        image: img("11-01", "ピンした発言の一覧"),
      },
    ],
  },
  {
    id: "user",
    title: "ユーザー情報",
    steps: [
      {
        title: "プロフィールを変更する",
        description:
          "メニュー画面の右上にあるユーザー情報のアイコン(またはポートフォリオの歯車)をタップすると開きます。アイコン画像はタップして変更できます。ハンドルネームは、入力して「更新する」をタップすると変更できます。ユーザー名は変更できません。",
        image: img("12-01", "ユーザー情報"),
      },
      {
        title: "ログアウト・アカウント削除",
        description:
          "「ログアウト」をタップすると、ログイン画面に戻ります。「アカウント削除」をタップし、確認で「削除する」を選ぶと、アカウントが削除されます。この操作は取り消せません。",
      },
    ],
  },
];

export default function AppGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold text-[#0d3b66]">アプリ操作ガイド</h1>
          <Link href="/" className="text-sm text-[#0d3b66] underline hover:text-[#155a91]">
            ホームに戻る
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-gray-600">
          Respアプリの使い方を、画面ごとに説明します。Android版・iOS版で共通です。
        </p>

        <nav aria-label="目次" className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0d3b66]">目次</h2>
          <ol className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {sections.map((section, i) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-[#0d3b66] underline hover:text-[#155a91]">
                  {i + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((section, sectionIndex) => (
          <section key={section.id} id={section.id} className="mt-14 scroll-mt-20">
            <h2 className="border-b-2 border-[#0d3b66] pb-2 text-lg font-bold text-[#0d3b66]">
              {sectionIndex + 1}. {section.title}
            </h2>
            {section.lead?.map((paragraph, i) => (
              <p key={i} className="mt-4 text-sm leading-relaxed text-gray-700">
                {paragraph}
              </p>
            ))}

            {section.steps.length > 0 && (
              <ol className="mt-8 space-y-10">
                {section.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-6">
                    <div className="w-8 flex-shrink-0">
                      {step.title && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d3b66] text-sm font-bold text-white">
                          {stepIndex + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {step.title && <h3 className="text-base font-semibold text-[#0d3b66]">{step.title}</h3>}
                      <p className="mt-1 text-sm leading-relaxed text-gray-700">{step.description}</p>
                      {step.image && (
                        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                          <Image
                            src={step.image.src}
                            alt={step.image.alt}
                            width={step.image.width ?? SCREEN_WIDTH}
                            height={step.image.height ?? SCREEN_HEIGHT}
                            className="mx-auto block max-h-[500px] w-auto"
                            priority={sectionIndex === 1 && stepIndex === 0}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}

        <div className="mt-14 rounded-lg bg-[#eef5fb] p-5">
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
