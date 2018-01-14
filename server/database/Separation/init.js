import async from 'async';
import C from '../../constants';

/**
 * データベースを初期化する
 * @param {object} db データベースのインスタンス
 * @return {Promise}
 */
export default function init (db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 各データベースのテーブルを作成
      async.parallel([
        // 抽象Separationテーブル
        (callback) => {
          db.run(`
            CREATE TABLE IF NOT EXISTS separation_abstracts (
              id INTEGER PRIMARY KEY AUTOINCREMENT, -- 識別子
              active INTEGER, -- 有効かどうか (0/1)
              name STRING UNIQUE, -- 分別の名前、ユニーク
              register STRING DEFAULT '${C.SYSTEM}', -- 登録者
              modifier STRING DEFAULT '${C.SYSTEM}', -- 更新者
              created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')), -- 作成日時
              modified_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')) -- 更新日時
            )
          `, callback);
        },
        // 抽象Noticeテーブル
        (callback) => {
          db.run(`
            CREATE TABLE IF NOT EXISTS notice_abstracts (
              id INTEGER PRIMARY KEY AUTOINCREMENT, -- 識別子
              active INTEGER, -- 有効かどうか (0/1)
              message STRING UNIQUE, -- メッセージ、ユニーク
              register STRING DEFAULT '${C.SYSTEM}', -- 登録者
              modifier STRING DEFAULT '${C.SYSTEM}', -- 更新者
              created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')), -- 作成日時
              modified_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')) -- 更新日時
            )
          `, callback);
        },
        // Separationテーブル
        (callback) => {
          db.run(`
            CREATE TABLE IF NOT EXISTS separations (
              id INTEGER PRIMARY KEY AUTOINCREMENT, -- 識別子
              active INTEGER, -- 有効かどうか (0/1)
              separation_id INTEGER, -- 分別方法のID
              notice_id INTEGER, -- 注意事項のID
              register STRING DEFAULT '${C.SYSTEM}', -- 登録者
              modifier STRING DEFAULT '${C.SYSTEM}', -- 更新者
              created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')), -- 作成日時
              modified_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')) -- 更新日時
            )
          `, callback);
        },
        // Trushテーブル
        (callback) => {
          db.run(`
            CREATE TABLE IF NOT EXISTS trush (
              id INTEGER PRIMARY KEY AUTOINCREMENT, -- 識別子
              active INTEGER, -- 有効かどうか (0/1)
              name STRING UNIQUE, -- ごみの名前、ユニーク
              furigana STRING, -- ごみのふりがな
              separation_id INTEGER, -- 分別方法のID
              parent_id INTEGER, -- 親のごみID
              register STRING DEFAULT '${C.SYSTEM}', -- 登録者
              modifier STRING DEFAULT '${C.SYSTEM}', -- 更新者
              created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')), -- 作成日時
              modified_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime')) -- 更新日時
            )
          `, callback);
        }
      ], (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}
