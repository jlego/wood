// 配置文件
// by YuRonghui 2018-5-8
const Errorcode = require('./errorcode');

module.exports = {
  openHttpServer: true, //开启http服务
  projectName: 'exampleApi',  //项目名
  version: '20180408', //版本号
  verifyLogin: true, //是否验证登录
  secretKey: 'WOODNODE', //私密串
  isDebug: true, //是否开启调试模式
  buildDocx: false, //是否生成文档
  crossDomain: true, //是否支持跨域
  error_code: Errorcode,  // 错误码
  secretkeys: {  //其他项目的请求私密串
    example: '',
  },
  service: {},
  defaultDB: 'mongodb', //默认数据库
  mongodb: {},
  mysql: {},
  redis: {},
  tcp: {},
  registerDirs: {
    route: './routes',
    model: './models',
    controller: './controllers'
  } //默认注册模块目录路径
};
