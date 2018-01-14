/* eslint-disable */
import async from 'async';
import fs from 'fs';
import path from 'path';
import Database from '../server/database';
import init from '../server/database/Separation/init';
import C from '../server/constants';

const data = JSON.parse(fs.readFileSync(path.resolve('mock/opendata.json'))).data;
const db = Database.db;

const separations = [];

/**
 * システムによって登録されたレコードを削除
 */
async.waterfall([
  // separation_abstractsをクリア
  (callback) => {
    db.serialize(() => {
      db.run('DELETE FROM separation_abstracts WHERE modifier = ?', C.SYSTEM, callback);
    });
  },
  // notice_abstractsをクリア
  (callback) => {
    db.serialize(() => {
      db.run('DELETE FROM notice_abstracts WHERE modifier = ?', C.SYSTEM, callback);
    });
  },
  // separationsをクリア
  (callback) => {
    db.serialize(() => {
      db.run('DELETE FROM separations WHERE modifier = ?', C.SYSTEM, callback);
    });
  },
  // trushをクリア
  (callback) => {
    db.serialize(() => {
      db.run('DELETE FROM trush WHERE modifier = ?', C.SYSTEM, callback);
    });
  }
], (err) => {
  // ここまででエラーがあったら処理を中止
  if (err) {
    console.error('データベースをクリアする途中で問題が発生しました'); // eslint-disable-line
    throw new Error(err);
  }

  // エラーがなければ登録する
  async.each(data, (item, callback) => {
    async.waterfall([
      // 抽象的な分別種別を登録する
      (callback) => {
        Database.separation.add
          .separationAbstract(item.label)
          .then(console.log(`separation_abstracts: Add "${item.label}"`) || callback)
          .catch(err => console.log(`separation_abstracts: Skip "${item.label}"`) || callback());
      },
      // 抽象的な注意事項を追加する
      (callback) => {
        item.notice = item.notice.replace(/^【(.+)】/g, (matches, match) => {
          if (match === item.label) {
            return '';
          }
          return matches;
        });

        if (!item.notice) {
          console.log(`notice_abstracts: Empty notice`);
          return callback();
        }

        Database.separation.add
          .noticeAbstract(item.notice)
          .then(console.log(`notice_abstracts: Add "${item.notice}"`) || callback)
          .catch(err => console.log(`notice_abstracts: Skip "${item.notice}"`) || callback());
      },
      // 分別方法を追加する
      (callback) => {
        async.parallel([
          // 分別種別IDを取得
          (step) => {
            db.get('SELECT * FROM separation_abstracts WHERE name = ?', item.label, (err, row) => {
              step(err, row && row.id);
            });
          },
          // 注意事項IDを取得
          (step) => {
            if (!item.notice) {
              return step();
            }

            db.get('SELECT * FROM notice_abstracts WHERE message = ?', item.notice, (err, row) => {
              step(err, row && row.id);
            });
          }
        ], (err, results) => {
          const separationId = results[0];
          const noticeId = results[1] || -1;

          // 既に存在を判定
          if (separations.find((item) => item.separationId === separationId && item.noticeId === noticeId)) {
            console.log(`separations: Exists ${item.label}`);
            return callback(null, separationId, noticeId);
          }

          // ログに保存
          separations.push({
            separationId,
            noticeId
          });

          Database.separation.add
            .separation(separationId, noticeId)
            .then(() => console.log(`separations: Add ${item.label}`) || callback(null, separationId, noticeId))
            .catch(err => console.log(`separations: Failure ${item.label}\n${err}`) || callback(null, separationId, noticeId));
            // .then(() => step(null, separationId, noticeId)).catch(err => step(null, separationId, noticeId));
        });
      },
      // ごみを追加する
      (separationId, noticeId, callback) => {
        async.waterfall([
          (callback) => {
            db.serialize(() => {
              db.get('SELECT * FROM separations WHERE separation_id = ? AND notice_id = ?', separationId, noticeId, (err, row) => {
                callback(err, row && row.id);
              });
            });
          },
          (separationId, callback) => {
            Database.separation.add
              .trush(item.name, item.furigana, separationId)
              .then(console.log(`trush: Add ${item.name}`) || callback)
              .catch(err => console.log(`trush: Failure ${item.name}\n${err}`) || callback());
              // .then(callback).catch(err => callback());
          }
        ], callback);
      }
    ], console.log(`Complete ${item.name}`) || callback);
  }, (err) => {
    if (err) {
      console.warn('データの登録中にエラーが発生しました');
      throw new Error(err);
    }
    console.log('全て成功しました');
  });
});
