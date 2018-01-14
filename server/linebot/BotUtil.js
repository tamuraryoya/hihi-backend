import async from 'async';
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

      async.waterfall([
        (callback) => {
          switch (text) {
            // 分別検索の初期化
            case C.MESSAGE_INIT_SEPARATION:
              result.status = C.STATUS_INIT_SEARCH_SEPARATION;
              result.messages = [C.REPLY_WHAT_KIND_OF_TRASH];
              callback();
              break;
            // 地区設定の初期化
            case C.MESSAGE_INIT_SETTING_DISTRICT:
              Database.getUserDistrict(userId)
                .then((district) => {
                  result.status = C.STATUS_INIT_SETTING_DISTRICT;
                  result.messages = [
                    C.REPLY_CURRENT_DISTRICT(district),
                    C.REPLY_NOTICE_ENTER_DISTRICT
                  ];
                  callback();
                });
              return;
            // スケジュールを答える
            case C.MESSAGE_INIT_SCHEDULE:
              async.waterfall([
                // ユーザーの地区を取得
                (callback) => {
                  Database.getUserDistrict(userId)
                    .then((district) => {
                      callback(null, district);
                    })
                    .catch(callback);
                },
                // 今後のスケジュールを取得
                (district, callback) => {
                  Database.schedule.getSchedules(district)
                    .then((response) => {
                      result.status = C.STATUS_NONE;
                      result.messages = [
                        C.REPLY_SCHEDULE_CAUTION,
                        C.REPLY_SCHEDULE_TODAY(response.today),
                        C.REPLY_SCHEDULE_TOMORROW(response.tomorrow)
                      ];
                      callback();
                    })
                    .catch(callback);
                }
              ], (err) => {
                callback(err);
              });
              return;
            // 初期化メッセージではない
            default:
              resolve({
                isInit: false
              });
              return;
          }
        }
      ], () => {
        Database.setUserStatus(userId, result.status)
          .then(() => {
            resolve(result)
          })
          .catch(reject);
      });
    });
  }
}

export default BotUtil;
