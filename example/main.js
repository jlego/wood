const App = require('../index');
const config = require('./config/');
const Compression = require('compression');
App.use(Compression());
App.start({ ...config });
