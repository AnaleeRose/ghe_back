const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}

router.get('/:id', ctrl.circuit.displayMatchups);

module.exports = router