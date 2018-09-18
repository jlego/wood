// 配置文件
// by YuRonghui 2018-5-8
const Errorcode = require('./errorcode');

module.exports = {
  projectName: 'exampleApi',  //项目名
  version: '20180408', //版本号
  verifyLogin: true, //是否验证登录
  secretKey: 'WOODNODE', //私密串
  isDebug: true, //是否开启调试模式
  crossDomain: true, //是否支持跨域
  error_code: Errorcode,  // 错误码
  secretkeys: {  //其他项目的请求私密串
    example: '',
  },
  service: {},
  mongodb: {},
  mysql: {},
  redis: {},
  tcp: {}
};
