// 配置文件
// by YuRonghui 2018-5-8
module.exports = {
  projectName: 'exampleApi',  //项目名
  version: '20180408', //版本号
  secretKey: 'WOODNODE', //私密串
  isDebug: true, //是否开启调试模式
  secretkeys: {  //其他项目的请求私密串
    example: '',
  },
  errorCode: {}, //错误码
  plugins: {}, //插件
  defaultDB: 'mongodb', //默认数据库
  cluster: {
    cpus: 1
  }
};
