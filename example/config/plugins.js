/**
 * Module requestStatTime.
 */
// exports.requestStatTime = {
//   package: 'wood-requestStatTime',
//   enable: true,
//   config: {}
// }
exports.util = {
  package: 'wood-util',
  enable: true
}

exports.query = {
  package: 'wood-query',
  enable: true
}

exports.redis = {
  package: 'wood-redis',
  enable: true,
  config: {
    master: {
      port: 6379,
      host: '127.0.0.1',
      dbnum: 10
    }
  }
}

exports.mongo = {
  package: 'wood-mongo',
  enable: true,
  config: {
    master: 'mongodb://127.0.0.1:27017/test',
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
    slave1: 'mongodb://127.0.0.1:27017/test',
  }
}

exports.crossdomain = {
  package: 'wood-crossdomain',
  enable: true
}
exports.responseformat = {
  package: 'wood-responseformat',
  enable: true
}
exports.requestbody = {
  package: 'wood-requestbody',
  enable: true
}

exports.tcp = {
  package: 'wood-tcp',
  enable: true,
  config: {}
}

exports.token = {
  package: 'wood-token',
  enable: true,
  config: {}
}

exports.fields = {
  package: 'wood-fields',
  enable: true
}

exports.model = {
  package: 'wood-model',
  enable: true
}

exports.controller = {
  package: 'wood-controller',
  enable: true
}

exports.router = {
  package: 'wood-router',
  enable: true
}

exports.moduleloader = {
  package: 'wood-module-loader',
  enable: true,
  config: {
    //默认注册模块目录
    registerDirs: {
      route: '../../routes',
      model: '../../models',
      controller: '../../controllers'
    }
  }
}

exports.apidocs = {
  package: 'wood-apidocs',
  enable: true,
  config: {}
}

exports.httpserver = {
  package: 'wood-httpserver',
  enable: true,
  config: {
    http: {
      port: 3004
    },
    // https: {
    //   port: 443,
    //   options: {}
    // },
  }
}
