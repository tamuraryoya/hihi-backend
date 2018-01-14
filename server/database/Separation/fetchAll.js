import async from 'async';

export default function fetchAll (db) {
  return () => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        async.parallel([
          // 抽象分別テーブル
          (callback) => {
            db.all(`
              SELECT
                id,
                active,
                name,
                register,
                modifier,
                created_at as created,
                modified_at as modified
              FROM separation_abstracts
            `, (err, rows) => {
              callback(err, rows);
            });
          },
          // 抽象注意事項テーブル
          (callback) => {
            db.all(`
              SELECT
                id,
                active,
                message,
                register,
                modifier,
                created_at as created,
                modified_at as modified
              FROM notice_abstracts
            `, (err, rows) => {
              callback(err, rows);
            });
          },
          // 分別テーブル
          (callback) => {
            db.all(`
              SELECT
                id,
                active,
                separation_id as separationId,
                notice_id as noticeId,
                register,
                modifier,
                created_at as created,
                modified_at as modified
              FROM separations
            `, (err, rows) => {
              callback(err, rows);
            });
          },
          // 抽象分別テーブル
          (callback) => {
            db.all(`
              SELECT
                id,
                active,
                name,
                furigana,
                separation_id as separationId,
                parent_id as parentId,
                register,
                modifier,
                created_at as created,
                modified_at as modified
              FROM trush
            `, (err, rows) => {
              callback(err, rows);
            });
          }
        ], (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve({
            abstract: {
              separations: data[0],
              notices: data[1]
            },
            separations: data[2],
            trush: data[3]
          });
        });
      });
    });
  };
}
