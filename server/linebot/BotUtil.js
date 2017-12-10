import Database from '../database';
import C from '../constants';

class BotUtil {
  /**
   * 初期化メッセージかどうかを判定
   * @param {string} userId ユーザーのID
   * @param {string} text メッセージ
   * @return {Object}
   */
  static initMessage(userId, text) {
    return new Promise((resolve, reject) => {
      const result = {
        isInit: true,
        status: null,
        mesasges: null
      };

      switch (text) {
        // 分別検索の初期化
        case C.MESSAGE_INIT_SEPARATION:
          result.status = C.STATUS_INIT_SEARCH_SEPARATION;
          result.messages = [C.REPLY_WHAT_KIND_OF_TRASH];
          break;
        // 初期化メッセージではない
        default:
          resolve({
            isInit: false
          });
          return;
      }

      Database.setUserStatus(userId, result.status)
        .then(() => {
          resolve(result)
        })
        .catch(reject);
    });
  }
}

export default BotUtil;
