const isDev = process.env.NODE_ENV !== 'production'; // eslint-disable-line no-unused-vars

export default {
  // 受信メッセージ
  MESSAGE_INIT_SCHEDULE: '明日は何ゴミ？',
  MESSAGE_INIT_SEPARATION: '分別をしらべる',

  // 返信メッセージ
  REPLY_WHAT_KIND_OF_TRASH: 'どんなものですか？',
  REPLY_SYSTEM_ERROR: 'システムエラーが発生しました',
  REPLY_ERROR_NOT_A_STRING: '文字以外のメッセージには回答することができません！',
  REPLY_ERROR_INVALID_MESSAGE: '不正な入力です！\n\n下部のメニューから選択してください',
  REPLY_TOO_MUCH_RESULTS: '検索結果が多すぎます！\nもっと具体的な名前を入力してください',

  // 動的な返信メッセージ
  REPLY_SEARCH_SEPARATION_RESULT: (name, label, notice) => `【${name}】${label}${!notice ? `\n\n🚮 ${notice}` : ''}`,
  REPLY_SEARCH_SEPARATION_RESULTS: (data) => data.map((item) => `【${item.name}】${item.label}${item.notice ? `\n\n🚮 ${item.notice}` : ''}`),
  REPLY_SEPARATION_NOT_FOUND: (name) => `【${name}】は分別方法が登録されていません\n\n似た単語でお試しください\n\nひらがななどで検索しなおすと見つかるかもしれません`,

  // ステータス
  STATUS_NONE: 0,   // 会話をしていない
  STATUS_INIT_SEARCH_SEPARATION: 1,   // 分別方法検索が初期化された
  // 分別方法検索
  STATUS_RESULT_NOT_FOUND: 'STATUS_RESULT_NOT_FOUND',
  STATUS_TOO_MUCH_RESULTS: 'STATUS_TOO_MUCH_RESULTS',

  // エラーステータス
  USER_NOT_FOUND: -1,   // ユーザーが見つからなかった
};
