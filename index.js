/*
 * @Author: jLego
 * @Last Modified by: jlego 2018-11-24
 * @Des: wood-core
 */
const express = require('express');
const bodyParser = require('body-parser');
const plugin = require('./src/plugin');
const _props = new Map();
const _plugins = new Map();
const _middlewares = new Set();
const _errorCode = {
  "success": {code: 0, msg: '请求成功'},
  "error": {code: 1, msg: '请求失败'},
  "error_unknown": {code: 2, msg: '未知错误'},
  "error_format": {code: 3, msg: '错误格式'},
  "error_nodata": {code: 4, msg: '暂无数据'},
  "error_body": {code: 5, msg: '请求参数不正确'},
  "error_body_data": {code: 6, msg: '请求参数data不能为空'}
};

class App {
  constructor() {
    this.config = {
      projectName: 'wood-node',  //项目名
      version: 'v1.2.0', //版本号
      env: 'development', //开发模式 production
      errorCode: _errorCode, //错误码
      plugins: {}, //插件配置
      defaultDB: 'mongodb', //默认数据库
      cluster: {
        cpus: 1 //大于1为多进程模式
      }
    };
  }

  // 安装中间件
  use(fun) {
    if (!_middlewares.has(fun)) {
      _middlewares.add(fun);
    }
  }

  // 添加内置属性
  addAppProp(pluginName, key, val) {
    const hasProps = [
      'config',
      'error',
      'catchErr',
      'use',
      'addAppProp',
      'Plugin',
      'start',
    ];
    if(!hasProps.includes(key)){
      if (_props.has(key)) {
        if(this.config.isDebug) {
          console.warn(`[plugin:${pluginName}] -> [prop:${key}] is used in [${_props.get(key)}]`);
        }
        return;
      }
      val = typeof val === 'function' ? val.bind(this) : val;
      _props.set(key, pluginName);
      this[key] = val;
    }
  }

  // 插件
  Plugin(pluginName) {
    return _plugins.get(pluginName);
  }

  // 错误对象
  error(err) {
    let result = {code: 1, msg: '请求失败'};
    if (typeof err === 'object') {
      if(err.message){
        result.msg = err.message;
        result.error = err;
      }else if(err.msg && err.code){
        result = err;
      }
    }else{
      if(typeof err == 'string') result.msg = err;
      result.error = err;
    }
    return result;
  }

  // 捕获异常
  catchErr(promise){
    return promise
      .then(data => ({ data }))
      .catch(err => ({ err }));
  }

  // 启动应用
  async start(opts = {}) {
    Object.assign(this.config, opts);
    Object.assign(this.config.errorCode, _errorCode, opts.errorCode || {});
    const app = express();
    this.application = app;
    app.set('env', this.config.env);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    // 加载中间件
    _middlewares.forEach(fun => {
      app.use(fun);
    });
    //加载插件
    let result = await this.catchErr(new plugin(this, _plugins).loader());
    if(result.err) console.warn(result.err);
  }
};

module.exports = new App();
