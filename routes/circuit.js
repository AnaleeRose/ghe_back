const router = require('express').Router()
// const passport = require('../passport')
const ctrl = require('../controllers')

var empty = {"empty": "empty results set"}

//get details for specific circuit
router.get('/:id', ctrl.circuit.displayMatchups);

module.exports = router