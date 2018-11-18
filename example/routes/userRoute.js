const { Router, Controller } = require('../../index');
const controller = Controller('user');
const router = Router('user');

router.put('/user/list', controller.list);

router.put('/user/detail', controller.detail);
// 添加用户
router.put('/user/add', controller.add);

module.exports = router;
