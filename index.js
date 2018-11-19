// wood-core
// update by YuRonghui 2018-11-18
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./src/config');
const Util = require('./src/util');
const Errorcode = require('./src/errorcode');
const plugin = require('./src/plugin');
const _middlewares = new Set();
let _plugins = null;

class App {
  constructor() {
    this.config = config || {}
    this.express = express;
    this.error_code = Errorcode;  // 错误码
    this.error = Util.error;
    this.catchErr = Util.catchErr;
  }
  // 安装中间件
  use(fun){
    if(!_middlewares.has(fun)) _middlewares.add(fun);
  }

  // 插件
  Plugin(pluginName) {
    return _plugins ? _plugins.get(pluginName) : {};
  }

  // 初始化应用
  async init() {
    const app = express();
    if (!this.config.isDebug) app.set('env', 'production');
    app.use(bodyParser.json());

    //加载插件
    let result = await Util.catchErr(new plugin(this).getPlugin(app));
    if(result.data) _plugins = result.data;

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
    if (this.config.errorCode) {
      Object.assign(this.error_code, this.config.errorCode);
    }
    if (!Util.isEmpty(this.config)) {
      this.init();
    } else {
      console.error('系统配置不能为空!');
    }
  }
};
module.exports = global.WOOD = new App();
