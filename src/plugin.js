/*
 * @Author: Jc
 * @Date: 2018-11-16 14:39:12
 * @Last Modified by: Jc
 * @Last Modified time: 2018-11-16 18:06:38
 * @Des: 插件功能类
 */
const { catchErr } = require('wood-util')();
const path = require('path');
const fs = require('fs');

function isDev() {
  return 'development' == process.env.NODE_ENV;
}

class Plugin {
  constructor(context) {
    this.context = context;
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
  async getPlugin(application) {
    this.context.application = application;
    const pluginConfig = this.context.config.plugins,
      pluginMap = new Map();
    if (pluginConfig && Object.keys(pluginConfig).length > 0) {
      for(let field of Object.keys(pluginConfig)){
        let plugin = pluginConfig[field],
          envOpen = this._inspectEnvOpen(plugin);
        if (plugin.enable && envOpen) {
          let pluginPackage = require(path.resolve('./node_modules/', plugin.package));
          if(typeof pluginPackage === 'function'){
            let res = await catchErr(this.toPromise(pluginPackage(this.context, plugin.config)));
            // console.warn('----------', field);
            if(res.data) pluginMap.set(field, res.data);
          }
        } else {
          console.warn(`plugin：[${field}] is not enable or env incompatible current NODE_ENV`)
        }
      }
    }
    if (isDev()) console.log('pluginMap：', pluginMap);
    return pluginMap;
  }
  _inspectEnvOpen(plugin) {
    return !("env" in plugin) || plugin.env == process.env.NODE_ENV;
  }
}


module.exports = Plugin;
