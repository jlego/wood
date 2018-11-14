/**
 * 配置项
 */
const service = require('./serviceConfig');
const mongodb = require('./mongodbConfig');
const mysql = require('./mysqlConfig');
const redis = require('./redisConfig');

module.exports = {
	projectName: 'test_api',  //项目名
	version: '20181016', //版本号
	verifyLogin: false, //是否验证登录
	secretKey: 'woodnode', //私密串
  isDebug: true, //是否开启调试模式
	buildDocx: false,
	session: false, //是否开启session   false / {}
	crossDomain: true, //是否支持跨域
	service,
	mongodb,
	mysql,
	redis,
	defaultDB: 'mongodb',
  registerDirs: {
    route: './example/routes',
    model: './example/models',
    controller: './example/controllers'
  } //默认注册模块目录
};
