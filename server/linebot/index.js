import async from 'async';
import express from 'express';
import apikeys from '../../secret/apikeys';
import LineApi from './LineApi';
import Bot from './Bot';
import C from '../constants';

class LineBot {
  constructor() {
    // Line APIを初期化
    LineApi.init(apikeys.line);
  }

  /**
   * Lineからのメッセージを受信する
   */
  webhook() {
    const router = express.Router();

    router.post('/', LineApi.validateSignature(), (req, res) => {
      async.each(req.body.events, (event, callback) => {
        const { replyToken } = event;
        const userId = event.source.userId;
        const message = event.message;

        // メッセージを受信したら内容を判別する
        Bot.receiveMessage(userId, message)
          .then((messages) => {
            // 成功したらリプライメッセージを送信する
            LineApi.replyMessage(messages, replyToken, callback);
          })
          .catch((err) => { // eslint-disable-line no-unused-vars
            console.error(err);

            // 失敗したらエラーメッセージを送信する
            LineApi.replyMessage([C.REPLY_SYSTEM_ERROR], replyToken, callback);
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
}

export default LineBot;
