import C from '../../constants';

export default class Search {
  /**
   * @constructor
   */
  constructor (db) {
    this.db = db;
  }

  /**
   * 全体から検索する
   */
  all (input, max = 10) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        const words = input.split(/ |　/).map((item) => `%${item}%`);

        const sql = `
          SELECT
            trush.name as name,
            separation.name as label,
            notice.message as notice,
            trush.modified_at as timestamp
          FROM trush
            INNER JOIN separations ON trush.separation_id = separations.id
            INNER JOIN separation_abstracts as separation ON separations.separation_id = separation.id
            LEFT OUTER JOIN notice_abstracts as notice ON separations.notice_id = notice.id
          WHERE (
        ` + words.map(() => {
          return 'trush.name LIKE ?';
        }).join(' AND ') + ' ) OR ( ' + words.map(() => {
          return 'trush.furigana LIKE ?';
        }).join(' AND ') + ' )';

        this.db.all(sql, ...words, ...words, (err, rows) => {
          if (err) {
            return reject(err);
          }

          // 回答が見つからなかった
          if (rows.length === 0) {
            resolve({
              state: C.STATUS_RESULT_NOT_FOUND
            });
            return;
          }

          // 見つかった回答が多すぎる
          if (max > 0 && rows.length >= max) {
            resolve({
              state: C.STATUS_TOO_MUCH_RESULTS,
              count: rows.length
            });
            return;
          }

          resolve({
            state: C.SUCCESS,
            data: rows
          });
        });
      });
    });
  }

  /**
   * 分別方法を分別IDと備考IDから取得
   */
  separation (separationId, noticeId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.get('SELECT * FROM separations WHERE separation_id = ? AND notice_id = ?', separationId, noticeId, (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        });
      });
    });
  }
}
