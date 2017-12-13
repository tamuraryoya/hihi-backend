const fs = require('fs');
const path = require('path');
const db = JSON.parse(fs.readFileSync(path.resolve('mock/db.json')));
const opendata = JSON.parse(fs.readFileSync(path.resolve('mock/opendata.json')));

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
exports.getSeparation = (itemName) => {
  const result = opendata.data.filter((item) => {
    const pattern = new RegExp(itemName, 'g');
    if (pattern.test(item.name) || pattern.test(item.furigana)) {
      return {
        label: item.label,
        name: item.name,
        notice: item.notice.replace(/【.+】/g, '')
      };
    }
  });

  if (result.length === 0) {
    return {
      state: 'STATUS_RESULT_NOT_FOUND'
    };
  } else if (result.length <= 5) {
    return {
      state: 'SUCCESS',
      data: result
    };
  } else {
    return {
      state: 'STATUS_TOO_MUCH_RESULTS'
    };
  }
}
