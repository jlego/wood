const { Router, Controller } = require('../../index');
const multipart = require('connect-multiparty');
const router = Router('user');

router.put('/user/list', Controller('user').list);

router.put('/user/detail', Controller('user').detail);
// 添加用户
router.put('/user/add', Controller('user').add);

module.exports = router;
