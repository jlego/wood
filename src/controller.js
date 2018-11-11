// 控制器基类
// by YuRonghui 2018-4-12
const { error, catchErr } = require('./util');

class Controller {
  constructor(opts = {}) {
    this.defaultModel = opts.defaultModel || '';
  }
  // 获取参数
  getParams(req){
    return Util.getParams(req);
  }
  //列表
  async list(req, res, next) {
    let Model = CTX.models.get(this.defaultModel),
        body = this.getParams(req),
        page = Number(body.data.page) || 1,
        limit = Number(body.data.limit) || 20,
        largepage = Number(body.data.largepage) || Math.ceil(page * limit / 20000);
    body.data.largepage = largepage;
    const result = await catchErr(Model.queryList(req, true, this.addLock));
    const count = await catchErr(Model.count(req, true));
    if(result.err || count.err){
      res.print(error(result.err || count.err));
    }else{
      let totalpage = Math.ceil(Number(count.data) / Number(body.data.limit || 20)) || 1,
        total = Number(count.data);
      res.print({
        list: result.data,
        page: page,
        largepage: largepage,
        limit: limit,
        total: total,
        totalpage: totalpage
      });
    }
  }
  //详情
  async detail(req, res, next) {
    let Model = CTX.models.get(this.defaultModel),
        body = this.getParams(req);
    const result = await catchErr(Model.queryOne(body.data, this.addLock));
    res.print(result);
  }
  //新增
  async create(req, res, next) {
    let Model = CTX.models.get(this.defaultModel),
        body = this.getParams(req),
        result = {};
    if(Array.isArray(body.data)){
      result = await catchErr(Model.create(body.data));
    }else{
      Model.setData(body.data);
      result = await catchErr(Model.save());
    }
    res.print(result);
  }
  //修改
  async update(req, res, next) {
    let Model = CTX.models.get(this.defaultModel),
        body = this.getParams(req);
    if(Array.isArray(body.data)){
      let allResult = {};
      for(let i = 0; i < body.data.length; i++){
        delete body.data[i].updateTime;
        let result = await catchErr(Model.update(body.data[i], false));
        if(result.err) {
          allResult.err = result.err;
          break;
        }
      }
      if(!allResult.err){
        allResult = {data: body.data.map(item => item.rowid || item.id)};
      }
      res.print(allResult);
    }else{
      delete body.data.updateTime;
      const result = await catchErr(Model.update(body.data, false));
      res.print(result);
    }
  }
  // 删除
  async remove(req, res, next) {
    let Model = CTX.models.get(this.defaultModel),
        body = this.getParams(req);
    const result = await catchErr(Model.remove(body.data));
    res.print(result);
  }
  // 软删除
  async softRemove(req, res, next) {
    let Model = CTX.models.get(this.defaultModel),
        body = this.getParams(req);
    body.data.status = -1;
    const result = await catchErr(Model.update(body.data, false));
    res.print(result);
  }
}

module.exports = Controller;
