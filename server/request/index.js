import request from 'superagent';

class Request {
  /**
   * 開発・本番でURLを切り替える
   * @param {string} path APIの絶対パス（/はじめ）
   */
  static url(path) {
    const baseUrl = process.env.NODE_ENV === 'production' ?
      // '//api.hihi.work' :
      'http://localhost:8081' :
      'http://localhost:8081';
    return `${baseUrl}${path}`;
  }

  /**
   * 分別方法をサーバーから取得
   * @param  {string} itemName アイテム名
   */
  static searchSeparation(itemName) {
    return new Promise((resolve, reject) => {
      request
        .get(this.url('/trush/separation'))
        .query({
          itemName
        })
        .end((err, res) => {
            if (err) {
              reject(err);
              return;
            }

            // 結果を返却
            resolve(res.body);
        });
    });
  }
}

export default Request;
