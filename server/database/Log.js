import async from 'async';
import moment from 'moment';
import _ from 'lodash';
import C from '../constants';

class Log {
  /**
   * @constructor
   */
  constructor (db) {
    this.db = db;

    // データベースを初期化
    this.init();
  }

  /**
   * データベースを初期化する
   */
  init () {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 識別子、プライマリーキー
          type INTEGER DEFAULT 1, -- ログの種類（分別方法がある or ない）
          trush_name TEXT,  -- ごみの名前
          created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime'))  -- レコードの作成日時
        )
      `, (err) => {
        if (err) {
          throw new Error('データベースを初期化中にエラーが発生しました');
        }
        console.log('データベースを初期化しました（logs）'); // eslint-disable-line no-console
      });
    });
  }

  /**
   * ログを追加する
   * @param {string} trushName ゴミの名前
   * @param {number} type 分別方法が登録されているかどうか
   */
  insert (trushName, type = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('INSERT INTO logs (type, trush_name) VALUES (?, ?)', type, trushName, (err) => {
          // エラーがある場合はreject
          if (err) {
            return reject(err);
          }
          // 処理を終了
          resolve();
        });
      });
    });
  }

 insert_date (trushName, datetime, type = 1) {
   return new Promise((resolve, reject) => {
     this.db.serialize(() => {
       this.db.run('INSERT INTO logs (type, trush_name, created_at) VALUES (?, ?, ?)', type, trushName, datetime, (err) => {
         // エラーがある場合はreject
         if (err) {
           return reject(err);
         }
         // 処理を終了
         resolve();
       });
     });
   });
 }

  /**
   * 問い合わせカウントを回す
   * @param {string} trushName ごみの名前
   * @param {number} type 分別方法が登録されているかどうか (0 / 1)
   */
  updateCount (trushName, type = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        async.waterfall([
          // レコードが存在しなければ作成
          (callback) => {
            this.db.get('SELECT * FROM logs WHERE trush_name = ?', trushName, (err, row) => {
              // エラーがあるか、レコードが存在すればcallback
              if (err || row) {
                return callback(err);
              }

              // レコードを追加
              this.db.run('INSERT INTO logs (type, trush_name) VALUES (?, ?)', type, trushName, (err) => {
                // エラーがあるときはcallback
                if (err) {
                  return callback(err);
                }
                // 処理を終了
                resolve();
              });
            });
          },
          // カウントを回す
          (callback) => {
            this.db.run('UPDATE logs SET count = count + 1, modified_at = DATETIME("now", "localtime") WHERE trush_name = ?', trushName, (err) => {
              if (err) {
                return callback(err);
              }
              // 処理を終了
              resolve();
            });
          }
        ], (err) => {
          reject(err);
        });
      });
    });
  }

  /**
   * ログを検索ワードの件数の配列に直す
   * @type {array} logs ログの配列
   */
  convertLog (logs) {
    const results = [];

    logs.forEach((log) => {
      const i = results.findIndex(result => log.trush_name === result.trushName);
      // ごみが既に存在しなければ追加
      if (i === -1) {
        results.push({
          type: log.type,
          trushName: log.trush_name,
          count: 1,
          timestamp: log.created_at
        });
        return;
      }

      // ゴミが存在すればcountをインクリメント
      results[i].count ++;
    });

    return results;
  }

  /**
   * 回答済みのログを取得
   */
  fetchAnsweredLog () {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.all('SELECT type, trush_name, created_at FROM logs WHERE type = 1', (err, rows) => {
          if (err) {
            return reject(err);
          }

          // 各検索ワードの件数をまとめる
          resolve(this.convertLog(rows));
        });
      });
    });
  }

  /**
   * 未回答のログを取得
   */
  fetchUnansweredLog () {
    return new Promise((resolve ,reject) => {
      this.db.serialize(() => {
        this.db.all('SELECT type, trush_name, created_at FROM logs WHERE type != 1', (err, rows) => {
          if (err) {
            return reject(err);
          }

          // 各検索ワードの件数をまとめる
          resolve(this.convertLog(rows));
        });
      });
    });
  }

  /**
   * ログのタイムラインを取得
   * @param {number} days 日数
   */
  fetchTimeline (days = 30) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        const results = [];

        async.each(_.range(0, days, 1), (i, callback) => {
          const date = moment().subtract(i, 'days').format('YYYY-MM-DD');

          async.parallel([
            // 回答済みの問い合わせを取得
            (callback) => {
              this.db.get(`SELECT COUNT(*) FROM logs WHERE created_at LIKE "${date}%" AND type = 1`, (err, row) => {
                callback(err, row && row['COUNT(*)']);
              });
            },
            // 未回答の問い合わせを取得
            (callback) => {
              this.db.get(`SELECT COUNT(*) FROM logs WHERE created_at LIKE "${date}%" AND (type = 2 OR type = 0)`, (err, row) => {
                callback(err, row['COUNT(*)']);
              });
            }
          ], (err, count) => {
            if (err) {
              return callback(err);
            }

            results.push({
              date,
              count
            });
            callback();
          });
        }, (err) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    });
  }
}

export default Log;
