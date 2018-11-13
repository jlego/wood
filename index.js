// 入口文件
// by YuRonghui 2018-11-11
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
global.Promise = require("bluebird");
global.CONFIG = require('./src/config') || {};
const Mongo = require('./src/mongo');
const Mysql = require('./src/mysql');
const Redis = require('./src/redis');
const Router = express.Router();
const Util = require('./src/util');
const Middlewares = require('./src/middleware');
const Model = require('./src/model');
const Controller = require('./src/controller');
const Query = require('./src/query');
const Fields = require('./src/fields');
const Modelsql = require('./src/modelsql');
const Tcp = require('./src/tcp');
const { error, catchErr, isEmpty } = Util;
const models = new Map();
const controllers = new Map();

class App{
  constructor(){
    this.Router = Router;
    this.Fields = Fields;
    this.Modelsql = Modelsql;
    this.Tcp = Tcp;
    this.Middlewares = Middlewares;
    this.Util = Util;
    this.error = error;
    this.catchErr = catchErr;
    this.Mongo = Mongo;
    this.Mysql = Mysql;
    this.Redis = Redis;
    this.models = models;
    this.controllers = controllers;
  }
  // 查询条件对象
  Query(req = {}) {
    return Query.getQuery(req);
  }
  Controller(name) {
    if(name && controllers.has(name)){
      return controllers.get(name);
    }
    return Controller;
  }
  Model(_tableName, fields, select = {}) {
    let nameArr = _tableName.split('.'),
      dbName = nameArr.length > 1 ? nameArr[0] : 'master',
      tableName = nameArr.length > 1 ? nameArr[1] : nameArr[0];
    if(tableName){
      if(models.has(tableName)){
        return models.get(tableName);
      }
      if(tableName && fields){
        let theModel = new Model({
          tableName: tableName,
          fields,
          select
        });
        theModel.redis = new Redis(tableName);
        theModel.db = new Mongo(tableName, dbName);
        models.set(tableName, theModel);
        theModel._init();
        return models.get(tableName);
      }
    }
    return Model;
  }
  // 添加中间件
  use(opts){
    if(typeof opts === 'object'){
      Object.assign(Middlewares, opts);
    }else if(typeof opts === 'function'){
      Middlewares[opts.name] = opts;
    }
  }
  // 初始化应用
  init() {
    const app = express();
    if(!CONFIG.isDebug) app.set('env', 'production');
    app.use(express.static('docs'));
    app.use(bodyParser.json());

    // 跨域
    if (CONFIG.crossDomain) {
      app.all('*',
        function(req, res, next) {
          res.header("Access-Control-Allow-Origin", req.headers.origin);
          res.header("Access-Control-Allow-Headers", CONFIG.verifyLogin ? "Content-Type,token,secretkey" : "Content-Type");
          res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
          res.header("Access-Control-Allow-Credentials", true);
          next();
        });
    }
    // 内置中间件
    app.use(Middlewares.responseFormat);
    app.use(Middlewares.requestBody);

    // 加载模块
    ['model', 'controller', 'route'].forEach(type => {
      let dirPath = CONFIG.registerDirs[type];
      const dirList = fs.readdirSync(path.resolve(__dirname, dirPath));
      dirList.forEach((fileName) => {
        let nameArr = fileName.split('.'),
          moduleName = nameArr[0],
          fileExt = nameArr[1];
        if(fileExt === 'js'){
          let theModule = require(path.resolve(__dirname, `${dirPath}/${moduleName}`));
          if(type === 'controller') {
            let controllerName = moduleName.replace('Controller', '');
            if(!controllers.has(controllerName)){
              theModule = typeof theModule === 'function' ? new theModule() : theModule;
              controllers.set(controllerName, theModule);
            }
          }
        }
      });
    });
    app.use('/', Router);

    // 生成api文档
    if(CONFIG.buildDocx){
      const Docx = require('./src/docx');
      app.use('/', Router.get(Docx.path, Docx.fun));
    }

    // 返回错误信息
    app.use(function(err, req, res, next) {
      if (err) {
        res.status(err.status || 500);
        res.print(error(err));
        return;
      }
      next();
    });

    app.use(function(req, res, next) {
      res.status(404);
      res.print(CONFIG.error_code.error_noroute);
    });

    process.on('uncaughtException', function (err) {
      console.log('Caught exception: ', err);
    });

    // 监听服务端口
    const httpServer = app.listen(
      CONFIG.service.http_server.listenport,
      function() {
        let host = httpServer.address().address;
        let port = httpServer.address().port;
        console.log('http server running at http://' + host + ':' + port, 'homepath:', __dirname);
      }
    );
  }
  // 启动
  start(opts) {
    let that = this;
    if(opts) Object.assign(CONFIG, opts);
    if(!isEmpty(CONFIG)){
      // redis
      if(CONFIG.redis) {
        for(let key in CONFIG.redis){
          Redis.connect(CONFIG.redis[key]);
        }
      }
      // mysql
      if(CONFIG.mysql){
        new Mysql().connect().then(() => {
          if(CONFIG.defaultDB === 'mysql') this.init();
        });
      }
      // mongodb
      if(CONFIG.mongodb){
        for(let key in CONFIG.mongodb){
          Mongo.connect(CONFIG.mongodb[key].dburl, key, (err, client) => {
            if(CONFIG.defaultDB === 'mongodb' && key === 'master') this.init();
          });
        }
      }
    }else{
      console.error('系统配置不能为空!');
    }
  }
};
global.APP = global.CTX = new App();
module.exports = global.APP;
