// 数据模型基类
// by YuRonghui 2018-1-31
const Redis = require('./redis');
const Mongo = require('./mongo');
const Mysql = require('./mysql');
const Util = require('./util');
const cluster = require('cluster');
const {
  error,
  catchErr
} = Util;
let largelimit = 20000; //限制不能超过2万条数据返回

class Model {
  constructor(data, opts = {}) {
    this._options = {
      tableName: '', //集合名
      fields: null, //集合字段
      index: {}, //创建索引
      select: {
        _id: 0
      }, //只返回的字段
      ...opts
    };
    if (!this._options.tableName) console.error('表名不能为空');
    if (!this._options.fields) console.error('fields不能为空');
    this.redis = new Redis.client(this._options.tableName);
    this.db = new Mongo.client(this._options.tableName);
    if (data) this.setData(data);
    this._init();
    if (!Util.isEmpty(this._options.index)) this.createIndex(this._options.index);

    return Object.create(this, this._get_set());
  }

  // 创建索引
  createIndex(opts = {}) {
    if (!Util.isEmpty(opts)) this.db.collection.ensureIndex(opts);
  }

  // 删除索引
  removeIndex(name) {
    if (name) this.db.collection.dropIndex(name);
  }

  // 设置getter和setter
  _get_set() {
    let obj = {}, fieldMap = this._options.fields.fieldMap;
    for (let key in fieldMap) {
      obj[key] = {
        get() {
          if (CONFIG.isDebug) console.warn(`getter: ${key}`);
          return fieldMap[key].value || fieldMap[key].defaultValue;
        },
        set(val) {
          if (CONFIG.isDebug) console.warn(`setter: ${key}, ${val}`);
          fieldMap[key].value = val;
        }
      }
    }
    return obj;
  }

  _init() {
    let fields = this._options.fields.data;
    for (let key in fields) {
      let item = fields[key];
      if (key == '_id') continue;
      // 建索引
      if (item.index) {
        if(cluster.worker == null || CONFIG.service.initloop.workerid == cluster.worker.id){
          let indexField = {};
          indexField[key] = item.index == 'text' ? item.index : 1 ;
          this.db.index(indexField);
        }
      }
      //表关联
      if (item.key && item.as && item.from) {
        this.relation = this.relation || {};
        if (item) {
          this.relation[key] = item;
        }
      }
    }
  }

  // 设置数据
  setData(target, value) {
    this._options.fields.setData(target, value);
  }

  // 获取模型数据
  getData(hasVirtualField = true) {
    return this._options.fields.getData(hasVirtualField);
  }

  // 是否新的
  isNew() {
    return !this.rowid;
  }

  //新增数据
  async create(data) {
    if (!data) throw error('create方法的参数data不能为空');
    let rowid = await this.redis.rowid();
    if (CONFIG.isDebug) console.warn('新增rowid: ', rowid);
    if (rowid || data.rowid == 0) {
      data.rowid = rowid;
      this.setData(data);
      let err = this._options.fields.validate();
      if (err) throw error(err);
      const lock = await catchErr(this.redis.lock());
      if (lock.data) {
        return this.db.create(this.getData());
      }else{
        throw error(lock.err);
      }
    }
    throw error(false);
  }

  // 更新数据
  async update(data, required = false) {
    if (!data) throw error('update方法的参数data不能为空');
    if (!this.isNew() || data.rowid) {
      let err = this._options.fields.validate(),
        hasSet = false,
        rowid = this.rowid || data.rowid;
      if (!required) err = false;
      if (err) {
        throw error(err);
      } else {
        let isLock = await catchErr(this.redis.lock());
        if (isLock.data) {
          delete data.rowid;
          let keys = Object.keys(data);
          hasSet = keys[0].indexOf('$') === 0;
          const result = await catchErr(this.db.update({ rowid }, hasSet ? data : { $set: data }));
          if (result.data){
            return { rowid };
          }else{
            throw error(result.err);
          }
        }else{
          throw error(isLock.err);
        }
      }
    }
    throw error(false);
  }

  // 保存数据
  async save() {
    let data = this.getData(false);
    if (Util.isEmpty(data) || !data) throw error('save方法的data为空');
    if (!this.isNew() || data.rowid) {
      const updateOk = await catchErr(this.update(data));
      if (updateOk.err) throw error(updateOk.err);
      return updateOk.data;
    } else {
      const result = await catchErr(this.create(data));
      if (result.err) throw error(result.err);
      return result.data;
    }
  }

  //删除数据
  async remove(data) {
    if (!data) return false;
    const lock = await catchErr(this.redis.lock());
    if (lock.data) {
      return this.db.remove(data);
    }else{
      throw error(lock.err);
    }
  }

  //清空数据
  async clear() {
    const lock = await catchErr(this.redis.lock());
    if (lock.data) {
      return this.db.clear();
    }else{
      throw error(lock.err);
    }
  }

