import request from 'superagent';

class Request {
  /**
   * 開発・本番でURLを切り替える
   * @param {string} path APIの絶対パス（/はじめ）
   */
  url(path) {
    const baseUrl = process.env.NODE_ENV === 'production' ?
      '//api.ube-gomi.net' :
      '//localhost:8000';
    return `${baseUrl}${path}`;
  }

  /**
   * 分別方法をサーバーから取得
   * @param  {string} itemName アイテム名
   */
  searchSeparation(itemName) {
    return new Promise((resolve, reject) => {
      resolve({
        itemName,
        separation: '燃えるゴミ'
      });
      return;
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

            // 分別方法が見つからなかった
            if (res.body.state === -1) {
              reject();
              return;
            }

            // 分別方法が見つかったので返却
            resolve({
              itemName: res.body.data.itemName,
              separation: res.body.data.separation
            });
        });
    });
  }
}

export default Request;
