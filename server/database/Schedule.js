import async from 'async';
import moment from 'moment';
import C from '../constants';

class Schedule {
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
          CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 識別子、プライマリーキー
            district INTEGER,  -- 対象の地区ID
            type INTEGER DEFAULT 1,  -- 日付のタイプ 1: Date 2: Day of week
            date DATE,  -- 日付(YYYY-MM-DD) or 曜日ID
            garbage INTEGER,  -- ごみのID
            created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime'))  -- タイムスタンプ
          )
        `, (err) => {
          if (err) {
            throw new Error('データベースを初期化中にエラーが発生しました');
          }
          console.log('データベースを初期化しました (schedules)');
        });
    });
  }

  /**
   * 文字列から日付に変換する
   */
  convertStringToDate (input) {
    return input.split(/ +/).map((item) => {
      // 日付のフォーマットだったら日付として返す
      if (/^\d{8}/.test(item)) {
        return {
          type: C.DATE_TYPE_DATE,
          date: item.replace(/^(\d{4})(\d{2})(\d{2})/g, '$1-$2-$3')
        };
      }

      // 曜日かどうかを判定
      const dayOfWeek = C.DAY_OF_WEEK_JA.indexOf(item);

      if (dayOfWeek !== -1) {
        return {
          type: C.DATE_TYPE_DAY_OF_WEEK,
          date: dayOfWeek
        };
      }

      return null;
    })
    // nullの要素を取り除く
    .filter((item) => item);
  }

  /**
   * インデックスからごみIDに変換
   */
  getGarbageId (index) {
    switch (index) {
      // 燃やせるごみ
      case 2:
        return C.BURNABLE_GARBAGE;
      case 3:
        return C.PLASTIC_GARBAGE;
      case 4:
        return C.UNBURNABLE_GARBAGE;
      case 5:
        return C.USED_PAPER;
      default:
        return null;
    }
  }

  /**
   * スケジュールを更新する
   * @param {array} file スケジュールファイル
   */
  updateSchedule (file) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        async.waterfall([
          // スケジュールのデータベースを削除（一応）
          (callback) => {
            this.db.run('DELETE FROM schedules', (err) => {
              callback(err);
            });
          },
          // スケジュールを登録
          (callback) => {
            async.eachOf(file, (item, i, callback) => {
              // 地区を取得
              const district = C.SCHOOL_LIST.find((school) => school.name === item[0]);
              // 該当する地区がなければスキップする
              if (!district) {
                return callback();
              }

              // 地区を除いたデータで日付を登録する
              async.eachOf(item, (cell, j, callback) => {
                // ごみのIDを取得
                const garbage = this.getGarbageId(j);
                // ごみIDが見つからなければスキップ
                if (!garbage) {
                  return callback();
                }

                // 日付を配列に変換
                const dates = this.convertStringToDate(cell);

                async.each(dates, (date, callback) => {
                  const stmt = this.db.prepare('INSERT INTO schedules (district, type, date, garbage) VALUES (?, ?, ?, ?)');
                  stmt.run(district.id, date.type, date.date, garbage, (err) => {
                    stmt.finalize();
                    callback(err);
                  });
                }, (err) => {
                  callback(err);
                });
              }, (err) => {
                callback(err);
              });
            }, (err) => {
              callback(err);
            });
          }
        ], (err) => {
          if (err) {
            return reject(err);
          }
          resolve(err);
        });
      });
    });
  }

  /**
   * スケジュールをすべて取得する
   */
  fetchSchedule () {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.all('SELECT district, type, date, garbage FROM schedules', (err, rows) => {
          if (err) {
            return reject(err);
          }
          resolve(rows);
        });
      });
    });
  }

  /**
   * 明日のスケジュールを取得する
   * @param {number} district 地区ID
   */
  getSchedules (district) {
    return new Promise((resolve ,reject) => {
      this.db.serialize(() => {
        const result = {
          today: [],
          tomorrow: []
        };
        async.waterfall([
        // 今日の曜日から結果を取得
        (callback) => {
          const day = moment().day();
          this.db.each('SELECT garbage FROM schedules WHERE district = ? AND type = 2 AND date = ?', district, day, (err, row) => {
            result.today.push(row.garbage);
          }, (err) => {
            callback(err);
          });
        },
          // 今日の日付から結果を取得
          (callback) => {
            const date = moment().format('YYYY-MM-DD');
            this.db.each('SELECT garbage FROM schedules WHERE district = ? AND type = 1 AND date = ?', district, date, (err, row) => {

              result.today.push(row.garbage);
            }, (err) => {
              callback(err);
            });
          },
          // 明日の曜日から結果を取得
          (callback) => {
            const day = moment().add(1, 'day').day();
            this.db.each('SELECT garbage FROM schedules WHERE district = ? AND type = 2 AND date = ?', district, day, (err, row) => {
              result.today.push(row.garbage);
            }, (err) => {
              callback(err);
            });
          },
          // 明日の日付から結果を取得
          (callback) => {
            const date = moment().add(1, 'day').format('YYYY-MM-DD');
            this.db.each('SELECT garbage FROM schedules WHERE district = ? AND type = 1 AND date = ?', district, date, (err, row) => {
              result.tomorrow.push(row.garbage);
            }, (err) => {
              callback(err);
            });
          }
        ], (err) => {
          if (err) {
            return reject(err);
          }
          resolve({
            today: result.today.map((id) => this.convertTrushIdToName(id)),
            tomorrow: result.tomorrow.map((id) => this.convertTrushIdToName(id)),
          });
        });
      });
    });
  }

  /**
   * ごみIdからゴミの名前に変換
   * @param {number} id ごみのID
   */
  convertTrushIdToName (id) {
    switch (id) {
      case C.BURNABLE_GARBAGE:
      case C.BURNABLE_GARBAGE_WEEK:
        return '燃やせるごみ';
      case C.PLASTIC_GARBAGE:
      case C.PLASTIC_GARBAGE_WEEK:
        return 'プラスチック製容器梱包';
      case C.UNBURNABLE_GARBAGE:
      case C.UNBURNABLE_GARBAGE_WEEK:
        return '燃やせないごみ';
      case C.USED_PAPER:
      case C.USED_PAPER_WEEK:
        return '古紙・紙製容器梱包';
      default:
        return null;
    }
  }
}

export default Schedule;
