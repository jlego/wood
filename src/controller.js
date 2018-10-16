// 控制器基类
// by YuRonghui 2018-4-12
const { error, catchErr } = require('./util');

class Controller {
  constructor(opts = {}) {
    this.options = {
      model: null,
      parse: {
        input: (req, key) => {

        },
        output: (req, data, key) => {
          return data;
        }
      },  //input, output
      addLock: {
        list: true,
        detail: true
      },
      ...opts
    };
    this._nohasModel();
  }
  // 判断是否有模型
  _nohasModel(){
    if(!this.options.model) {
      res.print(error('控制器的model不能为空'));
    }
    return this;
  }
  // 创建模型实例
  _newModel(){
    let model = this.options.model;
    if(model){
      if(typeof model == 'function'){
        return new model();
      }else if(typeof model == 'string'){
        return eval(`new ${model}()`);
      }
      return model;
    }
    return {};
  }
  // 处理输入参数
  _doParseInput(req, key){
    let parse = this.options.parse;
    if(parse){
      if(typeof parse.input == 'function'){
        parse.input(req, key);
      }else{
        if(parse[key]){
          if(typeof parse[key].input == 'function'){
            parse[key].input(req, key);
          }
        }
      }
    }
  }
  // 处理结果数据
  _doParseOutput(req, data, key){
    let parse = this.options.parse;
    if(parse){
      if(typeof parse.output == 'function'){
        return parse.output(req, data, key);
      }else{
        if(parse[key]){
          if(typeof parse[key].output == 'function'){
            return parse[key].output(req, data, key);
          }
        }
      }
    }
    return data;
  }
  parseInput(req, key){
    return this._doParseInput(req, key);
  }
  parseOutput(req, data, key){
    return this._doParseOutput(req, data, key);
  }
  // 获取参数
  getParams(req){
    if(req.method == 'GET'){
      return req.query;
    }else{
      return req.body;
    }
    return {};
  }
  //列表
  async list(req, res, next) {
    this._doParseInput(req, 'list');
    let Model = this._newModel(),
        body = this.getParams(req),
        page = Number(body.data.page) || 1,
        limit = Number(body.data.limit) || 20,
        largepage = Number(body.data.largepage) || Math.ceil(page * limit / 20000);
    body.data.largepage = largepage;
    const result = await catchErr(Model.queryList(body, true, this.options.addLock.list));
    const count = await catchErr(Model.count(body, false));
    if(result.err || count.err){
      res.print(error(result.err || count.err));
    }else{
      result.data = this._doParseOutput(req, result.data, 'list');
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
    this._doParseInput(req, 'detail');
    let Model = this._newModel(),
        body = this.getParams(req);
    const result = await catchErr(Model.queryOne(body.data, this.options.addLock.list));
    if(result.data) result.data = this._doParseOutput(req, result.data, 'detail');
    res.print(result);
  }
  //新增
  async create(req, res, next) {
    this._doParseInput(req, 'create');
    let Model = this._newModel(),
        body = this.getParams(req),
        result = {};
    if(Array.isArray(body.data)){
      result = await catchErr(Model.create(body.data));
    }else{
      Model.setData(body.data);
      result = await catchErr(Model.save());
    }
    if(result.data) result.data = this._doParseOutput(req, result.data, 'create');
    res.print(result);
  }
  //新增
  async save(req, res, next) {
    this._doParseInput(req, 'save');
    let Model = this._newModel(),
        body = this.getParams(req),
        result = {};
    Model.setData(body.data);
    result = await catchErr(Model.save());
    if(result.data) result.data = this._doParseOutput(req, result.data, 'save');
    res.print(result);
  }
  //修改
  async update(req, res, next) {
    this._doParseInput(req, 'update');
    let Model = this._newModel(),
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
        allResult.data = this._doParseOutput(req, allResult.data, 'update');
      }
      res.print(allResult);
    }else{
      delete body.data.updateTime;
      const result = await catchErr(Model.update(body.data, false));
      if(result.data) result.data = this._doParseOutput(req, result.data, 'update');
      res.print(result);
    }
  }
  // 删除
  async remove(req, res, next) {
    this._doParseInput(req, 'remove');
    let Model = this._newModel(),
        body = this.getParams(req);
    const result = await catchErr(Model.remove(body.data));
    if(result.data) result.data = this._doParseOutput(req, result.data, 'remove');
    res.print(result);
  }
  // 软删除
  async softRemove(req, res, next) {
    this._doParseInput(req, 'softRemove');
    let Model = this._newModel(),
        body = this.getParams(req);
    body.data.status = -1;
    const result = await catchErr(Model.update(body.data, false));
    if(result.data) result.data = this._doParseOutput(req, result.data, 'softRemove');
    res.print(result);
  }
}

module.exports = Controller;
