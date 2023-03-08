const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}

// for testing purposes
router.get('/test/', ctrl.team.test);
// shows all user, json list
router.get('/users/', ctrl.team.getAllTeamUsers);
// deletes a team, takes an id
router.get('/delete/:id', ctrl.team.deleteByID);


// finds a team, takes an id
router.get('/:id', ctrl.team.findByID);
// get all teams, json list
router.get('/', ctrl.team.getAll);

// creates a new team
router.post('/create/', ctrl.team.createTeam);
// edits an existing team
router.post('/edit/', ctrl.team.updateTeam);

module.exports = router

