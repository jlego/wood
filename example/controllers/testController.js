const {
  Controller,
  Model,
  error,
  catchErr,
  Token,
  Util
} = require('../../index');
const controller = Controller();

class TestController extends controller {
  async create(req, res, next) {
    let query = Model('tests').query(req).select({ _id: 0, options: 0 });
    const result = await catchErr(Model('tests').create({
      title: '小明',
      subData: [{
        key: '1',
        value: '名字'
      }]
    }));
    res.print(result);
    // res.print(error('bbbbbbbbbbbbbbbb'));
    // Model.setData({
    //   creator: {
    //     uid: "2222",
    //     name: "小明"
    //   }
    // });
    // const result = await catchErr(Model.save());
    // console.warn(Model.getData());
    // const result = await catchErr(Model.findList(body.data, true));
    // if(result.err){
    //   res.print(error(result.err));
    // }else{
    //   res.print(result);
    // }
  }
}

module.exports = new TestController({
  defaultModel: 'test'
});
