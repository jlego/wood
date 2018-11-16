// 路由基类
// by YuRonghui 2018-11-15
const router = require('express').Router();

class Router {
  constructor(controllerName, controllers) {
    this.controllerName = controllerName;
    this.controllers = controllers;
  }

  getRouter(){
    return router;
  }

  _addRouter(method, argus){
    if(argus.length > 1){
      let pathMatch = argus.shift(),
        fun = argus.pop(),
        methodArr = ['get', 'post', 'put', 'delete'];
      if(this.controllerName && this.controllers) fun = fun.bind(this.controllers.get(this.controllerName));
      if(methodArr.includes(method)) router[method](pathMatch, ...argus, fun);
    }
  }

  get(...argus){
    this._addRouter('get', argus);
  }

  post(...argus){
    this._addRouter('post', argus);
  }

  put(...argus){
    this._addRouter('put', argus);
  }

  delete(...argus){
    this._addRouter('delete', argus);
  }
}

module.exports = Router;
