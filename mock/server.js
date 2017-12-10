/* eslint-disable */
const jsonServer = require('json-server');
const _ = require('lodash');

const util = require('./util');

const port = process.env.PORT || 8081;
const app = jsonServer.create();
app.use(jsonServer.defaults());

// 返信を遅延させる
app.get('*', (req, res, next) => {
  setTimeout(next, Math.trunc(Math.random() * 1000));
});

app.post('*', (req, res, next) => {
  setTimeout(next, 1000 + Math.trunc(Math.random() * 1000));
});

// 分別方法を取得
app.get('/trush/separation', (req, res) => {
  const itemName = req.query.itemName;
  const itemId = util.getItemId(itemName);
  const body = util.getSeparationFromItemId(itemId);
  if (body) {
    const separation = util.getSeparation(body.separationId);
    res.send(util.response({
      isFound: true,
      itemName,
      separation
    }));
  } else {
    res.send(util.response({
      isFound: false,
      itemName
    }));
  }
});

app.listen(port, () => {
  console.log(`Mockserver started ... : listening on http://localhost:${port}`);
});
