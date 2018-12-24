const {
  Controller,
  Model,
  error,
  catchErr,
  Query,
  Token,
  Util
} = require('../../index');
const controller = Controller();

class TestController extends controller {
  async testfun1() {
    let result = await this.testfun2();
    console.warn('---------------------1', result);
    return result;
  }

  async testfun2() {
    // return 'ok';
    // throw error('失败2');
    let result = await this.testfun3();
    console.warn('---------------------2', result);
    return result;
  }

  async testfun3() {
    // return 'ok';
    return Promise.resolve(1);
    // return Promise.reject(error('失败3'));
    // reject(err);
    // throw error('失败3');
  }

  async testerr(req, res, next) {
    let result = await catchErr(this.testfun1());
    console.warn('---------------------4', result);
    
    res.print(result);
  }

  async crypto(req, res, next) {
    let token = new Token({secret: '1234567890'});
    let enResult = token.createToken({a: 1});
    let deResult = token.decodeToken(enResult);
    let isOk = token.checkToken(enResult);
    res.print({ enResult, deResult, isOk });
  }

  async create(req, res, next) {
    const result = await catchErr(Model('tests').create({
      title: '小明',
      subData: [{
        key: '1',
        value: '名字'
      }]
    }));
    res.print(result);
  }

  async list(req, res, next) {
    let body = Util.getParams(req),
        page = Number(body.data.page) || 1;
    let query = Query().limit(3).select({subData: 0});
    let cacheKey = await Util.getReqKey(req);
    const result = await catchErr(Model('tests').findList(query, cacheKey));
    if(result.err){
      res.print(result);
    }else{
      res.print({
        list: result.data.list,
        total: result.data.count,
        page: page
      });
    }
  }

  async detail(req, res, next) {
    let body = Util.getParams(req);
    let query = Query(body.data).select({subdata: 0});
    const result = await catchErr(Model('tests').findOne(query));
    res.print(result);
  }
}

module.exports = new TestController({
  defaultModel: 'tests'
});
