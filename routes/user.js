const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}

// gets all users
router.get('/', ctrl.user.getAll);

//gets a single user by ID
router.get('/id/:id', ctrl.user.findByID);

// logs you out
router.get('/logout/', ctrl.user.logout);

// deletes user by ID
router.get('/delete/:id', ctrl.user.deleteByID);

// retrieves tracker info for a user, BROKEN
router.get('/tracker/:id', ctrl.user.getTrackerInfo);

// sets tracker info for a user, BROKEN
router.post('/tracker/', ctrl.user.setTrackerInfo);

module.exports = router