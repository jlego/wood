// mysql操作方法类
// by YuRonghui 2018-7-9
const Query = require('./querysql');
const mysql = require('mysql2/promise');
const Util = require('./util');
const {
  error,
  catchErr
} = Util;
let pools = {}; //连接池
let tables = {}; //数据表名单

class Mysql {
  constructor(opts = {}) {
    this.options = {
      tableName: '', //集合名
      fields: {}, //集合字段
      select: [], //只返回的字段
      dbConfig: 'main',
      ...opts
    };
  }
  // 返回查询对象
  query(tableName) {
    return new Query(tableName ? tableName : this.options.tableName);
  }
  // 创建数据库连接
  connect(config, callback) {
    if(!pools[config]){
      if(CONFIG.mysql[config]) {
        pools[config] = mysql.createPool(CONFIG.mysql[config]);
        if(pools[config]) {
          console.log('Mysql connected Successfull');
          if(callback) callback();
          pools[config].on('acquire', function (connection) {
            console.log('Mysql connection %d acquired', connection.threadId);
          });
          pools[config].on('connection', function (connection) {
            console.log('Mysql connected Successfull as id ' + connection.threadId);
          });
          pools[config].on('enqueue', function () {
            console.log('Waiting for available connection slot');
          });
          pools[config].on('release', function (connection) {
            console.log('Connection %d released', connection.threadId);
          });
        }
      }
    }
  }
  // 获取连接
  getConn(dbConfig){
    return pools[dbConfig ? dbConfig : this.options.dbConfig];
  }
  // 创建表
  createTable(){
    const {fields, tableName} = this.options;
    if(tables[tableName]) return;
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
      if(length !== undefined) sqlStr = sqlStr.replace(/\s+(int|char|varchar|float)\s+/, ` $1(${Array.isArray(length) ? length.join(',') : length}) `);
    });
    sqlStr += ' default charset=utf8;'
    this.getConn().execute(sqlStr);
    tables[tableName] = true;
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
