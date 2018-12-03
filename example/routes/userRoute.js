const { Router, Controller, Passport } = require('../../index');
const controller = Controller('user');
const router = Router('user');

router.put('/user/list', Passport, controller.list);

router.put('/user/detail', controller.detail);
// 添加用户
router.put('/user/add', controller.add);

router.put('/user/search', controller.search);

module.exports = router;
