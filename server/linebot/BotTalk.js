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
                  switch (response.state) {
                    // 分別方法が見つからなかった
                    case C.STATUS_RESULT_NOT_FOUND:
                      result.messages = [C.REPLY_SEPARATION_NOT_FOUND(text)];
                      resolve(result);
                      break;
                    // 検索結果が多すぎる
                    case C.STATUS_TOO_MUCH_RESULTS:
                      result.messages = [C.REPLY_TOO_MUCH_RESULTS];
                      resolve(result);
                      break;
                    // 検索成功
                    default:
                      // ユーザーのステータスを更新する
                      Database.resetUserStatus(userId)
                        .then(() => {
                          result.messages = C.REPLY_SEARCH_SEPARATION_RESULTS(response.data);
                          resolve(result);
                        })
                        .catch(callback);
                      break;
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
