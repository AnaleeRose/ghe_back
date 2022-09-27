const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}

router.get('/', ctrl.user.displayAll);
router.get('/:id', ctrl.user.displayOne);

module.exports = router