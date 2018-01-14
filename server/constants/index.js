import SCHOOL_LIST from './school-list';

const isDev = process.env.NODE_ENV !== 'production'; // eslint-disable-line no-unused-vars

function findSchool(id) {
  return SCHOOL_LIST.find((school) => {
    return school.id == id;
  });
}

export default {
  // 校区リスト
  SCHOOL_LIST,

  // 曜日リスト
  DAY_OF_WEEK_JA: ['日', '月', '火', '水', '木', '金', '土'],

  // 定数
  SYSTEM: 'SYSTEM',

  // 受信メッセージ
  // MESSAGE_INIT_SCHEDULE: '明日は何ゴミ？',
  MESSAGE_INIT_SCHEDULE: '回収スケジュール',
  MESSAGE_INIT_SEPARATION: '分別をしらべる',
  MESSAGE_INIT_SETTING_DISTRICT: '地区を設定',

  // 返信メッセージ
  REPLY_WHAT_KIND_OF_TRASH: '🤔 どんなものですか？',
  REPLY_SYSTEM_ERROR: '😵 システムエラーが発生しました',
  REPLY_ERROR_NOT_A_STRING: '😪 文字以外のメッセージには回答することができません！',
  REPLY_ERROR_INVALID_MESSAGE: '😣 不正な入力です！\n-----\n\n下部のメニューから選択してください\n\n-----',
  REPLY_NOTICE_ENTER_DISTRICT: '🗺 住所・郵便番号のいずれかを入力してください\n-----\n\n✔️ 住所は丁目・字まで入力してください\n\n✔️ 郵便番号は半角数字で入力してください\n\n✔️ 宇部市以外の住所・郵便番号は使用できません\n\n-----',
  REPLY_SETTING_DISTRICT_ERROR: '👻 地域を更新できませんでした\n-----\n\n以下のような原因が考えられます\n\n✔️ 住所が正しく入力されなかった\n\n✔️ 郵便番号は半角数字ではない\n\n✔️ 住所を丁目・字まで入力していない\n\n✔️ 宇部市の住所ではない \n\n-----',

  // 動的な返信メッセージ
  // REPLY_SEARCH_SEPARATION_RESULT: (name, label, notice) => `\n【 ${name} 】${label}${!notice ? `\n\n\n🚮 ${notice.replace(/　/g, '\n\n　')}\n` : '\n'}`,
  REPLY_SEARCH_SEPARATION_RESULTS: (input, data) => [(
    `「${input}」\n😉 ${data.length}件ヒット\n-----\n\n` +
    data.map((item) => (
      `${item.name}\n🚮 ${item.label}\n` +
      ( item.notice ? `✅ ${item.notice}\n` : '' ) +
      '\n'
    )).join('\n') +
    '-----'
  )],
  REPLY_TOO_MUCH_RESULTS: (input, count) => `「${input}」\n😫 ${count}件ヒット\n-----\n\n検索結果が多すぎます！\nもっと具体的に入力してください\n\n-----`,
  // '検索結果が多すぎます！\nもっと具体的な名前を入力してください',
  REPLY_SEPARATION_NOT_FOUND: (name) => `「${name}」\n😳 0件ヒット\n----\n\n分別方法が登録されていません\n似た単語でお試しください\n\nひらがななどで検索しなおすと見つかるかもしれません\n\n-----`,
  REPLY_CURRENT_DISTRICT: (district) => {
    if (district) {
      const school = findSchool(district);
      return `🏠 お住まいの地域は 【 ${school.name} 】 に設定されています`;
    } else {
      return '🏝　お住まいの地域が設定されていません';
    }
  },
  REPLY_SETTING_DISTRICT_RESULT: (district) => {
    const school = findSchool(district);
    return `🎉 地域を 【 ${school.name} 】 に設定しました`;
  },
  REPLY_SCHEDULE_CAUTION: '⚠️ このスケジュールは2017年のものです',
  REPLY_SCHEDULE_TODAY: (items) => '今日 回収のごみは' + (items.length > 0 ? `\n\n・ ${items.join('\n ・ ')}  です` : 'ありません'),
  REPLY_SCHEDULE_TOMORROW: (items) => '明日 回収のごみは' + (items.length > 0 ? `\n\n・ ${items.join('\n ・ ')}  です` : 'ありません'),

  // ごみの種類
  BURNABLE_GARBAGE: 1,  // 燃やせるゴミ
  BURNABLE_GARBAGE_WEEK: 11,  // 燃やせるゴミ（曜日）
  PLASTIC_GARBAGE: 2,  // プラスチック製容器梱包
  PLASTIC_GARBAGE_WEEK: 12,  // プラスチック製容器梱包（曜日）
  UNBURNABLE_GARBAGE: 3,  // 燃やせないゴミ
  UNBURNABLE_GARBAGE_WEEK: 13,  // 燃やせないゴミ（曜日）
  USED_PAPER: 4,  // 古紙・紙製容器梱包
  USED_PAPER_WEEK: 14,  // 古紙・紙製容器梱包（曜日）

  // ごみの対照表
  GARBAGE_LIST: ['燃やせるごみ', 'プラスチック製容器梱包', '燃やせないゴミ', '古紙・紙製容器梱包'],

  // 日付の種類
  DATE_TYPE_DATE: 1,
  DATE_TYPE_DAY_OF_WEEK: 2,

  // ステータス
  STATUS_NONE: 0,   // 会話をしていない
  STATUS_INIT_SEARCH_SEPARATION: 1,   // 分別方法検索が初期化された
  // 分別方法検索
  STATUS_RESULT_NOT_FOUND: 'STATUS_RESULT_NOT_FOUND',
  STATUS_TOO_MUCH_RESULTS: 'STATUS_TOO_MUCH_RESULTS',
  // 校区設定
  STATUS_INIT_SETTING_DISTRICT: 'STATUS_INIT_SETTING_DISTRICT',

  // 成功ステータス
  SUCCESS: 1,

  // エラーステータス
  USER_NOT_FOUND: -1,   // ユーザーが見つからなかった
};
