const isDev = process.env.NODE_ENV !== 'production'; // eslint-disable-line no-unused-vars

export default {
  // 受信メッセージ
  MESSAGE_INIT_SCHEDULE: '明日は何ゴミ？',
  MESSAGE_INIT_SEPARATION: '分別は？',

  // 返信メッセージ
  REPLY_WHAT_KIND_OF_TRASH: 'どんなものですか？',
  REPLY_SYSTEM_ERROR: 'システムエラーが発生しました',
  REPLY_ERROR_NOT_A_STRING: '文字列以外の入力です',
  REPLY_ERROR_INVALID_MESSAGE: '不正な入力です',

  // 動的な返信メッセージ
  REPLY_SEARCH_SEPARATION_RESULT: (itemName, separation) => `${itemName}は${separation}です`,
  REPLY_SEPARATION_NOT_FOUND: (itemName) => `${itemName}は分別方法が登録されていません`,

  // ステータス
  USER_NOT_FOUND: 'USER_NOT_FOUND'
};
