module.exports = {
  // master: 'mongodb://10.0.1.26:51801/test',
  master: {
    dbName: 'test',
    user: '',
    password: '',
    replset: {
      name: 'rs0',
      hosts: ['10.0.1.26:51801','10.0.1.26:51802','10.0.1.26:51803','10.0.1.26:51804']
    }
  },
  slave1: 'mongodb://127.0.0.1:27017/test',
};
