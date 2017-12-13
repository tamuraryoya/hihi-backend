import line from 'node-line-bot-api';

class BotUtil {
  /**
   * Line Bot Apiを初期化する
   * @param  {Object} apikeys Apiキー
   * @return {any} Line APi
   */
  static init(apikeys) {
    line.init(apikeys);
    return line;
  }

  /**
   * インスタンスを取得する
   * @return {any} Line Apiのインスタンス
   */
  static getInsatnce() {
    return line;
  }

  /**
   * line.validator.validateSignature()のラッパ
   */
  static validateSignature() {
    return line.validator.validateSignature;
  }

  /**
   * リプライを送信する
   * @param {Array<string>} messages 返信するメッセージの配列
   * @param {string} replyToken リプライトークン
   * @param {fn} [callback=() => {}] 返信後に実行する関数
   */
  static replyMessage(messages, replyToken, callback = () => {}) {
    // リプライする
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
}

export default BotUtil;
