import C from '../../constants';

export default class Add {
  /**
   * @constructor
   */
  constructor (db) {
    this.db = db;
  }

  /**
   * 抽象的な分別種別を追加する
   */
  separationAbstract (name, register = C.SYSTEM, active = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          INSERT INTO separation_abstracts (
            active, name, register, modifier
          ) VALUES (
            ?, ?, ?, ?
          )
        `, active, name, register, register, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }

  /**
   * 抽象的な注意事項を追加する
   */
  noticeAbstract (message, register = C.SYSTEM, active = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          INSERT INTO notice_abstracts (
            active, message, register, modifier
          ) VALUES (
            ?, ?, ?, ?
          )
        `, active, message, register, register, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }

  /**
   * 分別方法を追加する
   */
  separation (separationId, noticeId, register = C.SYSTEM, active = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          INSERT INTO separations (
            active, separation_id, notice_id, register, modifier
          ) VALUES (
            ?, ?, ?, ?, ?
          )
        `, active, separationId, noticeId, register, register, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }

  /**
   * ごみと分別方法を追加する
   */
  trush (trushName, furigana, separationId, parentId = null, register = C.SYSTEM, active = 1) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          INSERT INTO trush (
            active, name, furigana, separation_id, parent_id, register, modifier
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?
          )
        `, active, trushName, furigana, separationId, parentId, register, register, (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }
}
