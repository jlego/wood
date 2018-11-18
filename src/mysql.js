// mysql操作方法类
// by YuRonghui 2018-7-9
const Query = require('./querysql');
const mysql = require('mysql2/promise');
const Util = require('./util');
const {
  error,
  catchErr
} = Util;
global.pools = {}; //连接池
global.tables = {}; //数据表名单

class Mysql {
  constructor(opts = {}) {
    this.options = {
      tableName: '', //集合名
      fields: {}, //集合字段
      select: [], //只返回的字段
      database: '',
      ...opts
    };
  }
  // 返回查询对象
  query(tableName) {
    return new Query(tableName ? tableName : this.options.tableName);
  }
  // 创建数据库连接池
  async connect() {
    for(let dbName in WOOD.config.mysql){
      if(!global.pools[dbName]){
        if(WOOD.config.mysql[dbName]) {
          let opts = WOOD.config.mysql[dbName];
          opts.database = dbName;
          global.pools[dbName] = await mysql.createConnection(opts);
          console.log('Mysql connected Successfull');
        }
      }
    }
  }
  // 获取连接
  getConn(database){
    return global.pools[database || this.options.database];
  }
  // 创建表
  createTable(){
    const {fields, tableName} = this.options;
    if(global.tables[tableName]) return;
    for(let key in fields){
      if(fields[key].type === 'datetime'){
        fields[key].default = `'${fields[key].default}'`;
      }
    }
    let sql = this.query(),
      [sqlStr, values] = sql.create(tableName, fields).toSQL(),
      fieldsArr = Object.values(fields);
    fieldsArr.forEach(item => {
      let length = item.length;
      if(length !== undefined) {
        sqlStr = sqlStr.replace(/\s+(int|char|varchar|float)\s+/, ` $1(${Array.isArray(length) ? length.join(',') : length}) `);
      }
    });
    sqlStr += ' default charset=utf8;'
    this.getConn().execute(sqlStr);
    global.tables[tableName] = true;
  }
  // 清除表
  dropTable() {
    this.getConn().execute(`drop table if exists \`${this.options.tableName}\`;`);
  }
  // 获取SQL
  _getQuery(sql) {
    if (sql._isQuery) {
      return sql.toSQL();
    } else {
      return sql;
    }
  }
  // 执行操作
  async execute(data = {}) {
    this.createTable();
    let sql = this._getQuery(data);
    console.warn(...sql);
    const result = await catchErr(this.getConn().execute(...sql));
    if(result.err){
      throw error(result.err);
    }else{
      return result.data[0];
    }
  }
}

module.exports = Mysql;
