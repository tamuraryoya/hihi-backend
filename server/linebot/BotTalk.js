import async from 'async';
import Database from '../database';
import Request from '../request';
import C from '../constants';

class BotTalk {
  /**
   * 会話の内容を判定するエンドポイント
   * @param  {string} userId ユーザーId
   * @param  {string} text メッセージ
   * @return {Object}
   */
  static talk(userId, text) {
    return new Promise((resolve, reject) => {
      const result = {
        isSuccess: true,
        messages: []
      }

      async.waterfall([
        // ユーザーの状態を取得
        (callback) => {
          Database.getUserStatus(userId)
            .then((status) => {
              callback(null, status);
            })
            .catch(callback);
        },
        // ステータスから処理を振り分ける
        (status, callback) => {
          // エラー判定
          if (status < 0) {
            callback();
            return;
          }

          // 処理を振り分け
          switch (status) {
            // 分別検索が初期化されていれば入力内容で分別方法を検索
            case C.STATUS_INIT_SEARCH_SEPARATION:
              Request.searchSeparation(text)
                .then((response) => {
                  if (!response.isFound) {
                    // 分別方法が見つからなかった
                    result.messages = [C.REPLY_SEPARATION_NOT_FOUND(response.itemName)];
                    resolve(result);
                  } else {
                    // 分別方法が見つかった
                    // ユーザーのステータスを更新する
                    Database.resetUserStatus(userId)
                      .then(() => {
                        result.messages = [C.REPLY_SEARCH_SEPARATION_RESULT(response.itemName, response.separation)];
                        resolve(result);
                      })
                      .catch(callback);
                  }
                })
                .catch(callback);
              return;
            // 不正な入力
            default:
              callback();
          }
        }
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            isSuccess: false
          });
        }
      });
    });
  }
}

export default BotTalk;
