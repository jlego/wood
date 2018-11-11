// 查询对象类
// by YuRonghui 2018-2-6
const { getParams } = require('./util');

class Query {
  constructor(params = {}, db) {
    this.db = db;
    this._isQuery = true;
    if(!params.where) params = { where: params };
    this.query = { //查询条件
      where: {},
      select: {
        rowid: 1
      },
      sort: {
        rowid: -1
      },
      skip: 0,
      aggregate: [],
      ...params
    };
  }
  // 查询条件对象
  query(req = {}) {
    let where = {}, body = getParams(req);
    if(body && body.data) where = body.data.where || {};
    let query = this.db.query({ where });
    if(!Util.isEmpty(body)){
      let obj = {};
      for (let key in body) {
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
    }
    query.req = req;
    return query;
  }
  where(params = {}) {
    Object.assign(this.query.where, params);
    return this;
  }
  select(params = {}) {
    Object.assign(this.query.select, params);
    return this;
  }
  sort(params = {}) {
    Object.assign(this.query.sort, params);
    return this;
  }
  skip(val = 0) {
    this.query.skip = val;
    return this;
  }
  limit(val) {
    if (val) this.query.limit = parseInt(val);
    return this;
  }
  addFields(item = {}) {
    let fieldName = item.as;
    if (fieldName) {
      if (this.query.select[fieldName]) {
        this.query.addFields = this.query.addFields || {};
        if (item.relation == 'one') {
          // 一对一
          this.query.addFields[fieldName] = {
            $cond: {
              if: {
                $isArray: `$${fieldName}`
              },
              then: {
                $cond: {
                  if: {
                    $gt: [{
                      $size: `$${fieldName}`
                    }, 0]
                  },
                  then: {
                    $arrayElemAt: [`$${fieldName}`, 0]
                  },
                  else: {}
                }
              },
              else: `$${fieldName}`
            }
          };
        } else if (item.relation == 'many') {
          // 一对多
          // 过滤
          if (item.filter) {
            this.query.addFields[fieldName] = {
              $filter: {
                input: `$${fieldName}`,
                as: "item",
                cond: item.filter
              }
            };
          } else {
            // 条数
            let size = item.size || 10;
            this.query.addFields[fieldName] = {
              $slice: [`$${fieldName}`, size]
            };
          }
        }
      }
    }
  }
  // 关联表
  // key: '查询键'
  // as: '新字段名'
  // from: '来源表'
  populate(data = {}) {
    this.query.aggregate = [];
    for (let key in data) {
      let item = data[key];
      this.addFields(item);
      this.query.aggregate.push({
        "$lookup": {
          "from": item.from,
          "localField": key,
          "foreignField": item.key,
          "as": item.as
        }
      });
    }
    if (this.query.where) {
      this.query.aggregate.push({
        "$match": this.query.where
      });
    }
    if (this.query.select) {
      this.query.aggregate.push({
        "$project": this.query.select
      });
    }
    if (this.query.addFields) {
      this.query.aggregate.push({
        "$addFields": this.query.addFields
      });
    }
    if (this.query.skip) {
      this.query.aggregate.push({
        "$skip": this.query.skip
      });
    }
    if (this.query.limit) {
      this.query.aggregate.push({
        "$limit": this.query.limit
      });
    }
    if (this.query.sort) {
      this.query.aggregate.push({
        "$sort": this.query.sort
      });
    }
    return this;
  }
  // 执行查询
  exec(type = 'list') {
    let oper = 'find';
    switch (type) {
      case 'one':
        oper = 'findOne';
        break;
      case 'list':
        oper = 'find';
        break;
    }
    if (CONFIG.isDebug) console.warn(`query ${type}: ${this.print()}`);
    if (this.db[oper]) {
      if (this.query.aggregate.length) {
        return this.db.aggregate(this.query.aggregate, type == 'one' ? true : false);
      } else {
        return this.db[oper](this.toJSON());
      }
    }
    return error(CONFIG.error_code.error_nodata);
  }
  // 输出打印
  print() {
    return JSON.stringify(this.query);
  }
  toJSON() {
    return this.query;
  }
}

module.exports = Query;
