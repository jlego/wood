const {
  Controller,
  Model,
  error,
  catchErr,
  Mongo,
  Query,
  Util
} = require('../../index');
const controller = Controller();

class UserController extends controller {
  // 添加用户
  async add(req, res, next) {
    let params = Util.getParams(req);
    let query = Query().where({ username: params.data.username });
    const hasOne = await catchErr(Model('users').findOne(query));
    if(hasOne.err){
      res.print(hasOne);
    }else{
      let oper = !hasOne.data || Util.isEmpty(hasOne.data) ? 'create' : 'update',
        data = params.data;
      if(hasOne.data && !Util.isEmpty(hasOne.data)) {
        data = Object.assign(hasOne.data, params.data);
      }
      const result = await catchErr(Model('users')[oper](data));
      res.print(result);
    }
  }
}

module.exports = new UserController({
  defaultModel: 'users'
});
