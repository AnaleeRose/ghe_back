// reroutes to the appropriate router
module.exports = {
    user: require('./user'),
    circuit: require('./circuit'),
    team: require('./team'),
    auth: require('./auth'),
}