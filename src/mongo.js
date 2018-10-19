// mongodb操作方法类
// by YuRonghui 2018-2-6
const Query = require('./query');
const mongodb = require('mongodb');
const Util = require('./util');
const ObjectId = mongodb.ObjectID;
let db = null;

class Mongo {
  constructor(tbname) {
    this.tableName = tbname;
    if(db) {
      this.collection = db.collection(this.tableName);
    }else{
      throw Util.error('mongodb failed: db=null');
    }
  }
  // 返回查询对象
  query(data = {}) {
    return new Query(data, this);
  }
  // 获取
  _getParams(obj = {}) {
    if (obj._isQuery) {
      return obj.toJSON();
    } else {
      if (!obj.where) obj = {
        where: obj
      };
      let query = this.query(obj);
      return query.toJSON();
    }
    if (obj.where._id) obj.where._id = ObjectId(obj.where._id);
    return obj;
  }
  // 建索引
  index(data = {}, opts = {
    background: true
  }) {
    if (CONFIG.isDebug) console.warn(`建立索引: ${JSON.stringify(data)}`);
    this.collection.createIndex(data, opts);
  }
  // 查询全部记录
  find(params = {}) {
    let data = this._getParams(params);
    return new Promise((resolve, reject) => {
      this.collection.find(data.where, data.select).sort(data.sort).toArray((err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }
  // 查询单条记录
  findOne(params = {}) {
    let data = this._getParams(params);
    return new Promise((resolve, reject) => {
      this.collection.findOne(data.where, data.select || {}, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }
  // 删除
  remove(params = {}) {
    let data = this._getParams(params);
    return new Promise((resolve, reject) => {
      this.collection.deleteMany(data.where, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }
  // 清空
  clear() {
    return this.remove({});
  }
  // 查找并更新
  findOneAndUpdate(params = {}, val = {}) {
    let data = this._getParams(params);
    return new Promise((resolve, reject) => {
      this.collection.findOneAndUpdate(data.where, val, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }
  // 更新
  update(params = {}, val = {}) {
    let data = this._getParams(params);
    return new Promise((resolve, reject) => {
      this.collection.updateOne(data.where, val, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }
  // 新增记录
  create(data = {}) {
    return new Promise((resolve, reject) => {
      this.collection.insert(data, (err, result) => {
        if (err) reject(err);
        resolve(result.ops ? result.ops[0] : (result.result ? result.result : {_id: 1}));
      });
    });
  }
  // 计算总数
  count(params = {}) {
    let data = this._getParams(params);
    return this.collection.find(data.where).count();
  }
  //聚合
  aggregate(params = {}, isOne) {
    return new Promise((resolve, reject) => {
      this.collection.aggregate(params, (err, result) => {
        if (err) reject(err);
        resolve(isOne ? result[0] : result);
      });
    });
  }
}

module.exports = {
  client: Mongo,
  connect(url, callback) {
    mongodb.MongoClient.connect(url, (err, client) => {
      if (err) {
        console.log('MongoDB failed :' + err.message);
        this.db = null;
        if (callback) callback(err);
      } else {
        console.log('MongoDB connected Successfull');
        this.db = db = client;
        if (callback) callback(err, client);
      }
    });
  },
  close(){
    db.close();
  }
};
