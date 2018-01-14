import async from 'async';
import sqlite3 from 'sqlite3';
import path from 'path';
import Schedule from './Schedule';
import Log from './Log';
import Separation from './Separation';
import C from '../constants';

class Database {
  /**
   * @constructor
   */
  constructor() {
    this.db = new sqlite3.Database(path.resolve('db.sqlite3'));

    // データベースを初期化
    this.init();

    // スケジュールのAPIを登録
    this.schedule = new Schedule(this.db);

    // 問い合わせログのAPIを登録
    this.log = new Log(this.db);

    // 分別のAPIを登録
    this.separation = new Separation(this.db);
  }

  /**
   * データベースを初期化する
   */
  init() {
    this.db.serialize(() => {
      this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,    -- LINEのユーザーID, プライマリーキー
            status INTEGER DEFAULT 0,    -- ユーザーの状態, 各ユーザーは一つの状態しか持たない
            district INTEGER,    -- ユーザーが所属する校区のID
            created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')),    -- アカウントの登録日時
            modified_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime'))   -- 更新日時
          )
        `, (err) => {
          if (err) {
            throw new Error('データベースを初期化中にエラーが発生しました');
          }
          console.log('データベースを初期化しました'); // eslint-disable-line no-console
        })
    });
  }

  /**
   * ユーザーの状態を設定する
   * @param {string} userId ユーザーID
   * @param {number} status 状態のコード
   */
  setUserStatus(userId, status) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        async.waterfall([
          (callback) => {
            // ユーザーが存在しない場合は追加
            this.registUser(userId, callback);
          },
          // ステータスを更新
          (callback) => {
            this.db.run('UPDATE users SET status = ?, modified_at = (DATETIME("now", "localtime")) WHERE id = ?', status, userId, (err) => {
              callback(err);
            });
          }
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  /**
   * ユーザーの状態を取得する
   * @param {string} userId ユーザーID
   */
  getUserStatus(userId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.get('SELECT status FROM users WHERE id = ?', userId, (err, row) => {
          // エラー
          if (err) {
            reject(err);
            return;
          }

          // ユーザーが存在しない
          if (!row) {
            resolve(C.USER_NOT_FOUND);
            return;
          }

          resolve(row.status);
        });
      });
    });
  }

  /**
   * ユーザーのステータスをリセットする
   * @param {string} userId ユーザーのID
   */
  resetUserStatus(userId) {
    return this.setUserStatus(userId, C.STATUS_NONE);
  }

  /**
   * ユーザーが存在しなければデータベースに登録する
   * @param {string} userId ユーザーID
   * @param {function} [callback=() => {}] コールバック
   */
  registUser(userId, callback = () => {}) {
    this.db.get('SELECT COUNT(*) FROM users WHERE id = ?', userId, (err, row) => {
      // ユーザーが見つからなければ登録
      if (!err && row['COUNT(*)'] === 0) {
        this.db.run('INSERT INTO users (id) VALUES (?)', userId, (err) => {
          callback(err);
        });
      } else {
        callback(err);
      }
    })
  }

  /**
   * ユーザーの地区を取得
   * @param {string} userId ユーザーID
   */
  getUserDistrict(userId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        async.waterfall([
          // ユーザーが存在しない場合は登録
          (callback) => {
            this.registUser(userId, callback);
          },
          // 地区を取得
          (callback) => {
            this.db.get('SELECT district FROM users WHERE id = ?', userId, (err, row) => {
              callback(err, row.district);
            });
          }
        ], (err, district) => {
          if (err) {
            reject(err);
          } else {
            resolve(district);
          }
        });
      });
    });
  }

  /**
   * ユーザーの地区を更新
   * @param {string} userId ユーザーID
   * @param {number} district 校区のID
   */
  updateUserDistrict (userId, district) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('UPDATE users SET district = ? WHERE id = ?', district, userId, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
}

export default new Database();
