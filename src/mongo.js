// mongodb操作方法类
// by YuRonghui 2018-2-6
const Query = require('./query');
const mongodb = require('mongodb');
const { error } = require('./util');
const ObjectId = mongodb.ObjectID;
let dbs = {};

class Mongo {
  constructor(tbname, database = 'master') {
    this.tableName = tbname;
    this.database = database;
    if(dbs[this.database]) {
      this.collection = dbs[this.database].collection(this.tableName);
    }else{
      throw error('mongodb failed: db=null');
    }
  }
  // 获取
  _getParams(obj = {}) {
    if (obj._isQuery) {
      return obj.toJSON();
    } else {
      if (obj.where._id) obj.where._id = ObjectId(obj.where._id);
      if (!obj.where) obj = { where: obj };
      let query = new Query(obj);
      return query.toJSON();
    }
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
    return this.collection.find(data.where, data.select).sort(data.sort).toArray();
  }
  // 查询单条记录
  findOne(params = {}) {
    let data = this._getParams(params);
    return this.collection.findOne(data.where, data.select);
  }
  // 删除
  remove(params = {}) {
    let data = this._getParams(params);
    return this.collection.deleteMany(data.where);
  }
  // 清空
  clear() {
    return this.remove({});
  }
  // 查找并更新
  findOneAndUpdate(params = {}, val = {}) {
    let data = this._getParams(params);
    return this.collection.findOneAndUpdate(data.where, val);
  }
  // 更新
  update(params = {}, val = {}) {
    let data = this._getParams(params);
    return this.collection.updateOne(data.where, val);
  }
  // 新增记录
  create(data = {}) {
    if(Array.isArray(data)){
      return this.collection.insertMany(data);
    }else{
      return this.collection.insertOne(data);
    }
  }
  // 计算总数
  count(params = {}) {
    let data = this._getParams(params);
    return this.collection.find(data.where).count();
  }
  //聚合
  aggregate(params = {}) {
    return this.collection.aggregate(params);
  }
  static connect(opts, name = 'master', callback) {
    let dbName = '', authStr, hostStr;
    if(typeof opts === 'object'){
      dbName = opts.dbName;
      authStr = `${opts.user && opts.password ? `${opts.user}:${opts.password}@` : ''}`;
      hostStr = Array.isArray(opts.host) ? opts.host.join(',') : `${opts.host}:${opts.port}`;
      opts = `mongodb://${authStr}${hostStr}/${opts.dbName}${opts.replset ? `?replicaSet=${opts.replset}` : ''}`;
    }else{
      let index = opts.indexOf('?replicaSet'), _opts = opts;
      if(index > 0) _opts = opts.slice(0, index);
      let optsArr = _opts.split('/');
      dbName = optsArr[optsArr.length - 1];
    }
    mongodb.MongoClient.connect(opts, (err, client) => {
      if (err) {
        console.log(`MongoDB [${name}] failed :` + err.message);
        dbs[name] = null;
        if (callback) callback(err);
      } else {
        console.log(`MongoDB [${name}] connected Successfull`);
        dbs[name] = client.db(dbName);
        if (callback) callback(err, dbs[name]);
      }
    });
  }
  static close(name = 'master'){
    dbs[name].close();
  }
}

module.exports = Mongo;
