import async from 'async';
import express from 'express';
import Database from '../database';
import C from '../constants';

const router = express.Router();

// 校区リストを返す
router.get('/school-list', (req, res) => {
  res.json(C.SCHOOL_LIST.map((item) => {
    delete item.points;
    return item;
  }));
});

// 分別スケジュールのごみリストを返す
router.get('/garbage-list', (req, res) => {
  res.json(C.GARBAGE_LIST);
});

// スケジュールを設定する
router.post('/update/schedule', (req, res) => {
  const file = req.body.file;

  Database.schedule.updateSchedule(file)
    .then(() => {
      res.send({ success: true });
    })
    .catch((error) => {
      res.send({
        success: false,
        error
      });
    });
});

// スケジュールを取得する
router.get('/schedules', (req, res) => {
  Database.schedule.fetchSchedule()
    .then((data) => {
      res.send({
        success: true,
        data
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        error
      });
    })
});

// 回答済みのログを取得
router.get('/logs/answered', (req, res) => {
  Database.log.fetchAnsweredLog()
    .then((data) => {
      res.send({
        success: true,
        data
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        error
      });
    });
});

// 未回答のログを取得
router.get('/logs/unanswered', (req, res) => {
  Database.log.fetchUnansweredLog()
    .then((data) => {
      res.send({
        success: true,
        data
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        error
      });
    });
});

// 30日前までのログの件数を取得
router.get('/logs/monthly', (req, res) => {
  Database.log.fetchTimeline(30)
    .then((data) => {
      res.send({
        success: true,
        data
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        error
      });
    });
});

// 分別の全データを取得
router.get('/separation/data', (req, res) => {
  Database.separation.fetchAll()
    .then((data) => {
      res.send({
        success: true,
        data
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        error
      });
    })
});

// 分別を検索
router.get('/separation/search', (req, res) => {
  Database.separation.search.all(req.query.text, -1)
    .then((result) => {
      const count = result.data ? result.data.length : 0;

      Database.log.insert_date(req.query.text, req.query.datetime, count >= 5 ? 2 : count > 0 ? 1 : 0);

      res.send({
        success: true,
        count
      });
    })
    .catch((error) => {
      res.send({
        success: false,
        error
      });
    });
});

// ごみを登録
router.post('/separation/regist', (req, res) => {
  const {
    name,
    furigana,
    separationId,
    noticeId,
    register
  } = req.body;

  async.waterfall([
    // 分別方法を登録
    (callback) => {
      Database.separation.add.separation(separationId, noticeId, register)
        .then(callback)
        .catch(() => callback());
    },
    // 分別方法のIDを取得
    (callback) => {
      Database.separation.search.separation(separationId, noticeId)
        .then(row => callback(null, row && row.id))
        .catch(callback);
    },
    // ごみを追加する
    (separationId, callback) => {
      if (!separationId) {
        return callback('Separation not registed.');
      }

      Database.separation.add.trush(name, furigana, separationId, null, register)
        .then(callback)
        .catch(callback);
    }
  ], (err) => {
    if (err) {
      return res.send({
        isSuccess: false,
        error: err
      });
    }
    res.send({
      isSuccess: true
    });
  });
});

export default router;