  // 计算总记录数
  async count(body = {}, noCache = true) {
    if (!body.data) throw error('count方法参数data不能为空');
    const result = await catchErr(this.getQuery(body, noCache));
    if (result.data) {
      let query = result.data;
      let theKey = query.listKey + '_count',
        count = 0,
        timeout = 60 * 1; //5分钟
      // if(noCache) await this.redis.delKey(theKey);
      if (await this.redis.existKey(theKey) && !noCache) {
        if (CONFIG.isDebug) console.warn('已有count');
        let arr = await this.redis.listSlice(theKey, 0, 1);
        if (arr.length) count = arr[0];
      } else {
        if (CONFIG.isDebug) console.warn('没有count');
        if (query.hasKey && !noCache) {
          count = await this.redis.listCount(query.listKey);
        } else {
          count = await this.db.count(query);
        }
        this.redis.listPush(theKey, [count]);
        this.redis.setKeyTimeout(theKey, timeout);
      }
      return Number(count);
    } else {
      throw error(result.err);
    }
  }

  // 查询条件对象
  async getQuery(opts = {}, clearListKey) {
    let body = Util.deepCopy(opts),
      limit = body.data.limit == undefined ? 20 : Number(body.data.limit),
      page = body.data.page || 1,
      where = body.data.where || {};
    body.data.largepage = body.data.largepage || 1;
    page = page % Math.ceil(largelimit / limit) || 1;
    let listKey = await Util.getListKey(body); //生成listkey
    let hasKey = await this.redis.existKey(listKey); //key是否存在
    if (clearListKey && hasKey) {
      await this.redis.delKey(listKey); //删除已有的key
      hasKey = false;
    }
    if (hasKey) {
      let startIndex = (page - 1) * limit;
      body.data.rowid = await this.redis.listSlice(listKey, startIndex, startIndex + limit - 1);
      body.data.rowid = body.data.rowid.map(item => parseInt(item));
    }
    let query = this.db.query({
      where: where
    });
    query.listKey = listKey;
    query.hasKey = hasKey;
    let obj = {};
    for (let key in body.data) {
      if (!this._options.fields.data[key]) continue;
      if (Array.isArray(body.data[key])) {
        obj[key] = {
          $in: body.data[key]
        };
      } else {
        if(typeof body.data[key] == 'object'){
          if(body.data[key].like){ // 模糊查询
            obj[key] = {
              $regex: body.data[key].like
            };
          }else if(body.data[key].search){ // 全文搜索
            obj['$text'] = {
              $search: body.data[key].search
            };
          }else{
            obj[key] = body.data[key];
          }
        }else{
          obj[key] = {
            $eq: body.data[key]
          };
        }
      }
    }
    query.where(obj);
    return query;
  }

  // 查询单条记录
  async queryOne(data, addLock = true) {
    if (!data){
      if(this.rowid){
        data = Number(this.rowid);
      }else{
        throw error('queryOne方法参数data不能为空');
      }
    }
    const hasLock = addLock ? await catchErr(this.redis.hasLock()) : {data: 0};
    if(hasLock.err){
      throw error(hasLock.err);
    }else{
      if (!hasLock.data) {
        let query = this.db.query();
        if (typeof data === 'number') {
          query.where({
            rowid: data
          });
        } else if (typeof data === 'object') {
          query.where(data);
        }
        query.select(this._options.select);
        if (this.relation) query.populate(this.relation);
        return query.exec('one');
      } else {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true);
          }, 500);
        });
        return this.queryOne(data, addLock);
      }
    }
  }

  // 查询数据列表
  async queryList(body = {}, noCache = true, addLock = true) {
    let hasLock = addLock ? await catchErr(this.redis.hasLock()) : {data: 0};
    if(hasLock.err){
      throw error(hasLock.err);
    }else{
      if (!hasLock.data) {
        if (!body.data) throw error('queryList方法参数data不能为空');
        body.data.sort = Object.assign({
          rowid: -1
        }, body.data.sort || {});
        let timeout = 60 * 1; //半小时
        const result = await catchErr(this.getQuery(body, noCache));
        if (result.data) {
          let query = result.data;
          if (CONFIG.isDebug) console.warn(`请求列表, ${query.hasKey ? '有' : '无'}listKey`);
          if (!query.hasKey) {
            query.select({
              rowid: 1
            });
          } else {
            query.select(this._options.select);
          }
          query.sort(body.data.sort);
          if (this.relation) query.populate(this.relation);
          const docsResult = await catchErr(query.exec('list'));
          if (docsResult.data) {
            let docs = docsResult.data;
            // 缓存rowid
            if (!query.hasKey && docs.length) {
              if (docs.length >= largelimit) {
                body.data.largepage = body.data.largepage || 1;
                let startNum = (body.data.largepage - 1) * largelimit;
                docs = docs.slice(startNum, startNum + largelimit);
              }
              await this.redis.listPush(query.listKey, docs.map(item => item.rowid));
              this.redis.setKeyTimeout(query.listKey, timeout); //设置listkey一小时后过期
              return this.queryList(body, false, addLock);
            } else {
              return docs;
            }
          } else {
            throw error(docsResult.err);
          }
        } else {
          throw error(result.err);
        }
        return [];
      }else{
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true);
          }, 500);
        });
        return this.queryList(body, noCache, addLock);
      }
    }
  }
}

module.exports = Model;
