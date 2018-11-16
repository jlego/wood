// 入口文件
// update by YuRonghui 2018-11-11
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
global.Promise = require("bluebird");
const config = require('./src/config');
const Mongo = require('./src/mongo');
const Mysql = require('./src/mysql');
const Redis = require('./src/redis');
const Router = require('./src/router');
const Util = require('./src/util');
const Middlewares = require('./src/middleware');
const Model = require('./src/model');
const Controller = require('./src/controller');
const Query = require('./src/query');
const Fields = require('./src/fields');
const Modelsql = require('./src/modelsql');
const Tcp = require('./src/tcp');
const Errorcode = require('./src/errorcode');
const { error, catchErr, isEmpty } = Util;
const _models = new Map();
const _controllers = new Map();
const _routers = new Map();
const _middlewares = new Map();
const _plugins = new Map();

class App{
  constructor(){
    this.config = config || {}
    this.error_code = Errorcode,  // 错误码
    this.Fields = Fields;
    this.Tcp = Tcp;
    this.Util = Util;
    this.error = error;
    this.catchErr = catchErr;
    this.Mongo = Mongo;
    this.Mysql = Mysql;
    this.Redis = Redis;
    this.models = _models;
  }
  // 中间件
  Middleware(name, fun){
    if(!_middlewares.has(name) && fun) _middlewares.set(name, fun);
    return _middlewares.get(name);
  }
  // 路由
  Router(controllerName) {
    if(_routers.has(controllerName)){
      return _routers.get(controllerName);
    }else{
      let _router = new Router(controllerName, _controllers);
      if(controllerName) _routers.set(controllerName, _router);
      return _router;
    }
  }
  // 查询条件对象
  Query(req = {}) {
    return Query.getQuery(req);
  }
  // 控制器
  Controller(modelName) {
    if(modelName && _controllers.has(modelName)){
      return _controllers.get(modelName);
    }
    return Controller;
  }
  // 数据模型
  Model(_tableName, fields, select = {}) {
    let nameArr = _tableName.split('.'),
      dbName = nameArr.length > 1 ? nameArr[0] : 'master',
      tableName = nameArr.length > 1 ? nameArr[1] : nameArr[0];
    if(tableName){
      if(_models.has(tableName)){
        let _model = _models.get(tableName);
        _model.resetData();
        return _model;
      }
      if(tableName && fields){
        let theModel = new Model({
          tableName,
          fields,
          select
        });
        theModel.redis = new Redis(tableName);
        theModel.db = new Mongo(tableName, dbName);
        _models.set(tableName, theModel);
        theModel._init();
        return _models.get(tableName);
      }
    }
    return Model;
  }
  // 初始化应用
  init() {
    const app = express();
    if(!this.config.isDebug) app.set('env', 'production');
    app.use(express.static('docs'));
    app.use(bodyParser.json());

    // 跨域
    if (this.config.crossDomain) {
      app.all('*', (req, res, next) => {
          res.header("Access-Control-Allow-Origin", this.config.crossDomain);
          res.header("Access-Control-Allow-Headers", this.config.verifyLogin ? "Content-Type,token,secretkey" : "Content-Type");
          res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
          res.header("Access-Control-Allow-Credentials", true);
          next();
        });
    }
    
    // 内置中间件
    app.use(this.Middleware('responseFormat', Middlewares.responseFormat));
    app.use(this.Middleware('requestBody', Middlewares.requestBody));

    // 加载模块
    ['model', 'controller', 'route'].forEach(type => {
      let dirPath = this.config.registerDirs[type];
      const dirList = fs.readdirSync(path.resolve(__dirname, dirPath));
      dirList.forEach((fileName) => {
        let nameArr = fileName.split('.'),
          moduleName = nameArr[0],
          fileExt = nameArr[1];
        if(fileExt === 'js'){
          let theModule = require(path.resolve(__dirname, `${dirPath}/${moduleName}`));
          if(type === 'controller') {
            let controllerName = moduleName.replace('Controller', '');
            if(!_controllers.has(controllerName)){
              theModule = typeof theModule === 'function' ? new theModule({}, _models) : theModule;
              _controllers.set(controllerName, theModule);
            }
          }
        }
      });
    });

    // 加载路由
    app.use('/', this.Router().getRouter());

    // 生成api文档
    if(this.config.buildDocx){
      const Docx = require('./src/docx');
      app.use('/', this.Router().get(Docx.path, Docx.fun));
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
      res.print(this.error_code.error_noroute);
    });
    // 拦截其他异常
    process.on('uncaughtException', function (err) {
      console.log('Caught exception: ', err);
    });

    // 监听服务端口
    if(this.config.openHttpServer){
      const httpServer = app.listen(
        this.config.service.http_server.listenport,
        function() {
          let host = httpServer.address().address;
          let port = httpServer.address().port;
          console.log('http server running at http://' + host + ':' + port, 'homepath:', __dirname);
        }
      );
    }
  }
  // 启动应用
  start(opts) {
    if(opts) Object.assign(this.config, opts);
    if(!isEmpty(this.config)){
      // redis
      if(this.config.redis) {
        for(let key in this.config.redis){
          Redis.connect(this.config.redis[key]);
        }
      }
      // mysql
      if(this.config.mysql){
        new Mysql().connect().then(() => {
          if(this.config.defaultDB === 'mysql') this.init();
        });
      }
      // mongodb
      if(this.config.mongodb){
        for(let key in this.config.mongodb){
          Mongo.connect(this.config.mongodb[key], key, (err, client) => {
            if(this.config.defaultDB === 'mongodb' && key === 'master') this.init();
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
