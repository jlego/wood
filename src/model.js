// 数据模型基类
// by YuRonghui 2018-1-31
const Redis = require('./redis');
const Mongo = require('./mongo');
const Mysql = require('./mysql');
const Query = require('./query');
const {
  error,
  catchErr,
  isEmpty,
  getListKey
} = require('./util');
const cluster = require('cluster');
let largelimit = 20000; //限制不能超过2万条数据返回
const _timeout = 0;
const _KeyTimeout = 60 * 1; //设置listkey过期时间，秒

class Model {
  constructor(opts = {}) {
    this.tableName = opts.tableName || '';
    this.fields = opts.fields || {};
    this.select = opts.select || {};
    this.relation = {};
  }

  // 设置getter和setter
  _get_set() {
    let obj = {}, fieldMap = this.fields.fieldMap;
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
    let fields = this.fields.data || {};
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
        if (item) {
          this.relation[key] = item;
        }
      }
    }
    return Object.create(this, this._get_set());
  }

  // 创建索引
  createIndex(opts = {}) {
    if (!isEmpty(opts)) this.db.collection.ensureIndex(opts);
  }

  // 删除索引
  removeIndex(name) {
    if (name) this.db.collection.dropIndex(name);
  }

  // 设置数据
  setData(target, value) {
    this.fields.setData(target, value);
  }

  // 获取模型数据
  getData(hasVirtualField = true) {
    return this.fields.getData(hasVirtualField);
  }

  // 是否新的
  isNew() {
    return !this.rowid;
  }

  //新增数据
  async create(data, addLock = true, hascheck = true) {
    if (!data) throw error('create方法的参数data不能为空');
    let rowid = await this.redis.rowid();
    if (CONFIG.isDebug) console.warn('新增rowid: ', rowid);
    if (rowid || data.rowid == 0) {
      data.rowid = rowid;
      this.setData(data);
      let err = hascheck ? this.fields.validate() : false;
      if (err) throw error(err);
      const lock = addLock ? await catchErr(this.redis.lock()) : {data: 1};
      if (lock.data) {
        let result = await catchErr(this.db.create(this.getData()));
        if(addLock) this.redis.unlock(lock.data);
        if(result.err) throw error(result.err);
        return result.data;
      }else{
        throw error(lock.err);
      }
    }
    throw error(false);
  }

  // 更新数据
  async update(data, addLock = true, hascheck = true) {
    if (!data) throw error('update方法的参数data不能为空');
    if (!this.isNew() || data.rowid) {
      let err = hascheck ? this.fields.validate() : false,
        hasSet = false,
        rowid = this.rowid || data.rowid;
      if (err) {
        throw error(err);
      } else {
        let lock = addLock ? await catchErr(this.redis.lock()) : {data: 1};
        if (lock.data) {
          delete data.rowid;
          let keys = Object.keys(data);
          hasSet = keys[0].indexOf('$') === 0;
          const result = await catchErr(this.db.update({ rowid }, hasSet ? data : { $set: data }));
          if(addLock) this.redis.unlock(lock.data);
          if (result.data){
            return { rowid };
          }else{
            throw error(result.err);
          }
        }else{
          throw error(lock.err);
        }
      }
    }
    throw error(false);
  }

  // 保存数据
  async save() {
    let data = this.getData(false);
    if (isEmpty(data) || !data) throw error('save方法的data为空');
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
    if (lock.err) {
      throw error(lock.err);
    }else{
      return this.db.remove(data);
    }
  }

  //清空数据
  async clear() {
    const lock = await catchErr(this.redis.lock());
    if (lock.err) {
      throw error(lock.err);
    }else{
      return this.db.clear();
    }
  }

  // 查询单条记录
  async findOne(data, addLock = true) {
    const hasLock = addLock ? await catchErr(this.redis.hasLock()) : {};
    if(hasLock.err){
      throw error(hasLock.err);
    }else{
      if (!hasLock.data) {
        let query = data;
        if(!data._isQuery){
          query = Query.getQuery();
          if (typeof data === 'number') {
            query.where({
              rowid: data
            });
          } else if (typeof data === 'object') {
            query.where(data);
          }
        }
        if (!isEmpty(this.select)) query.select(this.select);
        if (!isEmpty(this.relation)) query.populate(this.relation);
        let result = await catchErr(this.exec('findOne', query.toJSON()));
        if(result.err){
          throw error(result.err);
        }else{
          return result.data;
        }
      } else {
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true);
          }, _timeout);
        });
        return this.findOne(data, addLock);
      }
    }
  }

  // 执行查询
  exec(oper = 'find', data) {
    if (CONFIG.isDebug) console.warn(`data ${oper}: ${JSON.stringify(data)}`);
    if (this.db[oper]) {
      if (data.aggregate.length) {
        return this.db.aggregate(data.aggregate, oper == 'findOne' ? true : false);
      } else {
        return this.db[oper](data);
      }
    }
    return error(CONFIG.error_code.error_nodata);
  }

  // 查询数据列表
  async findList(data, hasCache = true, addLock = true) {
    if (!data) throw error('findList方法参数data不能为空');
    let hasLock = addLock ? await catchErr(this.redis.hasLock()) : {};
    if(hasLock.err){
      throw error(hasLock.err);
    }else{
      if (!hasLock.data) {
        let listKey = '', hasKey = false, largepage = 1;
        let query = null;
        if(data._isQuery){
          // 若有req对像，则读缓存
          if(data.req && data.req.url){
            let limit = data.req.body.data.limit == undefined ? 20 : Number(data.req.body.data.limit),
              page = data.req.body.data.page || 1;
            largepage = data.req.body.data.largepage || 1;
            page = page % Math.ceil(largelimit / limit) || 1;
            listKey = await getListKey(data.req); //生成listkey
            hasKey = await this.redis.existKey(listKey); //key是否存在
            if (hasKey) {
              let startIndex = (page - 1) * limit;
              data.req.body.data.rowid = await this.redis.listSlice(listKey, startIndex, startIndex + limit - 1);
              data.req.body.data.rowid = data.req.body.data.rowid.map(item => parseInt(item));
            }
            data.where(data.req.body.data);
          }
          query = data;
        }else{
          query = Query.getQuery({body: { data }});
        }
        if (CONFIG.isDebug) console.warn(`请求列表, ${hasKey ? '有' : '无'}listKey`, isEmpty(this.relation));
        if (!isEmpty(this.select)) query.select(this.select);
        if (!isEmpty(this.relation)) query.populate(this.relation);
        let counts = this.db.count(query),
          lists = this.exec('find', query.toJSON());
        const countResult = await catchErr(counts);
        const docsResult = await catchErr(lists);
        if (docsResult.err || countResult.err) {
          throw error(docsResult.err || countResult.err);
        }else{
          let docs = docsResult.data;
          // 缓存rowid
          if (hasCache && !hasKey && docs.length) {
            if (docs.length >= largelimit) {
              largepage = largepage || 1;
              let startNum = (largepage - 1) * largelimit;
              docs = docs.slice(startNum, startNum + largelimit);
            }
            await this.redis.listPush(listKey, docs.map(item => item.rowid));
            this.redis.setKeyTimeout(listKey, _KeyTimeout); //设置listkey一小时后过期
            return this.findList(data, false, addLock);
          }
          return {
            count: Number(countResult.data),
            list: docs || []
          };
        }
        return [];
      }else{
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(true);
          }, _timeout);
        });
        return this.findList(data, hasCache, addLock);
      }
    }
  }
}

module.exports = Model;
