import async from 'async';
import sqlite3 from 'sqlite3';
import path from 'path';
import C from '../constants';

class Database {
  /**
   * @constructor
   */
  constructor() {
    this.db = new sqlite3.Database(path.resolve('db.sqlite3'));

    // データベースを初期化
    this.init();
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
            resolve(err);
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
}

export default Database;
