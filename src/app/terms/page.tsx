export const metadata = {
  title: '利用規約 - Resp',
  description: 'Respの利用規約。ユーザーが当サービスを利用する際の条件、利用者の義務、禁止行為、免責事項などを説明します。',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-[#0d3b66]">利用規約</h1>
        <p className="mt-4 text-sm text-gray-700">最終更新日: 2026年2月5日</p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">第1条 適用</h2>
          <p className="mt-2 text-gray-700 text-sm">
            本規約は、Resp（以下「当サービス」）の利用に関する条件を定めるものです。当サービスのユーザーは、本規約に同意したうえでサービスを利用するものとします。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第2条 ユーザーの定義</h2>
          <p className="mt-2 text-gray-700 text-sm">
            本規約におけるユーザーとは、当サービスを利用するすべての個人および団体を指します。当サービスのご利用には、ユーザー登録が必要な場合があります。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第3条 利用開始</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>ユーザーは、規約に同意してアカウント登録を行うことで、当サービスの利用が開始されます。</li>
            <li>利用者が当時13歳未満である場合、保護者の同意が必要です。</li>
            <li>虚偽の情報を用いて登録することは禁止されています。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第4条 ユーザーの義務</h2>
          <p className="mt-2 text-gray-700 text-sm">ユーザーは以下の義務を負います：</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>登録情報の正確性を保ち、情報を最新の状態に保つこと</li>
            <li>アカウント情報（パスワード等）を厳管し、第三者に使用させないこと</li>
            <li>バックアップを自主的に行うこと</li>
            <li>当サービスの利用に関する法律を遵守すること</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第5条 禁止行為</h2>
          <p className="mt-2 text-gray-700 text-sm">以下の行為は禁止されています：</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>法律違反または違反の恐れのある行為</li>
            <li>他のユーザーやサービスへの嫌がらせ、脅迫、差別的発言</li>
            <li>不正アクセス、スパム、自動化ツールの無断利用</li>
            <li>個人情報の無断収集・公開</li>
            <li>サービスの運営を妨害する行為</li>
            <li>知的財産権の侵害</li>
            <li>高流出量のコンテンツの投稿</li>
            <li>商業的スパムメッセージの送信</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第6条 コンテンツの所有権</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>ユーザーが投稿したコンテンツ（テキスト、画像など）の著作権はユーザーが保有します。</li>
            <li>当サービスは、ユーザーのコンテンツを利用・公開するために、次のライセンスを取得します：
              <ul className="mt-2 list-circle list-inside ml-4 text-gray-700 text-sm">
                <li>サービス提供・改善のための利用</li>
                <li>サービス内での公開表示</li>
              </ul>
            </li>
            <li>ユーザーは投稿したコンテンツについて、すべての責任を負うものとします。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第7条 サービスの提供・変更・停止</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>当サービスは「現状のまま」提供されます。</li>
            <li>当社は予告なくサービスの機能を変更・停止することができます。</li>
            <li>保守・改善のためのメンテナンスにより、一時的にサービスが利用できなくなる場合があります。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第8条 免責事項</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>当社は、サービスの正確性、安全性、完全性などについて保証しません。</li>
            <li>サービスの利用に由来する直接的・間接的損害に対して、当社は一切の責任を負いません。</li>
            <li>ユーザー間のトラブルについて、当社は仲裁に応じません。</li>
            <li>インターネット環境の不具合によるサービス利用の支障については責任を負いません。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第9条 アカウント削除</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>ユーザーはいつでも自らのアカウントを削除できます。</li>
            <li>削除されたアカウントと関連するデータは取り戻せません。</li>
            <li>当社はユーザーの事前通知なく、規約違反等を理由としてアカウントを削除することができます。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第10条 規約の変更</h2>
          <p className="mt-2 text-gray-700 text-sm">
            当社は、必要に応じて本規約を変更することができます。重要な変更については、30日前までに通知します。利用の継続をもって、新規約への同意とみなします。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第11条 知的財産権</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>当サービスのデザイン、システム、ロゴなどは当社の知的財産で保護されています。</li>
            <li>ユーザーは、個人的な目的でのみ、これらを利用できます。</li>
            <li>商業的利用や再配布は厳に禁じられています。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第12条 準拠法・管轄</h2>
          <p className="mt-2 text-gray-700 text-sm">
            この規約は日本法に準拠します。紛争が生じた場合は、当社の所在地を管轄する家庭裁判所を第一審の専属管轄裁判所とします。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第13条 分離可能性</h2>
          <p className="mt-2 text-gray-700 text-sm">
            本規約のいずれかの条項が無効または執行不能とされた場合、その他の条項は引き続き有効に存続します。
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">お問い合わせ</h2>
          <p className="mt-2 text-gray-700 text-sm">利用規約に関するご質問・ご意見は、以下のメールアドレスまでご連絡ください。</p>
          <p className="mt-2 text-gray-700 text-sm">メール: <a href="mailto:respwork11+support@gmail.com" className="text-[#0d3b66]">respwork11+support@gmail.com</a></p>
        </section>

        <div className="mt-10">
          <a href="/" className="text-[#0d3b66]">トップへ戻る</a>
        </div>
      </div>
    </main>
  )
}
