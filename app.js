import express from 'express';
import bodyParser from 'body-parser';
import ip from 'ip';

const app = express();

// Cross-Origin Resource Sharingを有効に
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Max-Age', '86400');
  next();
});

app.use(bodyParser.json({
  verify(req, res, buf) {
    req.rawBody = buf;
  }
}));

import LineBot from './server/linebot';
const linebot = new LineBot();
app.use('/webhook', linebot.webhook());

import Apis from './server/apis';
const apis = new Apis();
app.use('/api', apis.router);

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
