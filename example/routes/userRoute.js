const { Router, Controller, Authenticate } = require('../../index');
const controller = Controller('user');
const router = Router('user');

router.put('/user/list', Authenticate.verify, controller.list);

router.put('/user/detail', controller.detail);
// 添加用户
router.put('/user/create', controller.create);

router.put('/user/search', controller.search);

module.exports = router;
