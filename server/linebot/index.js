import async from 'async';
import express from 'express';
import line from 'node-line-bot-api';
import apikeys from '../../secret/apikeys';
import LineApi from './LineApi';
import Bot from './Bot';
import C from '../constants';

class LineBot {
  constructor() {
    // Line APIを初期化
    LineApi.init(process.env.NODE_ENV === 'production' ? apikeys.product : apikeys.develop);
  }

  /**
   * Lineからのメッセージを受信する
   */
  webhook() {
    const router = express.Router();

    router.post('/', line.validator.validateSignature(), (req, res) => {
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
            if (err) {
              callback(err);
            } else {
              // 失敗したらエラーメッセージを送信する
              LineApi.replyMessage([C.REPLY_SYSTEM_ERROR], replyToken, callback);
            }
          });
      }, (err) => {
        if (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(err); // eslint-disable-line no-console
          }
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
