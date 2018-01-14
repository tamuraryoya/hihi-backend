import async from 'async';
import Database from '../database';
import Request from '../request';
import Util from '../utilities';
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
            case C.STATUS_INIT_SEARCH_SEPARATION: {
              Database.separation.search.all(text)
                .then((response) => {
                  switch (response.state) {
                    // 分別方法が見つからなかった
                    case C.STATUS_RESULT_NOT_FOUND:
                      // データベースへログを反映
                      Database.log.insert(text, 0)
                        .then(() => {
                          // リプライを送る
                          result.messages = [C.REPLY_SEPARATION_NOT_FOUND(text)];
                          resolve(result);
                        })
                        .catch(callback);
                      break;
                    // 検索結果が多すぎる
                    case C.STATUS_TOO_MUCH_RESULTS:
                      // データベースへログを反映
                      Database.log.insert(text, 2)
                        .then(() => {
                          result.messages = [C.REPLY_TOO_MUCH_RESULTS(text, response.count)];
                          resolve(result);
                        })
                        .catch(callback);
                      break;
                    // 検索成功
                    default:
                      // データベースへログを反映
                      Database.log.insert(text, 1)
                        .then(() => {
                          // ユーザーのステータスを更新する
                          result.messages = C.REPLY_SEARCH_SEPARATION_RESULTS(text, response.data);
                          resolve(result);
                        })
                        .catch(callback);
                      break;
                  }
                })
                .catch(callback);
              return;
            }
            // 地区登録が初期化されて入れば入力内容で地区を登録する
            case C.STATUS_INIT_SETTING_DISTRICT: {
              Util.findDistrict(text)
                .then((response) => {
                  if (response.success) {
                    async.waterfall([
                      // 地区をユーザーに登録する
                      (step) => {
                        Database.updateUserDistrict(userId, response.district)
                          .then(step)
                          .catch(step);
                      },
                      // ユーザーのステータスをリセットさせる
                      (step) => {
                        Database.resetUserStatus(userId)
                          .then(step)
                          .catch(step);
                      }
                    ], (err) => {
                      if (err) {
                        callback(err);
                      } else {
                        result.messages = [C.REPLY_SETTING_DISTRICT_RESULT(response.district)];
                        resolve(result);
                      }
                    });
                  } else {
                    result.messages = [C.REPLY_SETTING_DISTRICT_ERROR];
                    resolve(result);
                  }
                })
                .catch(callback);
              return;
            }
            // 不正な入力
            default: {
              callback();
            }
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
