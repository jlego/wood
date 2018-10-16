const App = require('../index');
const config = require('./config/');
const routes = require('./routes/');

console.log('The main start...');
App.start({...config, routes});
