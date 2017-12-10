import async from 'async';
import BotUtil from './BotUtil';
import BotTalk from './BotTalk';
import C from '../constants';

/**
 * ボットのメッセージのやりとりを主に行うクラス
 */
class Bot {
  /**
   * メッセージを受信したときに行う処理のエンドポイント
   * 返信メッセージを配列で返す
   * @param  {string} userId ユーザーのID
   * @param  {string} message メッセージ
   * @return {Promise}
   */
  static receiveMessage(userId, message) {
    return new Promise((resolve, reject) => {
      // 文字列以外の場合はエラーを返す
      if (message.type !== 'text') {
        resolve([C.REPLY_ERROR_NOT_A_STRING]);
        return;
      }

      const text = message.text;

      async.waterfall([
        // 初期化メッセージかを判定
        (callback) => {
          BotUtil.initMessage(userId, text)
            .then((result) => {
              if (result.isInit) {
                resolve(result.messages);
              } else {
                callback();
              }
            })
            .catch(callback);
        },
        (callback) => {
          BotTalk.talk(userId, text)
            .then((result) => {
              if (result.isSuccess) {
                resolve(result.messages);
              } else {
                callback();
              }
            })
            .catch(callback);
        }
      ], (err) => {
        if (err) {
          // エラーを返す
          reject(err);
        } else {
          // 不正な入力
          resolve([C.REPLY_ERROR_INVALID_MESSAGE]);
        }
      });
    });
  }
}

export default Bot;
