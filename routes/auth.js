const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}

router.get('/', ctrl.auth.isLoggedIn);
router.get('/id/:id', ctrl.auth.findByID);
router.get('/logout/', ctrl.auth.logout);
router.post('/discord/', ctrl.auth.findByEmail);

module.exports = router