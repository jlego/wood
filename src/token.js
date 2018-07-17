// 登录验证 by YuRonghui 2018-5-8 
// const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class Token {
  constructor(opts = {}) {
    this.config = {
      expire: 3600 * 24 * 7,
      secret: 'minikv3.account',
      ...opts
    };
  }

  // 创建token
  createToken(obj) {
    let payload = {
      data: obj, //payload
      created: parseInt(Date.now() / 1000), //token生成的时间的，单位秒
      exp: this.config.expire //token有效期
    };
    //payload信息
    let base64Str = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    //添加签名，防篡改
    let hash = crypto.createHmac('sha256', this.config.secret);
    hash.update(base64Str);
    let signature = hash.digest('base64');
    return base64Str + "." + signature;
  }

  // 解析token
  decodeToken(token) {
    let decArr = token.split("."), payload = {};
    if (decArr.length < 2) {
      //token不合法
      return false;
    }
    //将payload json字符串 解析为对象
    try {
      payload = JSON.parse(Buffer.from(decArr[0], "base64").toString("utf8"));
    } catch (e) {
      return false;
    }
    //检验签名
    let hash = crypto.createHmac('sha256', this.config.secret);
    hash.update(decArr[0]);
    let checkSignature = hash.digest('base64');
    return {
      payload: payload, 
      signature: decArr[1], 
      checkSignature: checkSignature
    }
  }

  // 验证token
  checkToken(token) {
    let resDecode = this.decodeToken(token);
    if (!resDecode) {
      return false;
    }
    //是否过期
    let expState = (parseInt(Date.now() / 1000) - parseInt(resDecode.payload.created)) > parseInt(resDecode.payload.exp) ? false : true;
    if (resDecode.signature === resDecode.checkSignature && expState) return resDecode.payload.data;
    return false;
  }
}
module.exports = Token;