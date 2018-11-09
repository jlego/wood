// 入口文件
// by YuRonghui 2018-4-12
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
global.CONFIG = require('./src/config');
const Mongo = require('./src/mongo');
const Mysql = require('./src/mysql');
const Redis = require('./src/redis');
const Router = express.Router();
const Util = require('./src/util');
const Middlewares = require('./src/middleware');
const Model = require('./src/model');
const { error, catchErr } = Util;

function startApp() {
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
  // 中间件
  app.use(Middlewares.responseFormat);
  app.use(Middlewares.requestBody);

  // 加载路由模块
  if(CONFIG.routes){
    CONFIG.routes.forEach((moduleRoute) => {
      app.use('/', moduleRoute);
    });
  }else{
    const dirList = fs.readdirSync(path.resolve(__dirname, '../../routes'));
    dirList.forEach((fileName) => {
      let nameArr = fileName.split('.'),
        moduleName = nameArr[0],
        fileExt = nameArr[1];
      if(fileExt == 'js'){
        let moduleRoute = require(path.resolve(__dirname, `../../routes/${moduleName}`));
        app.use('/', moduleRoute);
      }
    });
  }

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

  // 监听服务
  const httpServer = app.listen(
    CONFIG.service.http_server.listenport,
    function() {
      let host = httpServer.address().address;
      let port = httpServer.address().port;
      console.log('http server running at http://' + host + ':' + port, 'homepath:', __dirname);
    }
  );
}

module.exports = {
  _models: new Map(),
  Controller: require('./src/controller'),
  Model: new Model(this),
  Fields: require('./src/fields'),
  Modelsql: require('./src/modelsql'),
  Tcp: require('./src/tcp'),
  Middlewares,
  Util,
  error,
  catchErr,
  Mongo,
  Mysql,
  Redis,
  Router,
  addMiddleware(opts){
    if(typeof opts === 'object'){
      Object.assign(Middlewares, opts);
    }else if(typeof opts === 'function'){
      Middlewares[opts.name] = opts;
    }
  },
  start(opts) {
    let that = this;
    if(opts) Object.assign(global.CONFIG, opts);
    if(!Util.isEmpty(global.CONFIG)){
      const mongourl = CONFIG.mongodb.mongodb_config.mongourl;
      // redis
      if(CONFIG.redis.proxy) Redis.connect(CONFIG.redis.proxy);
      // mysql
      if(CONFIG.mysql){
        new Mysql().connect().then(() => {
          if(!mongourl) {
            startApp();
          }
        });
      }
      // mongodb
      if(mongourl){
        Mongo.connect(mongourl, function (err, client) {
          startApp();
        });
      }
    }else{
      console.error('系统配置不能为空!');
    }
  }
};
