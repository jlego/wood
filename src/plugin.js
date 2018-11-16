/*
 * @Author: Jc 
 * @Date: 2018-11-16 14:39:12 
 * @Last Modified by: Jc
 * @Last Modified time: 2018-11-16 15:45:04
 * @Des: 插件功能类
 */

const path = require('path'),
    fs = require('fs');

export default class Plugin {
    constructor(context) {
        this.context = context;
        this.setupPulgin();
    }
    get path() {
        return path.join(__dirname, '/plugin/index.js')
    }
    getConfig() {
        if (fs.existsSync(this.path)) {
            return require(this.path);
        }
        return undefined;
    }
    setupPulgin() {
        const pluginConfig = this.getConfig();
        if (pluginConfig && Object.keys(pluginConfig).length > 0) {
            Object.keys(pluginConfig).map(field => {
                let plugin = pluginConfig[field],
                    envOpen = this._inspectEnvOpen(plugin);
                if (plugin.enable && envOpen) {
                    let pluginPackage = require(plugin.package);
                    try {
                        typeof pluginPackage === "function" && pluginPackage(this.context);
                    }
                    catch (error) {
                        console.error(error)
                    }
                }
                else {
                    console.warn(`plugin：[${field}] is not enable or env incompatible current NODE_ENV`)
                }
            })
        }
    }

    _inspectEnvOpen(plugin) {
        return !(plugin in "env") || plugin.env == process.env.NODE_ENV;
    }
}