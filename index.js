// 入口文件
// by YuRonghui 2018-11-11
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
global.CONFIG = require('./src/config') || {};
const Mongo = require('./src/mongo');
const Mysql = require('./src/mysql');
const Redis = require('./src/redis');
const Router = express.Router();
const Util = require('./src/util');
const Middlewares = require('./src/middleware');
const Model = require('./src/model');
const Controller = require('./src/controller');
const Fields = require('./src/fields');
const Modelsql = require('./src/modelsql');
const Tcp = require('./src/tcp');
const { error, catchErr } = Util;

class App{
  constructor(){
    this.models = new Map();
    this.controllers = new Map();
    this.Controller = key => {
      if(key && this.controllers.has(key)){
        return this.controllers.get(key);
      }
      return Controller;
    };
    this.Model = (key, fields, select) => {
      if(key){
        if(this.models.has(key)){
          return this.models.get(key);
        }
        if(key && fields){
          let theModel = new Model();
          theModel.tableName = key;
          theModel.fields = fields;
          theModel.select = select || { rowid: -1 };
          theModel.redis = new Redis.client(key);
          theModel.db = new Mongo.client(key);
          this.models.set(key, theModel);
          theModel._init();
          return this.models.get(key);
        }
      }
      return Model;
    };
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
    this.Router = Router;
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
          switch(type){
            case 'controller':
              let controllerName = moduleName.replace('Controller', '');
              if(!this.controllers.has(controllerName)){
                this.controllers.set(controllerName, new theModule());
              }
              break;
            case 'model':
              break;
            default:
              app.use('/', theModule);
          }
        }
      });
    });
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
    if(!Util.isEmpty(CONFIG)){
      const mongourl = CONFIG.mongodb.mongodb_config.mongourl;
      // redis
      if(CONFIG.redis.proxy) Redis.connect(CONFIG.redis.proxy);
      // mysql
      if(CONFIG.mysql){
        new Mysql().connect().then(() => {
          if(!mongourl) {
            this.init();
          }
        });
      }
      // mongodb
      if(mongourl){
        Mongo.connect(mongourl, (err, client) => {
          this.init();
        });
      }
    }else{
      console.error('系统配置不能为空!');
    }
  }
};
global.CTX = new App();
module.exports = global.CTX;
