const { db } = require("../models");

module.exports.displayMatchups = function(req, res) {
    const id = parseInt(req.params.id);
    db.any("SELECT * FROM matches WHERE circuit_id = $1", [id])
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
