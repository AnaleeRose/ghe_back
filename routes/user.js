const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}



// deletes user by ID
router.get('/delete/:id', ctrl.user.deleteByID);

// retrieves tracker info for a user, BROKEN
router.get('/tracker/:id', ctrl.user.getTrackerInfo);

// returns list of user ids and discord names
router.get('/search/', ctrl.user.getAll);

// logs out the currently logged in user
router.get('/logout/', ctrl.user.logout);

//gets a single user by ID
router.get('/:id', ctrl.user.findByID);

// gets all users
router.get('/', ctrl.user.getAll_debug);



// 
router.post('/discord/', ctrl.user.findByDiscordName);

// sets tracker info for a user, BROKEN
router.post('/tracker/:id', ctrl.user.setTrackerInfo);



module.exports = router