const App = require('../index');
const config = require('./config/');
// const Compression = require('compression');
// App.use(Compression());  //添加中间件
App.start({ ...config });
