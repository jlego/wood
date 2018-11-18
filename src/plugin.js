/*
 * @Author: Jc
 * @Date: 2018-11-16 14:39:12
 * @Last Modified by: Jc
 * @Last Modified time: 2018-11-16 18:06:38
 * @Des: 插件功能类
 */

const path = require('path'),
  fs = require('fs');

function isDev() {
  return 'development' == process.env.NODE_ENV;
}

class Plugin {
  constructor(context) {
    this.context = context;
  }
  async getPlugin() {
    const pluginConfig = WOOD.config.plugins || {},
      pluginMap = new Map();
    if (pluginConfig && Object.keys(pluginConfig).length > 0) {
      for(let field of Object.keys(pluginConfig)){
        let plugin = pluginConfig[field],
          envOpen = this._inspectEnvOpen(plugin);
        if (plugin.enable && envOpen) {
          let pluginPackage = require(path.resolve('./node_modules/', plugin.package));
          try {
            let theModel = await pluginPackage(this.context, plugin.config);
            pluginMap.set(field, typeof pluginPackage === "function" && (theModel || {}));
          } catch (error) {
            console.error(error)
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
