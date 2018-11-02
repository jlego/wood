// Tcp类
// by YuRonghui 2018-3-20
const net = require('net');

class Tcp {
  constructor(opts = {}) {
    if(!opts.name) console.error('tcp服务名不能为空！');
    this.config = CONFIG.tcp[opts.name] || {};
    this.options = {
      name: '',   //此值对应着配置的key
      isStart: true,
      ...opts
    };
    this.conn = null;
    this.isConnected = false;
    this.isClosed = false;
    if(this.options.isStart && !this.conn) this.init();
  }
  // 初始化服务
  init() {
    let that = this,
        options = this.options;
    this.conn = net.connect(this.config.port, this.config.host);
    this.conn.on('connect', () => {
      console.log(`已连接到${this.config.host}:${this.config.port}服务器！`);
      this.isConnected = true;
      this.onConnect();
    });
    this.conn.on('data', (data) => {
      this.onData(data);
    });
    this.conn.on('timeout', () => {
      console.log('数据发送超时');
      this.onTimeout();
    });
    this.conn.on('error', (err) => {
      console.log('有错误发送，按错误码进行处理 error := ', err);
      this.onError(err);
    });
    this.conn.on('end', () => {
      console.log(`断开与${this.config.host}:${this.config.port}服务器的连接`);
      this.isConnected = false;
      this.onEnd();
    });
    this.conn.on('close', () => {
      console.log('连接已关闭');
      this.isConnected = false;
      this.onClose();
      if (!this.isClosed) {
        // 断开重连机制
        setTimeout(() => {
          this.init();
        }, 1000);
      }
    });
  }
  onConnect(){}
  onData(data){}
  onTimeout(){}
  onError(err){}
  onEnd(){}
  onClose(){}
}

module.exports = Tcp;
