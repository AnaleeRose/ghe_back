const { db } = require("../models");
module.exports.displayAll = function(req, res) {
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

module.exports.displayOne = function(req, res) {
    const id = parseInt(req.params.id);
    db.oneOrNone("SELECT * FROM users WHERE id = $1", [id])
        .then(function(data) {
            if (data !== null && data.length > 0) {
                res.status(200).json({ data })
            } else {
                res.status(204).json({ data })
            }
        })
        .catch(function(e) {
            console.log("GET ALL USERS FAILED");
            console.log(e);
        });
}