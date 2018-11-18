// 关系型数据模型基类
// by YuRonghui 2018-7-10
const Redis = require('./redis');
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
    this.fieldMap = {};
    this._options = {
      tableName: '', //集合名
      fields: {}, //集合字段
      select: [], //只返回的字段
      database: Object.keys(WOOD.config.mysql)[0],
      ...opts
    };
    if (!this._options.tableName) console.error('表名不能为空');
    this.redis = new Redis.client(this._options.tableName);
    this.db = new Mysql(this._options);
    this.SQL = this.db.query();
    this._initFields();
    if (data) this.setData(data);

    this.db.createTable();
    return Object.create(this, this._get_set());
  }

  // 设置getter和setter
  _get_set() {
    let obj = {};
    for (let key in this.fieldMap) {
      obj[key] = {
        get() {
          if (WOOD.config.isDebug) console.warn(`getter: ${key}`);
          return this.fieldMap[key].value || this.fieldMap[key].defaultValue;
        },
        set(val) {
          if (WOOD.config.isDebug) console.warn(`setter: ${key}, ${val}`);
          this.fieldMap[key].value = val;
        }
      }
    }
    return obj;
  }

  // 初始化字段
  _initFields() {
    let fields = this._options.fields;
    for (let key in fields) {
      let field = fields[key];
      if (field == undefined || key === 'id') continue;
      fields[key] = this._defaultValue(field);;
      this.fieldMap[key] = fields[key];
    }
  }

  //默认值
  _defaultValue(value = {}) {
    let defaultValue = '';
    if (typeof value == 'object' && !Array.isArray(value)) {
      defaultValue = value.default;
    }
    switch (value.type) {
      case 'int':
        value.default = defaultValue || (value.required ? NaN : 0);
        break;
      case 'boolean':
        value.default = defaultValue || false;
        break;
      case 'datetime':
        value.default = defaultValue || Util.moment().format('YYYY-MM-DD HH:mm:ss');
        break;
      default:
        value.default = defaultValue || '';
        break;
    }
    return value;
  }

  parseParams(body = {}){
    let result = {};
    if(body.data){
      const { order, page = 1, limit = 20, largepage = 1, ...where } = body.data;
      result = { order, page, limit, largepage, where };
    }
    return result;
  }

  // 设置数据
  setData(target, value) {
    let fields = this._options.fields;
    if (target !== undefined && value !== undefined) {
      if (typeof target == 'string') {
        if (!fields[target]) return;
        fields[target].value = value;
      } else {
        target.value = value;
      }
    } else if (typeof target == 'object' && !Array.isArray(target) && value == undefined) {
      if (!Util.isEmpty(target)) {
        for (let key in fields) {
          let value = target[key];
          if (value == undefined) continue;
          fields[key].value = value;
        }
      }
    }
  }

  // 获取模型数据
  getData(hasVirtualField = true) {
    let fields = this._options.fields, parentData = {};
    if (!Util.isEmpty(fields)) {
      for (let key in fields) {
        let field = fields[key];
        if (!hasVirtualField && field.type == 'virtual') continue;
        if (typeof field == 'object' && !Array.isArray(field)) {
          let theVal = field.value !== undefined ? field.value : field.default;
          if(field.type == 'datetime') theVal = theVal.replace(/'/g, '');
          if(theVal !== undefined) parentData[key] = theVal;
        } else if (typeof field !== 'function') {
          if(field !== undefined) parentData[key] = field;
        }
      }
    }
    return parentData;
  }

  _validateError(key, field) {
    let err = null,
      errObj = Util.deepCopy(WOOD.error_code.error_validation);
    if (typeof field == 'object') {
      let value = field.value !== undefined ? field.value : field.default;
      // 验证是否空值
      if (field.notNull) {
        let isOk = true;
        if (value == undefined) isOk = false;
        if (typeof value == 'string' && value == '') isOk = false;
        if (!isOk) {
          err = errObj;
          err.msg += `, [${key}]不能为空`;
          return err;
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
    let fields = this._options.fields;
    let hasErr = false;
    for (let key in fields) {
      if(key === 'id') continue;
      let field = fields[key];
      hasErr = this._validateError(key, field);
      if (hasErr) break;
    }
    return hasErr;
  }

  // 是否新的
  isNew() {
    return !this.id;
  }

  //新增数据
  async create(data, times) {
    if (!data) throw error('create方法的参数data不能为空');
    if (WOOD.config.isDebug) console.warn('新增记录');
    let hasId = false;
    if(Array.isArray(data)){
      hasId = !!data.find(item => item.id);
    }else{
      hasId = !!data.id;
    }
    if (!hasId) {
      let err = this.validate();
      if (err) throw error(err);
      const lock = await catchErr(this.redis.lock());
      if (lock.data) {
        data = Array.isArray(data) ? data : [data];
        let newData = [];
        let defaultValue = this.getData();
        data.forEach(item => {
          newData.push(Object.assign(JSON.parse(JSON.stringify(defaultValue)), item));
        });
        let sql = this.SQL.insert(newData);
        const result = await catchErr(this.db.execute(sql));
        if (result.data){
          return result.data;
        }else{
          throw error(result.err);
        }
      }else{
        throw error(lock.err);
      }
    }else{
      throw error('新增数据不能包含id');
    }
  }

  // 更新数据
  async update(data, required = false) {
    if (!data) throw error('update方法的参数data不能为空');
    if (!this.isNew() || data.id) {
      let err = this.validate(),
        id = this.id || data.id;
      if (!required) err = false;
      if (err) {
        throw error(err);
      } else {
        let isLock = await catchErr(this.redis.lock());
        if (isLock.data) {
          let sql = this.SQL.where({ id }).update(data);
          const result = await catchErr(this.db.execute(sql));
          if (result.data){
            return result.data;
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
    if (!this.isNew() || data.id) {
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
      let sql = this.SQL.delete(data);
      return await this.db.execute(sql);
    }else{
      throw error(lock.err);
    }
  }

  //清空数据
  async clear() {
    const lock = await catchErr(this.redis.lock());
    if (lock.data) {
      return this.db.drop();
    }else{
      throw error(lock.err);
    }
  }

  // 计算总记录数
  async count(body = {}, noCatch = true) {
    if (!body.data) throw error('count方法参数data不能为空');
    const result = await catchErr(this.getQuery(body, false));
    if (result.data) {
      let query = result.data;
      let theKey = query.listKey + '_count',
        count = 0,
        timeout = 60 * 1, //5分钟
        hasKey = await this.redis.existKey(theKey);
      if (hasKey && noCatch) {
        await this.redis.delKey(theKey); //删除已有的key
        hasKey = false;
      }
      if (hasKey && !noCatch) {
        if (WOOD.config.isDebug) console.warn('已有count');
        let arr = await this.redis.listSlice(theKey, 0, 1);
        if (arr.length) count = arr[0];
      } else {
        if (WOOD.config.isDebug) console.warn('没有count');
        if (query.hasKey && !noCatch) {
          count = await this.redis.listCount(query.listKey);
        } else {
          query.select(['count(*)']);
          let countObj = await this.db.execute(query);
          count = countObj[0]['count(*)'];
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
      params = this.parseParams(body),
      limit = params.limit == undefined ? 20 : Number(params.limit),
      page = params.page || 1,
      where = params.where || {},
      order = params.order || ['id desc'],
      largepage = params.largepage || 1;
    page = page % Math.ceil(largelimit / limit) || 1;
    let listKey = await Util.getListKey(body); //生成listkey
    let hasKey = await this.redis.existKey(listKey); //key是否存在
    if (clearListKey && hasKey) {
      await this.redis.delKey(listKey); //删除已有的key
      hasKey = false;
    }
    if (hasKey) {
      let startIndex = (page - 1) * limit;
      where.id = await this.redis.listSlice(listKey, startIndex, startIndex + limit - 1);
      where.id = where.id.map(item => parseInt(item));
    }
    let query = this.db.query().where(where);
    query.listKey = listKey;
    query.hasKey = hasKey;
    let obj = {};
    for (let key in where) {
      if (!this._options.fields[key]) continue;
      if (Array.isArray(where[key])) {
        obj[key] = {
          $in: where[key]
        };
      } else {
        obj[key] = where[key];
      }
    }
    query.where(obj).order(order);
    return query;
  }

  // 查询单条记录
  async queryOne(data, addLock = true) {
    if (!body) throw error('queryOne方法参数data不能为空');
    const hasLock = addLock ? await catchErr(this.redis.hasLock()) : {data: 0};
    if(hasLock.err){
      throw error(hasLock.err);
    }else{
      if (!hasLock.data) {
        let query = this.db.query().select(!Util.isEmpty(this._options.select) ? this._options.select : []);
        if (typeof data == 'number') {
          query.where({
            id: data
          });
        } else if (typeof data == 'object') {
          query.where(data);
        }
        let result = await this.db.execute(query);
        return Array.isArray(result) ? result[0] : {};
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
  async queryList(body = {}, noCatch = true, addLock = true) {
    let hasLock = addLock ? await catchErr(this.redis.hasLock()) : {data: 0};
    if(hasLock.err){
      throw error(hasLock.err);
    }else{
      if (!hasLock.data) {
        if (!body.data) throw error('queryList方法参数data不能为空');
        let timeout = 60 * 1; //半小时
        const result = await catchErr(this.getQuery(body, noCatch));
        if (result.data) {
          let query = result.data.select(!Util.isEmpty(this._options.select) ? this._options.select : []);
          if (WOOD.config.isDebug) console.warn(`请求列表, ${query.hasKey ? '有' : '无'}listKey`);
          const docsResult = await catchErr(this.db.execute(query));
          if (docsResult.data) {
            let docs = docsResult.data;
            // 缓存id
            if (!query.hasKey && docs.length) {
              if (docs.length >= largelimit) {
                body.data.largepage = body.data.largepage || 1;
                let startNum = (body.data.largepage - 1) * largelimit;
                docs = docs.slice(startNum, startNum + largelimit);
              }
              await this.redis.listPush(query.listKey, docs.map(item => item.id));
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
        return this.queryList(body, noCatch, addLock);
      }
    }
  }
}

module.exports = Model;
