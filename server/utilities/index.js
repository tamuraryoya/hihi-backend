import async from 'async';
import request from 'superagent';
import 'node-easel';
import appkeys from '../../secret/apikeys';
import C from '../constants';

const SCALE = 100000;

class Util {
  /**
   * 校区をキーワードから検索する
   * @param  {string} keyword キーワード
   */
  static findDistrict(keyword) {
    return new Promise((resolve, reject) => {
      async.waterfall([
        // YahooAPIから座標を取得
        (callback) => {
          if (/^\d{3}-?\d{4}$/.test(keyword)) {
            // 郵便番号の場合
            const zip = keyword.replace(/-/g, '');

            request
              .get('https://map.yahooapis.jp/search/zip/V1/zipCodeSearch')
              .query({
                appid: appkeys.yahoo.appid,
                output: 'json',
                query: zip
              })
              .end((err, res) => {
                if (err) {
                  return callback(err);
                }
                callback(null, res.body);
            });
          } else {
            // 住所の頭に宇部市・山口県宇部市がなければ宇部市を追加
            if (!/^(山口県)?宇部市/.test(keyword)) {
              keyword = `宇部市${keyword}`;
            }

            // 郵便番号以外の場合
            request
              .get('https://map.yahooapis.jp/geocode/V1/geoCoder')
              .query({
                appid: appkeys.yahoo.appid,
                output: 'json',
                query: keyword
              })
              .end((err, res) => {
                if (err) {
                  return callback(err);
                }
                callback(null, res.body);
              });
          }
        },
        // レスポンスデータを整形する
        (results, callback) => {
          // 結果が存在しなかった
          if (results.ResultInfo.Count === 0) {
            return resolve({
              success: false
            });
          }

          const result = results.Feature[0];

          // 住所が宇部市ではなかった
          if (!/^山口県宇部市/.test(result.Property.Address)) {
            return resolve({
              success: false
            });
          }

          // 住所の粒度が低かった
          if (result.Property.AddressMatchingLevel < 4) {
            return resolve({
              success: false
            });
          }

          // 緯度経度を整形して渡す
          const latlng = result.Geometry.Coordinates.split(',');
          callback(null, {
            latitude: parseFloat(latlng[1]),
            longitude: parseFloat(latlng[0])
          });
        },
        // 校区を判定する
        (latlng, callback) => {
          async.each(C.SCHOOL_LIST, (school, step) => {
            const shape = new createjs.Shape(); // eslint-disable-line no-undef
            shape.graphics.beginFill('black');

            school.points.forEach((point, i) => {
              if (i === 0) {
                shape.graphics.moveTo(point.latitude * SCALE, point.longitude * SCALE);
              } else {
                shape.graphics.lineTo(point.latitude * SCALE, point.longitude * SCALE);
              }
            });

            // 当たり判定
            if (shape.hitTest(latlng.latitude * SCALE, latlng.longitude * SCALE)) {
              return callback(null, school.id);
            }

            step();
          }, () => {
            // 所属する校区が存在しなかった
            return resolve({
              success: false
            });
          })
        }
      ], (err, district) => {
        if (err) {
          return reject(err);
        }
        resolve({
          success: true,
          district
        });
      });
    });
  }
}

export default Util;
