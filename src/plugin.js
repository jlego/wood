/*
 * @Author: Jc
 * @Date: 2018-11-16 14:39:12
 * @Last Modified by: jlego 2018-11-18
 * @Des: 插件功能类
 */
const { catchErr } = require('wood-util')();
const path = require('path');
const fs = require('fs');

class Plugin {
  constructor(ctx) {
    this.ctx = ctx;
  }
  toPromise(val){
    if(!(val instanceof Promise)){
      return new Promise((resolve, reject) => {
        resolve(val);
      });
    }else{
      return val;
    }
  }
  isDev() {
    return 'development' == process.env.NODE_ENV;
  }
  _inspectEnvOpen(plugin) {
    return !("env" in plugin) || plugin.env == process.env.NODE_ENV;
  }
  async getPlugin(application) {
    this.ctx.application = application;
    const pluginConfig = this.ctx.config.plugins,
      pluginMap = new Map();
    if (pluginConfig && Object.keys(pluginConfig).length > 0) {
      for(let field of Object.keys(pluginConfig)){
        let plugin = pluginConfig[field],
          envOpen = this._inspectEnvOpen(plugin);
        if (plugin.enable && envOpen) {
          let pluginPackage = require(path.resolve('./node_modules/', plugin.package));
          if(typeof pluginPackage === 'function'){
            let res = await catchErr(this.toPromise(pluginPackage(this.ctx, plugin.config)));
            // console.warn('----------', field);
            if(res.data) pluginMap.set(field, res.data);
          }
        } else {
          console.warn(`plugin：[${field}] is not enable or env incompatible current NODE_ENV`)
        }
      }
    }
    if (this.isDev()) console.log('pluginMap：', pluginMap);
    return pluginMap;
  }
}

module.exports = Plugin;
