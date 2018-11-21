const {
  Controller,
  Model,
  error,
  catchErr,
  Query,
  Util
} = require('../../index');
const controller = Controller();

class TestController extends controller {
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
    // const result = await catchErr(new Mongo('tests').find(body.data));
    // res.print(result);
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
