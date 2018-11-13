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
    let query = Query().where({ userName: params.data.userName });
    const hasOne = await catchErr(Model('users').findOne(query));
    if(hasOne.err){
      res.print(hasOne);
    }else{
      let oper = Util.isEmpty(hasOne.data) ? 'create' : 'update',
        data = params.data;
      if(!Util.isEmpty(hasOne.data)) Object.assign(data, hasOne.data, params.data);
      const result = await catchErr(Model('users')[oper](data));
      res.print(result);
    }
  }
}

module.exports = new UserController({
  defaultModel: 'users'
});
