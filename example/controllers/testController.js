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
    let query = Query(req).select({ _id: 0, options: 0 });
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
    let query = Query(req).limit(3).select({subdata: 0});
    const result = await catchErr(Model('tests').findList(query, false));
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
}

module.exports = new TestController({
  defaultModel: 'tests'
});
