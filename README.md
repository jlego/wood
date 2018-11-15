# wood
### 基于express的后台接口开发框架
#### v1.2.0更新:
注：从版本v1.2.0起，框架的使用方式与以前版本区别较大；
- 增加了Fields类，用于存放数据模型model数据和验证；
- 增加了模块自动加载机制；
- 简化了模块调用方法，由new创建实例改为函数创建实例；
- 升级了mongodb.js为3.1.9版本；
- 增加了mongodb副本集群的支持；
- 完善了查询对象query；
- (已弃用)控制器类支持输入与输出的数据处理方法；

#### 版本<v1.2.0的功能:
- 使用ES6语法，如async/await等；
- 支持mongodb和mysql等数据库;
- 模型类自动根据已定义的字段来创建数据表；
- 模型类为数据表映射，支持setter和getter等；
- 模型类字段支持数据类型验证；
- 模型类支持聚合查询功能；
- 模型类支持默认值的设定；
- 拥有查询条件对象，支持链式组合条件生成查询语句；
- 模型类和控制器类拥有基本的增删改查等常规操作方法；
- 控制器类支持输入与输出的数据处理方法；
- 可以根据路由接口自动生成web和docx等格式的接口文档；
- 支持基于redis缓存的高性能分页功能；
- 支持错误处理输出错误信息功能；
- 支持中间件扩展；
- 支持接口提交的数据格式验证；
- 自带redis常用功能操作库；
- 自带token类；
- 自带登录验证中间件；

#### 安装:
执行命令：`npm i -S wood-node`

#### 使用示例:
项目入口(/main.js)

    const App = require('wood-node');
    let config = {};  //配置, 注：详细参数请参照示例源码/example/config/
    App.start(config);

模型(/models/userModel.js)

    const { Model, Util, Fields } = require('wood-node'); //注：mysql时请使用Modelsql
    module.exports = Model('users', new Fields({
        "rowid": { //行Id
          type: 'Number',
          required: true, //是否验证
          index: true  //索引
        },
        "machineName": String,
        "status": Number
      }), {
        "_id": 0,  //0为不返回的字段
      });

控制器(/controllers/userController.js)

    const { Controller, catchErr, Util, Query, Model } = require('wood-node');
    const controller = Controller();
    class UserController extends controller {
      async userList(req, res, next) {
        let params = Util.getParams(req);
        let query = Query(req).where({rowid: 2}).limit(3).select({_id: 0});
        const result = await catchErr(Model('users').findList(query));
        res.print(result);
      }
    }
    module.exports = new UserController({ defaultModel: 'users' });

路由(/routes/userRouter.js)

    const { Router, Controller } = require('wood-node');
    const router = Router('user');
    router.put('/project/user/add', Controller('user').userList);
    module.exports = router;
