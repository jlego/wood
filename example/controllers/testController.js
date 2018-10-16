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
}

module.exports = new TestController();
