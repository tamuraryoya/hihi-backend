import express from 'express';
import bodyParser from 'body-parser';
import ip from 'ip';

const app = express();

app.use(bodyParser.json({
  verify(req, res, buf) {
    req.rawBody = buf;
  }
}));

import LineBot from './server/linebot';
const linebot = new LineBot();
app.use('/', linebot.webhook());

const port = `${process.env.PORT || 8000}`;
app.listen(port, () => {
  if (process.env.NODE_ENV !== 'production') {
    /* eslint-disable no-console */
    console.log('API Listening.');
    console.log(`Local: http://localhost:${port}`);
    console.log(`External: http://${ip.address()}:${port}`);
    /* eslint-enable no-console */
  }
});
