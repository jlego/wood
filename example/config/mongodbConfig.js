module.exports = {
  master: 'mongodb://10.0.1.26:51801,10.0.1.26:51802,10.0.1.26:51803,10.0.1.26:51804/test?replicaSet=rs0',
  // master: {
  //   dbName: 'test',
  //   host: ['10.0.1.26:51801','10.0.1.26:51802','10.0.1.26:51803','10.0.1.26:51804'],
  //   port: '',
  //   user: '',
  //   password: '',
  //   replset: 'rs0'
  // },
  slave1: 'mongodb://127.0.0.1:27017/test',
};
