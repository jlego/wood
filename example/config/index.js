/**
 * 配置项
 */
const plugins = require('./plugins');

module.exports = {
	projectName: 'test_api',  //项目名
	version: '20181016', //版本号
	secretKey: 'woodnode', //私密串
  env: 'development',
	errorCode: {}, //错误码
	plugins,
	defaultDB: 'mongodb',
  cluster: {
    cpus: 1
  }
};
