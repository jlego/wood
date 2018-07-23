// 数据模型基类
// by YuRonghui 2018-1-31
const Redis = require('./redis');
const Mongo = require('./mongo');
const Util = require('./util');
const cluster = require('cluster');
const {
  error,
  catchErr
} = Util;
let largelimit = 20000; //限制不能超过2万条数据返回
const fieldType = ['Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'Virtual'];

class Model {
  constructor(data, opts = {}) {
    this.fieldMap = {};
    this._options = {
      tableName: '', //集合名
      fields: {}, //集合字段
      index: {}, //创建索引
      select: {
        _id: 0
      }, //只返回的字段
      ...opts
    };
    if (!this._options.tableName) console.error('表名不能为空');
    this.redis = new Redis.client(this._options.tableName);
    this.db = new Mongo.client(this._options.tableName);
    this._initFields();
    if (data) this.setData(data);
    this._initSelect();
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
    let obj = {};
    for (let key in this.fieldMap) {
      obj[key] = {
        get() {
          if (CONFIG.isDebug) console.warn(`getter: ${key}`);
          return this.fieldMap[key].value || this.fieldMap[key].defaultValue;
        },
        set(val) {
          if (CONFIG.isDebug) console.warn(`setter: ${key}, ${val}`);
          this.fieldMap[key].value = val;
        }
      }
    }
    return obj;
  }

  // 初始化字段
  _initFields() {
    let that = this;
    function loopData(fields, parentKey) {
      for (let key in fields) {
        let field = fields[key],
          alias = parentKey ? `${parentKey}.${key}` : key;
        if (field == undefined) continue;
        if (typeof field == 'object' && !Array.isArray(field)) {
          if (!fieldType.includes(field.type)) {
            loopData(fields[key], alias);
          } else {
            fields[key] = that._defaultValue(field);
            fields[key].alias = alias;
          }
        } else {
          fields[key] = that._defaultValue(field);
          fields[key].alias = alias;
        }
        if (fields[key].alias) that.fieldMap[fields[key].alias] = fields[key];
      }
    }
    loopData(this._options.fields);
  }

  //默认值
  _defaultValue(value) {
    let newValue = {
        type: Array.isArray(value) ? 'Array' : Util.firstUpperCase(typeof value)
      },
      defaultValue = '';
    if (typeof value == 'function') {
      newValue.type = Util.firstUpperCase(value.name.toString());
    } else if (typeof value == 'object' && !Array.isArray(value)) {
      defaultValue = value.default;
      Object.assign(newValue, value);
    }
    switch (newValue.type) {
      case 'Number':
        newValue.default = defaultValue || 0;
        break;
      case 'String':
        newValue.default = defaultValue || '';
        break;
      case 'Boolean':
        newValue.default = defaultValue || false;
        break;
      case 'Array':
        newValue.default = defaultValue || [];
        break;
      case 'Object':
        newValue.default = defaultValue || {};
        break;
      case 'Date':
        newValue.default = defaultValue || new Date();
        break;
      case 'Virtual':
        newValue.default = defaultValue || '';
        break;
    }
    return newValue;
  }

  _initSelect() {
    let fields = this._options.fields,
      selectFields = {};
    for (let key in fields) {
      let item = fields[key];
      if (key == '_id') continue;
      // 过滤是否返回字段
      if (!item.unselect) selectFields[key] = !item.select ? 1 : {};
      if (item.select) {
        for (let subkey in item.select) {
          selectFields[key][subkey] = 1;
        }
      }
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
    Object.assign(this._options.select, selectFields);
  }

  // 设置数据
  setData(target, value) {
    let fields = this._options.fields,
      that = this;
    if (target !== undefined && value !== undefined) {
      if (typeof target == 'string') {
        if (!fields[target]) return;
        fields[target].value = value;
      } else {
        target.value = value;
      }
    } else if (typeof target == 'object' && !Array.isArray(target) && value == undefined) {
      if (!Util.isEmpty(target)) {
        function loopData(fields, data) {
          for (let key in fields) {
            let value = data[key];
            if (value == undefined) continue;
            if (!fieldType.includes(fields[key].type)) {
              loopData(fields[key], value);
            } else {
              fields[key].value = value;
            }
          }
        }
        loopData(this._options.fields, target);
      }
    }
  }

  // 获取模型数据
  getData(hasVirtualField = true) {
    let that = this;
    function loopData(fields, parentData) {
      if (!Util.isEmpty(fields)) {
        for (let key in fields) {
          let field = fields[key];
          if (!hasVirtualField && field.type == 'Virtual') continue;
          if (typeof field == 'object' && !Array.isArray(field)) {
            if (!fieldType.includes(field.type)) {
              parentData[key] = loopData(field, {});
            } else {
              let theVal = field.value || field.default;
              parentData[key] = theVal;
            }
          } else if (typeof field !== 'function') {
            parentData[key] = field;
          }
        }
      }
      return parentData;
    }
    return loopData(this._options.fields, {});
  }

  _validateError(key, field) {
    let err = null,
      errObj = Util.deepCopy(CONFIG.error_code.error_validation);
    if (typeof field == 'object') {
      let value = field.value !== undefined ? field.value : field.default;
      // 验证是否空值
      if (field.required) {
        let isOk = true;
        if (value == undefined) isOk = false;
        if (typeof value == 'string' && value == '') isOk = false;
        if (typeof value == 'object') {
          if (JSON.stringify(value) == '{}' || JSON.stringify(value) == '[]') isOk = false;
        }
        if (!isOk) {
          err = errObj;
          err.msg += `, [${key}]不能为空`;
          return err;
        }
        // 验证数据类型
        if (field.type && field.type !== 'Virtual') {
          if (field.type == 'Date') {
            if (!(value instanceof Date)) {
              err = errObj;
              err.msg += `, [${key}]数据类型不是${field.type}类型`;
              return err;
            }
          } else if (typeof value !== field.type.toLowerCase()) {
            err = errObj;
            err.msg += `, [${key}]数据类型不是${field.type}类型`;
            return err;
          }
        }
      }
      // 检验最大字符长度
      if(field.maxLength){
        if(JSON.stringify(value).length > field.maxLength){
          err = errObj;
          err.msg += `, [${key}]值长度超过最大允许值${field.maxLength}`;
          return err;
        }
      }
      //自定义验证  param: value
      if (field.validator) {
        if (typeof field.validator == 'function') {
          let hasErr = field.validator(value);
          if (hasErr) {
            err = hasErr.error || errObj;
            return err;
          }
        }
      }
    }
    return err;
  }

  // 验证字段
  validate() {
    let that = this;
    function loopData(fields) {
      let hasErr = false;
      for (let key in fields) {
        let field = fields[key];
        if (!fieldType.includes(field.type)) {
          hasErr = loopData(field);
        } else {
          hasErr = that._validateError(key, field);
        }
        if (hasErr) break;
      }
      return hasErr;
    }
    return loopData(this._options.fields);
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
      this.rowid = data.rowid = rowid;
      let err = this.validate();
      if (err) throw error(err);
      const lock = await catchErr(this.redis.lock());
      if (lock.data) {
        return this.db.create(data);
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
      let err = this.validate(),
        hasSet = false,
        rowid = this.rowid || data.rowid || data.$set.rowid;
      if (!required) err = false;
      if (err) {
        throw error(err);
      } else {
        for (let key in data) {
          if (key.indexOf('$') == 0) {
            hasSet = true;
            break;
          }
        }
        if (!hasSet) data = {
          $set: data
        };
        let isLock = await catchErr(this.redis.lock());
        if (isLock.data) {
          const result = await catchErr(this.db.update({
            rowid: rowid
          }, data));
          if (result.data){
            return {
              rowid
            };
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
      const updateOk = await catchErr(this.update({
        $set: data
      }));
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
  async count(body = {}, noCatch = true) {
    if (!body.data) throw error('count方法参数data不能为空');
    const result = await catchErr(this.getQuery(body, noCatch));
    if (result.data) {
      let query = result.data;
      let theKey = query.listKey + '_count',
        count = 0,
        timeout = 60 * 1; //5分钟
      // if(noCatch) await this.redis.delKey(theKey);
      if (await this.redis.existKey(theKey) && !noCatch) {
        if (CONFIG.isDebug) console.warn('已有count');
        let arr = await this.redis.listSlice(theKey, 0, 1);
        if (arr.length) count = arr[0];
      } else {
        if (CONFIG.isDebug) console.warn('没有count');
        if (query.hasKey && !noCatch) {
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
      if (!this._options.fields[key]) continue;
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
    if (!data) throw error('queryOne方法参数data不能为空');
    const hasLock = addLock ? await catchErr(this.redis.hasLock()) : {data: 0};
    if(hasLock.err){
      throw error(hasLock.err);
    }else{
      if (!hasLock.data) {
        let query = this.db.query();
        if (typeof data == 'number') {
          query.where({
            rowid: data
          });
        } else if (typeof data == 'object') {
          query.where(data);
        }
        query.select(this._options.select);
        if (this.relation) query.populate(this.relation);
        return query.exec('one');
      } else {
        return this.queryOne(data, addLock);
      }
    }
  }

  // 查询数据列表
  async queryList(body = {}, noCatch = true, addLock = true) {
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
        const result = await catchErr(this.getQuery(body, noCatch));
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
        return this.queryList(body, noCatch, addLock);
      }
    }
  }
}

module.exports = Model;
