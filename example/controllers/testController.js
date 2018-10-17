const {
  Controller,
  error,
  catchErr,
  Token,
  Util
} = require('../../index');
const TestModel = require('../models/testModel');

class TestController extends Controller {
  constructor(opts = {}) {
    super({
      model: TestModel,
      parse: {
        input: (req, key) => {

        },
        output: (req, data, key) => {
          return data;
        }
      },
      ...opts
    });
  }
  async list(req, res, next) {
    let Model = new TestModel({}, {
      select: {
        _id: 0,
        options: 0
      }
    }),
        body = this.getParams(req);
    console.warn(Model._options.select);
    const result = await catchErr(Model.queryList(body, true, this.options.addLock.list));
    if(result.err){
      res.print(error(result.err));
    }else{
      res.print(result);
    }
  }
}

module.exports = new TestController();
