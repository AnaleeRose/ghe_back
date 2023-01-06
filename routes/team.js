const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}

router.get('/', ctrl.team.getAll);
router.get('/:id', ctrl.team.findByID);

router.get('/test/', ctrl.team.test);
router.get('/delete/:id', ctrl.team.deleteByID);

router.post('/create/', ctrl.team.createTeam);
router.post('/edit/', ctrl.team.updateTeam);

module.exports = router

