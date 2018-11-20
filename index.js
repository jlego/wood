// wood-core update by YuRonghui 2018-11-18
const express = require('express');
const bodyParser = require('body-parser');
const config = require('./src/config');
const Util = require('./src/util');
const Errorcode = require('./src/errorcode');
const plugin = require('./src/plugin');
const _props = new Map();
const _middlewares = new Set();
const hasProps = [
  'config',
  'express',
  'error_code',
  'error',
  'catchErr',
  'use',
  'addAppProp',
  'Plugin',
  '_plugins',
  'init',
  'start',
];

class App {
  constructor() {
    this.config = config || {}
    this.error_code = Errorcode; // 错误码
    this.express = express;
    this.error = Util.error;
    this.catchErr = Util.catchErr;
    this._plugins = null;
  }

  // 安装中间件
  use(fun) {
    if (!_middlewares.has(fun)) {
      _middlewares.add(fun);
    }
  }

  // 添加内置属性
  addAppProp(pluginName, key, val) {
    if(!hasProps.includes(key)){
      if (_props.has(key)) {
        if(this.config.isDebug) {
          console.warn(`[plugin:${pluginName}] -> [prop:${key}] is used in [${_props.get(key)}]`);
        }
        return;
      }
      if (typeof val === 'function'){
        val = val.bind(this);
      }
      _props.set(key, pluginName);
      this[key] = val;
    }
  }

  // 插件
  Plugin(pluginName) {
    return this._plugins ? this._plugins.get(pluginName) : {};
  }

  // 初始化应用
  async init() {
    const app = express();
    this.application = app;
    if (!this.config.isDebug){
      app.set('env', 'production');
    }
    app.use(bodyParser.json());

    //加载插件
    await Util.catchErr(new plugin(this).loader());

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
    if (opts){
      Object.assign(this.config, opts);
    }
    if (this.config.errorCode) {
      Object.assign(this.error_code, this.config.errorCode);
    }
    this.init();
  }
};
module.exports = global.WOOD = new App();
