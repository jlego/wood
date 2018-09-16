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
const Docx = require('./src/docx');
const { error, catchErr } = Util;

function startApp() {
  const app = express();
  app.use(express.static('docs'));
  app.use(bodyParser.json());

  // 跨域
  if (CONFIG.crossDomain) {
    app.all('*',
      function(req, res, next) {
        res.header("Access-Control-Allow-Origin", req.headers.origin);
        res.header("Access-Control-Allow-Headers", CONFIG.verifyLogin ? "Content-Type,project,token,secretkey" : "Content-Type");
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("Access-Control-Allow-Credentials", true);
        next();
      });
  }
  const middleware = require('./src/middleware');
  for(let key in middleware){
    app.use(middleware[key]);
  }

  // 加载模块
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
  app.use('/', Router.get(Docx.path, Docx.fun));

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
  if(!CONFIG.gateway){
    const httpServer = app.listen(
      CONFIG.service.http_server.listenport,
      function() {
        let host = httpServer.address().address;
        let port = httpServer.address().port;
        console.log('http server running at http://' + host + ':' + port, 'homepath:', __dirname);
      }
    );
  }
}

module.exports = {
  Controller: require('./src/controller'),
  Model: require('./src/model'),
  Modelsql: require('./src/modelsql'),
  Tcp: require('./src/tcp'),
  Util,
  error,
  catchErr,
  Mongo,
  Mysql,
  Redis,
  Router,
  start(opts) {
    let that = this;
    if(opts) Object.assign(global.CONFIG, opts);
    if(!Util.isEmpty(global.CONFIG)){
      const mongourl = CONFIG.mongodb.mongodb_config.mongourl;
      // redis
      if(CONFIG.redis.proxy) Redis.connect(CONFIG.redis.proxy);
      // mysql
      if(CONFIG.mysql.main){
        new Mysql().connect('main', function() {
          if(!mongourl) startApp();
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
