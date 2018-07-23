// 关联型查询对象类
// by YuRonghui 2018-7-10
const mongoSQL = require('mongo-sql');
const Util = require('./util');
// const mongoToSQL = require('mongo-to-sql');

class Query {
  constructor(tableName = '') {
    this._isQuery = true;
    this.sql = {
      type: 'select',
      table: tableName
    };
  }
  create(tableName, definition, ifNotExists = true){
    this.sql.type = 'create-table';
    if(tableName) this.sql.table = tableName;
    this.sql.ifNotExists = ifNotExists;
    if(definition) this.sql.definition = definition;
    return this;
  }
  drop(tableName, cascade = true, ifExists = true){
    this.sql.type = 'drop-table';
    if(tableName) this.sql.table = tableName;
    this.sql.cascade = cascade;
    this.sql.ifExists = ifExists;
    return this;
  }
  table(params){
    if(params) this.sql.table = params;
    return this;
  }
  index(name, params = {}){
    this.sql.type = 'create-index';
    if(!Util.isEmpty(params) && name) {
      this.sql = {
        ...this.sql,
        name,
        unique: true,
        concurrently: true,
        using: 'gin(id)',
        ...params
      };
    }
    return this;
  }
  view(name, orReplace = true, expression = {}){
    let newData = {...this.sql};
    this.sql = {
      ...newData,
      type: 'create-view',
      view: name,
      orReplace,
      expression
    }
    return this;
  }
  definition(columns = {}){
    if(!Util.isEmpty(columns)) this.sql.definition = Object.assign(this.sql.definition || {}, columns);
    return this;
  }
  alter(action = {}){
    this.sql.type = 'alter-table';
    if(!Util.isEmpty(action)) this.sql.action = action;
    return this;
  }
  alias(val){
    if(val) this.sql.alias = val;
    return this;
  }
  expression(params = {}){
    if(!Util.isEmpty(params)) this.sql.expression = Object.assign(this.sql.expression || {}, params);
    return this;
  }
  select(params = []) {
    this.sql.type = 'select';
    if(!Util.isEmpty(params)) this.sql.columns = params;
    return this;
  }
  insert(params){
    this.sql.type = 'insert';
    this.values(params);
    return this;
  }
  values(params){
    if(!Util.isEmpty(params)) {
      if(Array.isArray(params)){
        this.sql.values = params;
      }else{
        this.sql.values = Object.assign(this.sql.values || {}, params);
      }
    }
    return this;
  }
  update(params = {}) {
    this.sql.type = 'update';
    if(!Util.isEmpty(params)) this.sql.updates = Object.assign(this.sql.updates || {}, params);
    return this;
  }
  delete(params = {}) {
    this.sql.type = 'delete';
    if(!Util.isEmpty(params)) this.sql.deletes = Object.assign(this.sql.deletes || {}, params);
    return this;
  }
  from(tableName){
    if(tableName) this.sql.from = tableName;
    return this;
  }
  join(params = []){
    if(!Util.isEmpty(params)) this.sql.joins = params;
    return this;
  }
  withs(params = {}){
    if(!Util.isEmpty(params)) this.sql.withs = Object.assign(this.sql.withs || {}, params);
    return this;
  }
  where(params = {}) {
    if(!Util.isEmpty(params)) this.sql.where = Object.assign(this.sql.where || {}, params);
    return this;
  }
  groupBy(params = []) {
    if(!Util.isEmpty(params)) this.sql.groupBy = params;
    return this;
  }
  order(params) {
    this.sql.order = params ? params : ['id desc'];
    return this;
  }
  limit(val) {
    if(val) this.sql.limit = val;
    return this;
  }
  // 返回sql语句
  toSQL(){
    let result = mongoSQL.sql(this.sql),
      str = result.toString();
    str = str.replace(/(\$\d+)/g, '?').replace(/"/g, "`").replace('insert', 'replace');
    return [str, result.values];
  }
}

module.exports = Query;
