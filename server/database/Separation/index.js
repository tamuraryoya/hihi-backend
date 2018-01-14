import init from './init';
import Add from './Add';
import Search from './Search';
import fetchAll from './fetchAll';

class Separation {
  /**
   * @constructor
   */
  constructor (db) {
    this.db = db;

    // データベースを初期化
    init(this.db)
      .then(() => {
        console.log('データベースを初期化しました（ごみ／分別）'); // eslint-disable-line
      })
      .catch((err) => {
        console.error('データベースを初期化中にエラーが発生しました at ごみ／分別'); // eslint-disable-line
        throw new Error(err);
      });

    // 登録関係のメソッドを登録
    this.add = new Add(this.db);
    this.search = new Search(this.db);
    this.fetchAll = fetchAll(this.db);
  }
}

export default Separation;
