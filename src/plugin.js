/*
 * @Author: Jc
 * @Date: 2018-11-16 14:39:12
 * @Last Modified by: jlego 2018-11-18
 * @Des: 插件功能类
 */
const Util = require('../src/util');
const path = require('path');
const pluginMap = new Map();

class Plugin {
  constructor(ctx) {
    this.ctx = ctx;
    this.ctx._plugins = pluginMap;
  }

  toPromise(val) {
    if (!(val instanceof Promise)) {
      return new Promise((resolve, reject) => {
        resolve(val);
      });
    } else {
      return val;
    }
  }

  isDev() {
    return 'development' == process.env.NODE_ENV;
  }

  _inspectEnvOpen(plugin) {
    return !("env" in plugin) || plugin.env == process.env.NODE_ENV;
  }

  async loader() {
    const pluginConfig = this.ctx.config.plugins;
    if (pluginConfig && Object.keys(pluginConfig).length > 0) {
      for (let field of Object.keys(pluginConfig)) {
        let plugin = pluginConfig[field],
          envOpen = this._inspectEnvOpen(plugin);
        if (pluginMap.has(field)) {
          console.warn(`plugin：[${field}] is existed`);
          continue;
        }
        if (plugin.enable && envOpen) {
          let pluginPackage = null;
          try {
            if ("package" in plugin) {
              let dirname = path.dirname(require.main.filename);
              let pluginpath = path.resolve(dirname, './node_modules/', plugin.package);
              pluginPackage = require(pluginpath);
            }
            else if ("path" in plugin) {
              pluginPackage = require(plugin.path);
            }
            else {
              throw `current plugin [${field}] no field 'package' or 'path'`;
            }
          } catch (error) {
            console.log(error);
          };
          if (typeof pluginPackage === 'function') {
            plugin.app = {
              name: field,
              application: this.ctx.application,
              config: this.ctx.config,
              error_code: this.ctx.error_code,
              express: this.ctx.express,
              error: this.ctx.error,
              catchErr: this.ctx.catchErr,
              use: this.ctx.use.bind(this.ctx),
              Plugin: this.ctx.Plugin.bind(this.ctx),
              addAppProp: this.ctx.addAppProp.bind(this.ctx, field)
            };
            let res = await Util.catchErr(this.toPromise(pluginPackage(plugin.app, plugin.config)));
            if (res.data) pluginMap.set(field, res.data);
          }
        } else {
          console.warn(`plugin：[${field}] is not enable or env incompatible current NODE_ENV`)
        }
      }
    }
    if (this.isDev()) console.log('pluginMap：', pluginMap.keys());
  }
}

module.exports = Plugin;
