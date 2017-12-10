import async from 'async';
import express from 'express';
import line from 'node-line-bot-api';
import apikeys from '../../secret/apikeys';
import Database from '../database';
import Request from '../request';
import C from '../constants';

class LineBot {
  constructor() {
    // Line APIを初期化
    line.init(apikeys.line);

    this.database = new Database();
  }

  /**
   * Lineからのメッセージを受信する
   */
  webhook() {
    const router = express.Router();

    router.post('/', line.validator.validateSignature(), (req, res) => {
      async.each(req.body.events, (event, callback) => {
        const { replyToken } = event;

        // 文字以外のメッセージの場合はエラーを返信
        if (event.message.type !== 'text') {
          this.reply([
            C.REPLY_ERROR_NOT_A_STRING
          ], replyToken, callback);
          return;
        }

        const userId = event.source.userId;
        const message = event.message.text;

        // 初期化メッセージかを判定
        if (this.isInitMessage(message)) {
          this.initMessage(userId, message)
            .then((messages) => {
              this.reply(messages, replyToken, callback);
            })
            .catch((err) => {
              console.warn(err); // eslint-disable-line no-console
            });
          return;
        }

        this.interaction(userId, message)
          .then((messages) => {
            this.reply(messages, replyToken, callback);
          })
          .catch((err) => {
            this.reply([
              C.REPLY_SYSTEM_ERROR
            ], replyToken, callback);
          });
      }, (err) => {
        if (err) {
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    });

    return router;
  }

  /**
   * リプライを送信する
   * @param {Array<string>} messages 返信するメッセージの配列
   * @param {string} replyToken リプライトークン
   * @param {fn} [callback=() => {}] 返信後に実行する関数
   */
  reply(messages, replyToken, callback = () => {}) {
    line.client.replyMessage({
      replyToken,
      messages: messages.map((message) => {
        return {
          type: 'text',
          text: message
        }
      })
    });
    callback();
  }

  /**
   * 初期化メッセージかを判定
   * @param {string} message メッセージ
   */
  isInitMessage(message) {
    switch (message) {
      case C.MESSAGE_INIT_SEPARATION:
      case C.MESSAGE_INIT_SCHEDULE:
        return true;
      default:
        return false;
    }
  }

  /**
   * 会話を初期化
   * @param {string} userId ユーザーID
   * @param {string} message メッセージ
   * @param {string} replyToken リプライトークン
   */
  initMessage(userId, message) {
    return new Promise((resolve, reject) => {
      switch (message) {
        case C.MESSAGE_INIT_SEPARATION:
          this.database.setUserStatus(userId, C.STATUS_INIT_SEARCH_SEPARATION)
            .then(() => {
              resolve([
                C.REPLY_WHAT_KIND_OF_TRASH
              ]);
            })
            .catch(reject);
          return;
        default:
          resolve();
          return;
      }
    });
  }

  /**
   * 応答を生成する
   * @param {string} userId ユーザーID
   * @param {string} message メッセージ
   */
  interaction(userId, message) {
    return new Promise((resolve, reject) => {
      // ユーザーのステータスを取得
      this.database.getUserStatus(userId)
        .then((status) => {
          // ステータスによって処理を振り分け
          switch (status) {
            // アイテムの分別方法を問い合わせる
            case C.STATUS_INIT_SEARCH_SEPARATION:
              this.searchSeparation(message)
                // 分別方法が取得できた
                .then((itemName, separation) => {
                  resolve([
                    C.REPLY_SEARCH_SEPARATION_RESULT(itemName, separation)
                  ]);
                })
                .catch((err) => {
                  reject(err);
                });
              return;
            // どれにもマッチしない場合は不正な入力とみなす
            default:
              return;
          }
        });
    });
  }

  /**
   * 分別方法を検索する
   * @param {string} itemName アイテム名
   */
  searchSeparation(itemName) {
    return new Promise((resolve, reject) => {
      this.request.searchSeparation(itemName)
        .then((result) => {
          resolve(result.itemName, result.separation);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

export default LineBot;
