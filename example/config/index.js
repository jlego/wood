/**
 * 配置项
 */
// const mysql = require('./mysqlConfig');
const plugins = require('./pluginConfig');

module.exports = {
	projectName: 'test_api',  //项目名
	version: '20181016', //版本号
	secretKey: 'woodnode', //私密串
  isDebug: true, //是否开启调试模式
	errorCode: {}, //错误码
	plugins,
	defaultDB: 'mongodb'
};
