const { db } = require("../models");

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
var message = [];

// returns all user data in JSON
module.exports.getAll = (req, res) => {
    // res.status(200).send("hullo world")
    db.any("SELECT * FROM users", [true])
        .then(function(data) {
            res.status(200).json({ data })
        })
        .catch(function(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            console.log("getAll CATCH")
            console.log(e.message || e);
            res.status(204).json({status: false, message: "getAll CATCH", error: (e.message || e)})
            return;
        });
}

// deletes a user, takes an id
module.exports.deleteByID = (req, res) => {
    const id = parseInt(req.params.id);
    db.any("DELETE FROM users WHERE id = $1;", [id])
        .then(function(data) {
            res.status(200).json({ status: true, message: "user deleted" })
        })
        .catch(function(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            console.log("deleteByID CATCH")
            console.log(e.message || e);
            res.status(204).json({status: false, message: "deleteByID CATCH", error: (e.message || e)})
            return;
        });
}

// logout user on the backend only
module.exports.logout = (req, res) => {
    req.session.loggedIn = false
    req.session = null;
    res.status(200).json({message: "logged out"})
}

// takes user ID by get, returns tracker data in JSON
module.exports.findByID = (req, res) => {
    const id = parseInt(req.params.id);
    db.any("SELECT id, name, email FROM users WHERE id = $1", [id])
        .then(function(data) {
             if (data !== null && data.length > 0) {
                res.status(200).json({status: true,data: data[0]})
                return;
            } else {
                res.status(204).json({status: false, message: "user info not found"})
                return;
            }
        })
        .catch(function(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            console.log("findByID CATCH")
            console.log(e.message || e);
            res.status(204).json({status: false, message: "findByID CATCH", error: (e.message || e)})
            return;
        });
}

// gets the tracker info for a user, GET method
// BROKEN
exports.getTrackerInfo = (res, req) => {
    res.status(204).json({status: false,message: "user tracker info not found"})
    return;
    const id = parseInt(req.params.id);
    db.any("SELECT platform, tracker_link, rank FROM users WHERE id = $1", [id])
        .then(function(data) {
            if (data !== null && data.length > 0) {
                res.status(200).json({status: true,data: data[0]})
                return;
            } else {
                res.status(204).json({status: false,message: "user tracker info not found"})
                return;
            }
        })
        .catch(function(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            console.log("getTrackerInfo CATCH")
            console.log(e.message || e);
            res.status(204).json({status: false, message: "getTrackerInfo CATCH", error: (e.message || e)})
            return;
        });
}


// sets the tracker info for a user, POST methods
// BROKEN
exports.setTrackerInfo = (res, req) => {
    res.status(204).json({status: false,message: "user tracker info not found"})
    return;
    const {id, platform, tracker_link, rank} = req.body;
    if (platform === null || tracker_link === null || rank === null || req.params.id === null) {
        res.status(204).json({status: false, message: "insufficient info"})
        return;
    }
    db.any("INSERT INTO users (platform, tracker_link, rank) VALUES ($1, $2, $3) WHERE id = $4", [platform, tracker_link, rank, id])
        .then(function(data) {
            if (data !== null && data.length > 0) {
                res.status(200).json({status: true})
                return;
            } else {
                res.status(204).json({status: false,message: "user tracker info not found"})
                return;
            }
        })
        .catch(function(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            console.log("getTrackerInfo CATCH")
            console.log(e.message || e);
            res.status(204).json({status: false, message: "getTrackerInfo CATCH", error: (e.message || e)})
            return;
        });
}