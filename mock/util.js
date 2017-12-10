const fs = require('fs');
const path = require('path');
const db = JSON.parse(fs.readFileSync(path.resolve('mock/db.json')));

// レスポンスデータを生成する
exports.response = (data = {}, isSuccess = true) => {
  const res = {};
  res.isSuccess = isSuccess;
  if (Object.keys(data).length > 0) {
    res.data = data;
  }
  return res;
}

// データベースからアイテムIDを取得
exports.getItemId = (itemName) => {
  const results = Object.keys(db.items).filter((id) => {
    return db.items[id] === itemName;
  });

  return results[0];
}

// 分別方法をアイテムIDから取得
exports.getSeparationFromItemId = (itemId) => {
  const results = db.relations.filter((relation) => {
    return relation.itemId === itemId;
  });

  return results[0];
}

// データベースから分別方法を取得
exports.getSeparation = (separationId) => {
  return db.separations[separationId];
}
