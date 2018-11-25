const {
  Controller,
  Model,
  Plugin,
  error,
  catchErr,
  Query,
  Util
} = require('../../index');
const controller = Controller();

class UserController extends controller {
  // 添加用户
  async add(req, res, next) {
    let params = Util.getParams(req);
    if (!params.data.uid) {
      res.print('uid不能为空');
      return;
    }
    const hasOne = await catchErr(Model('users').findOne({ uid: params.data.uid }));
    if (hasOne.err) {
      res.print(hasOne);
    } else {
      let oper = !hasOne.data || Util.isEmpty(hasOne.data) ? 'create' : 'update',
        data = params.data;
      if (hasOne.data && !Util.isEmpty(hasOne.data)) {
        data = Object.assign(hasOne.data, params.data);
      }
      const result = await catchErr(Model('users')[oper](data));
      res.print(result);
    }
  }

  // 全文搜索
  async search(req, res, next) {
    let params = Util.getParams(req);
    let {page = 1, limit = 20, ...query} = params.data || {};
    let ECsearch = Plugin('elasticsearch');
    if(ECsearch){
      let result = await catchErr(ECsearch.Search({
        index: 'test', //数据库名
        type: 'users',  //表名
        limit,
        page,
        query
      }));
      res.print(result);
    }else{
      res.print(error('搜索出错了'));
    }
  }
}

module.exports = new UserController({
  defaultModel: 'users'
});
