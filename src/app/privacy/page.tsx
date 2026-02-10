export const metadata = {
  title: 'プライバシーポリシー - Resp',
  description: 'Respのプライバシーポリシー。収集する情報、利用目的、第三者提供、利用者の権利について説明します。',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-[#0d3b66]">プライバシーポリシー</h1>
        <p className="mt-4 text-sm text-gray-700">最終更新日: 2026年2月5日</p>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">はじめに</h2>
          <p className="mt-2 text-gray-700 text-sm">
            Resp（以下「当サービス」）は、利用者のプライバシーを尊重し、個人情報の適切な取り扱いに努めます。本ポリシーは、当サービスが収集する情報、その利用目的、第三者提供、利用者の権利などについて説明します。
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">収集する情報</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>登録情報：氏名、メールアドレスなど本人が登録した情報（該当する場合）。</li>
            <li>利用情報：ログの閲覧履歴、操作履歴、利用時間、IPアドレス等のサービス利用に関する情報。</li>
            <li>認証情報：OAuthや認証プロバイダから取得する識別子やプロフィール情報（該当する場合）。</li>
            <li>クッキー・類似技術：セッション管理や利用状況の解析のために使用されます。</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">収集方法</h2>
          <p className="mt-2 text-gray-700 text-sm">当サービスは、ユーザーから直接提供される情報のほか、サービス利用時のログやクッキー等の技術を通じて情報を収集します。</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">利用目的</h2>
          <p className="mt-2 text-gray-700 text-sm">収集した情報は以下の目的で利用します：</p>
          <ul className="mt-2 list-disc list-inside text-gray-700 text-sm">
            <li>サービス提供・運営のため</li>
            <li>問い合わせ対応やサポートのため</li>
            <li>不正利用の防止およびセキュリティ確保のため</li>
            <li>サービス改善や新機能開発のための分析のため</li>
            <li>法令に基づく対応のため</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">第三者提供</h2>
          <p className="mt-2 text-gray-700 text-sm">法令に定める場合や、利用者の同意がある場合を除き、個人情報を第三者に提供することはありません。ただし、外部の認証プロバイダや解析サービス等の利用に際しては、必要最低限の情報を提供する場合があります。</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">クッキー等について</h2>
          <p className="mt-2 text-gray-700 text-sm">当サービスはクッキーや類似技術を用いて、セッション管理や利便性向上、利用解析を行います。ブラウザ設定でクッキーを無効にすることは可能ですが、その場合一部の機能が正常に動作しないことがあります。</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">保存期間</h2>
          <p className="mt-2 text-gray-700 text-sm">取得した情報は、利用目的に応じて合理的な期間保存します。法令に基づく保存義務がある場合は、当該期間保存します。</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">利用者の権利</h2>
          <p className="mt-2 text-gray-700 text-sm">利用者は、当社が保持する自己の個人情報について、閲覧、訂正、削除、利用停止を求める権利があります。これらの請求は、下記お問い合わせ先までご連絡ください。本人確認のための情報提供をお願いする場合があります。</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">セキュリティ</h2>
          <p className="mt-2 text-gray-700 text-sm">当サービスは、個人情報の漏洩、滅失、毀損を防止するために適切な技術的・組織的対策を講じます。ただし、インターネットを通じたデータ伝送におけるリスクを完全に排除することはできません。</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold">ポリシーの変更</h2>
          <p className="mt-2 text-gray-700 text-sm">本ポリシーは必要に応じて改訂されます。重要な変更がある場合は、当サイト上で通知します。</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">お問い合わせ</h2>
          <p className="mt-2 text-gray-700 text-sm">プライバシーに関するご質問・ご要望は、以下のメールアドレスまでご連絡ください。</p>
          <p className="mt-2 text-gray-700 text-sm">メール: <a href="mailto:respwork11+support@gmail.com" className="text-[#0d3b66]">respwork11+support@gmail.com</a></p>
        </section>

        <div className="mt-10">
          <a href="/" className="text-[#0d3b66]">トップへ戻る</a>
        </div>
      </div>
    </main>
  )
}
