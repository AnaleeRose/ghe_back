const { db } = require("../models");

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
var message = {};


// takes user ID by get, returns user data in JSON
module.exports.findByID = function(req, res) {
    const id = parseInt(req.params.id);
    db.any("SELECT id, name, email FROM users WHERE id = $1", [id])
        .then(function(data) {
             if (data !== null && data.length > 0) {
                req.session.id = data[0].id
                req.session.email = data[0].email
                req.session.name = data[0].name
                req.session.loggedIn = true
                var message = [{data: data}]
                res.status(200).json({ message })
            } else {
                req.session.loggedIn = false
                message = {message: "user info not found"};
                res.status(200).json({ message })
            }
        })
        .catch(function(e) {
            req.session.loggedIn = false
            console.log("GET USER FAILED");
            console.log(e);
            message = {message:"findByID query failed"};
            res.status(200).json({ message })
        });
}


// takes email by post, returns user data in JSON
module.exports.findByEmail = function(req, res) {
    const { discord_access_token, discord_refresh_token, email } = req.body;
    var message;
    // const { authorization } = req.headers;
    req.session.loggedIn = false
    db.any("SELECT id, name, email FROM users WHERE email = $1", [email])
        .then(function(data) {
            if (data !== null && data.length > 0) {
                req.session.id = data[0].id
                req.session.email = data[0].email
                req.session.name = data[0].name
                req.session.discord_access_token = discord_access_token
                req.session.discord_refresh_token = discord_refresh_token
                data[0].discord_access_token = discord_access_token
                data[0].discord_refresh_token = discord_refresh_token
                message = [{message: "user found", data: data}]

                // db.any("INSERT INTO sessions (user_id, discord_access_token, discord_refresh_token) VALUES ($1, $2, %3)", [data[0].id, discord_access_token, discord_refresh_token])
                //     .then(function(data2) {
                //         req.session.loggedIn = true
                //     })
                //     .catch(function(e) {
                //         console.log("INSERT INTO sessions FAILED");
                //         console.log(e);
                //         message = {message:"INSERT INTO sessions query failed"};
                //         res.status(200).json({ message })
                //     });

                res.status(200).json({ message })
            } else {
                message = {message: "user info not found"};
                res.status(200).json({ message })
            }
        })
        .catch(function(e) {
            console.log("GET USER FAILED");
            console.log(e);
            message = {message:"findByEmail query failed"};
            res.status(200).json({ message })
        });
}

module.exports.createByEmail = function(req, res) {
    // const { email } = req.body;
    // // const { authorization } = req.headers;
    // db.any("SELECT name, email FROM users WHERE email = $1", [email])
    //     .then(function(data) {
    //         if (data !== null && data.length > 0) {
    //             req.session.loggedIn = true
    //             var user_data = [{message: "user found", data: data}]
    //             res.status(200).json({ user_data })
    //         } else {
    //             const username = post.username;
    //             message = {message: "user info incomplete", username: "username"};
    //             res.status(200).json({ message })
    //         }
    //     })
    //     .catch(function(e) {
    //         console.log("GET USER FAILED");
    //         console.log(e);
    //         message = {message:"user not found"};
    //         res.status(200).json({ message })
    //     });
}




// checks if email is set in session, returns user data in JSON
module.exports.isLoggedIn = function(req, res) {
    if (req.session.loggedIn && req.session.loggedIn == true) {
        message = {message: "logged in", status: true, email: req.session.email, name: req.session.name};
        res.status(200).json({ message })
    } else {
        message = {message: "not logged in"};
        res.status(200).json({ message })
    }
}

module.exports.logout = function(req, res) {
    req.session.loggedIn = false
    req.session = null;
    message = {message: "logged out"};
    res.status(200).json({ message })
}