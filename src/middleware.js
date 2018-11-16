// 中间件
// by YuRonghui 2018-4-12
const Token = require('./token');
const Redis = require('./redis');
const zlib = require('zlib');
const Util = require('./util');

module.exports = {
  // 格式化输出结果中间件
  responseFormat(req, res, next) {
    res.print = function(data){
      let body = {};
      if(req.method == 'GET'){
        body = req.query;
      }else{
        body = req.body;
      }
      let result = Util.respData(data.err ? Util.error(data.err) : (data.hasOwnProperty('data') ? data.data : data), body);
      let resultStr = JSON.stringify(result);
      // 压缩结果
      res.statusCode = 200;
      if (resultStr.length > 1000) {
        resultStr = zlib.gzipSync(resultStr);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Connection', 'close');
        res.setHeader('Content-Encoding', 'gzip');
        res.end(resultStr);
      } else {
        res.json(result);
      }
    };
    next();
  },
  //验证请求body中间件
  requestBody(req, res, next){
    if (req.method == 'PUT') {
      if (req.body) {
        if (!req.body.cmd) {
          res.print(APP.error_code.error_body_cmd);
          return;
        } else if (!req.body.data) {
          res.print(APP.error_code.error_body_data);
          return;
        }
      } else {
        res.print(APP.error_code.error_body);
        return;
      }
    }
    next();
  },
};
