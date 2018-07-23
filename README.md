# wood-node
### 基于express的后台接口开发框架

#### 现有功能:

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
    let config = {};  //配置, 注：详细参数请参照源码/src/config.js
    App.start(config);
    
模型(/models/userModel.js)

    const { Model, Util } = require('wood-node'); //注：mysql时请使用Modelsql
    class UserModel extends Model {
      constructor(data = {}, opts = {}) {
        let options = {
          //数据库表名
          tableName: 'users', 
          //过滤字段
          select: {
            "_id": 0,  //0为不返回的字段
          },
          //定义数据表字段
          fields: {
            "rowid": { //行Id
              type: 'Number',
              required: true, //是否验证
              index: true  //索引
            },
            "machineName": String,
            "status": Number
          },
          ...opts
        };
        super(data, options);
      }
      // 自定义方法
      saveOne(){
        
      }
    }
    module.exports = UserModel;
    
控制器(/controllers/userController.js)

    const { Controller, catchErr } = require('wood-node');
    const UserModel = require('../models/userModel');
    class UserController extends Controller {
      constructor(opts = {}) {
        super({
          model: UserModel,
          parse: {
            input: function(req){

            },
            output: function(data){
              return data;
            }
          },
          ...opts
        });
      }
      async addOne(req, res, next) {
        let User = new UserModel(),
            params = this.getParams(req);
        User.setData(params.data);
        const result = await catchErr(User.saveOne());
        res.print(result);
      }
    }
    module.exports = new UserController();
    
路由(/routes/userRouter.js)

    const { Router } = require('wood-node');
    const UserController = require('../controllers/userController');
    Router.put('/project/user/add', (req, res, next) =>{
      UserController.addOne(req, res, next);
    });
    module.exports = Router;
