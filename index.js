// wood-core
// update by YuRonghui 2018-11-18
const express = require('express');
const bodyParser = require('body-parser');
global.Promise = require("bluebird");
const config = require('./src/config');
const Util = require('./src/util');
const Errorcode = require('./src/errorcode');
const plugin = require('./src/plugin');
const { error, catchErr, isEmpty } = Util;
const _middlewares = new Set();

class App {
  constructor() {
    this.config = config || {}
    this.express = express;
    this.error_code = Errorcode;  // 错误码
    this.error = error;
    this.catchErr = catchErr;
  }
  // 安装中间件
  use(fun){
    if(!_middlewares.has(fun)) _middlewares.add(fun);
  }

  // 插件
  Plugin(pluginName) {
    return this._plugins ? this._plugins.get(pluginName) : {};
  }

  // 初始化应用
  init() {
    const app = express();
    this.application = app;
    if (!this.config.isDebug) app.set('env', 'production');
    app.use(bodyParser.json());

    //加载插件
    this._plugins = new plugin(this).getPlugin();

    // 加载中间件
    _middlewares.forEach(fun => {
      app.use(fun);
    });

    // 拦截其他异常
    process.on('uncaughtException', function (err) {
      console.log('Caught exception: ', err);
    });
  }
  // 启动应用
  start(opts = {}) {
    if (opts) Object.assign(this.config, opts);
    if (this.config.errorCode) Object.assign(this.error_code, this.config.errorCode);
    if (!isEmpty(this.config)) {
      this.init();
    } else {
      console.error('系统配置不能为空!');
    }
  }
};
module.exports = global.WOOD = new App();
