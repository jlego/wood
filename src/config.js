// 配置文件
// by YuRonghui 2018-5-8
module.exports = {
  openHttpServer: true, //开启http服务
  projectName: 'exampleApi',  //项目名
  version: '20180408', //版本号
  verifyLogin: true, //是否验证登录
  secretKey: 'WOODNODE', //私密串
  isDebug: true, //是否开启调试模式
  buildDocx: false, //是否生成文档
  crossDomain: true, //是否支持跨域
  secretkeys: {  //其他项目的请求私密串
    example: '',
  },
  service: {},
  defaultDB: 'mongodb', //默认数据库
  mongodb: {
    // master: 'mongodb://10.0.1.26:51801,10.0.1.26:51802,10.0.1.26:51803,10.0.1.26:51804/test?replicaSet=rs0&readPreference=secondaryPreferred',
    // master: {
    //   dbName: 'test',
    //   host: ['10.0.1.26:51801','10.0.1.26:51802','10.0.1.26:51803','10.0.1.26:51804'],
    //   port: '',
    //   user: '',
    //   password: '',
    //   replset: 'rs0',
    //   readPreference: 'secondaryPreferred'
    // },
    // slave1: 'mongodb://127.0.0.1:27017/test',
  },
  mysql: {
    // test: {
    //   host: '127.0.0.1',
    //   user: 'root',
    //   password: '123456'
    // },
    // ...
  },
  redis: {
    // master: {
    //   port: 6379,
    //   host: '127.0.0.1',
    //   dbnum: 10
    // }
  },
  tcp: {},
  registerDirs: {
    route: './routes',
    model: './models',
    controller: './controllers'
  } //默认注册模块目录路径
};
