const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')
const { isLoggedIn, discord } = require("../controllers/auth");

var empty = {"empty": "empty results set"}

// check if currently loggedin serverside
router.get('/', isLoggedIn);

// login or create a user through discord
router.post('/discord/', discord);

module.exports = router