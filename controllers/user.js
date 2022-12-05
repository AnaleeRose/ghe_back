const { db } = require("../models");

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
var message = [];

// returns all user data in JSON
module.exports.getAll = function(req, res) {
    // res.status(200).send("hullo world")
    db.any("SELECT * FROM users", [true])
        .then(function(data) {
            res.status(200).json({ data })
        })
        .catch(function(e) {
            console.log("GET ALL USERS FAILED");
            console.log(e);
        });
}
