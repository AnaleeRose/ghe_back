require('dotenv').config({ path: `.env` })
const { db } = require("../models");
const winston = require('winston');
const e = require("express");
const fetch = require("node-fetch-commonjs");
var message = {};

// logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});


// takes discord_access_token, discord_refresh_token, email, username, discord_id by POST
// returns user data in JSON
exports.discord = (req, res) => {
    const { code } = req.body;
    let address = "", discord_access_token, discord_refresh_token;
    req.session.loggedIn = false

    if (code) {
        // if we have the code from discord:
        try {

            // send it to discord to get tokens
            fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: process.env.DISCORD_REDIRECT_URL,
                    scope: 'identify',
                }).toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            })
            .then((response) => response.json())
            .then((data) => {

                //send those tokens back to discord to get user info
                discord_access_token = data.token_type;
                discord_refresh_token = data.access_token;
                console.log("discord_access_token 1: " + discord_access_token)
                fetch('https://discord.com/api/users/@me', {
                    headers: {
                        authorization: `${data.token_type} ${data.access_token}`,
                    },
                }).then((response) => response.json())
                .then((discord_res) => {

                    // use the info from discord to find the user's account or create one
                    if (discord_res.username) {
                        let discord_id = discord_res.id
                        let email = discord_res.email
                        let username = discord_res.username
                        console.log("discord_access_token 2: " + discord_access_token)


                        findOrCreate(discord_access_token, discord_refresh_token, email, username, discord_id, function(user) {
                            if (user.status && user.data !== false) {
                                // user info exists
                                req.session.id = user.data.id
                                req.session.email = user.data.email
                                req.session.name = user.data.name
                                req.session.discord_id = discord_id
                                console.log("discord_access_token 3: " + discord_access_token)
                                req.session.discord_access_token = discord_access_token
                                req.session.discord_refresh_token = discord_refresh_token
                                req.session.loggedIn = true

                                return res.status(200).json({ user })
                            } else {
                                // error handling
                                message = {message: "discord login failed - sending to findorcreate failed"};
                                logger.log({
                                    level: 'error',
                                    message: message
                                });
                                return res.status(200).json({ message: user.message, status: user.status });
                            }
                        })
                    } else {
                        message = {message: "discord login failed - no username from discord"};
                        logger.log({
                            level: 'error',
                            message: message
                        });
                        return res.status(200).json({status: false, message: message})
                    }
                })
            });
        } catch(e) {
            console.error("FAILED TRY")
            console.error(e)
            return res.status(200).json({status: false, message: "no code from discord"})
        }
    } else {
        console.error("NO CODE")
        return res.status(200).json({status: false, message: "no code from discord"})
    }
}


// checks if email is set in session, returns user data in JSON
module.exports.isLoggedIn = (req, res) => {
    if (req.session.loggedIn && req.session.loggedIn == true) {
        return res.status(200).json({status: true, message: "logged in",  email: req.session.email, name: req.session.name})
    } else {
        return res.status(200).json({message: "not logged in"})
    }
}





// ----------------------------------> 
// ----------------------> 
// ---> helper functions
// ----------------------> 
// ----------------------------------> 

// finds or creates a user
const findOrCreate = (discord_access_token, discord_refresh_token, email, username, discord_id, cb) => {

    // add retry 
    let getUserAttempts = 0
    let user_exists = false;
    
    user_data = {email: email, username: username, discord_id: discord_id, discord_access_token: discord_access_token, discord_refresh_token:discord_refresh_token}
    console.log(user_data)

    // let text = {"username": username, "email": email, "discord_access_token": discord_access_token, "discord_refresh_token": discord_refresh_token};
    // logger.log({
    //     level: 'info',
    //     message: text
    // });

    // check if basic variables exist
    if (email === null || username === null  || discord_id === null) {
        cb({status: false, message: "user data missing"})
        return;
    } else {

        // attempt to find user by email
        getUserByEmail(email, function(findUser) {
            if (findUser.status === false) {

                // error handling
                if (getUserAttempts <= 3) {
                    getUserAttempts++
                    //recursive call or whatever bruh
                } else {
                    console.log("3 attempt max limit reached. Please try again.")
                }
                cb({message: findUser.message, error: "3 attempt max limit reached. Please try again."});
                return;
            } else if (findUser.user_data !== false) {

                // user exists, return data
                let name = findUser.user_data[0].name
                if (username !== name) {
                    updateUser(name, email, function(attemptUpdateUser) {
                        if (!attemptUpdateUser.status) {
                            console.log("stoppeddd")
                            cb({ status: false, message: attemptUpdateUser.message })
                            return;
                        }
                    })
                }
                console.log("found user:")
                console.log(findUser.user_data)
                cb({message: "user found", status: true, data: findUser.user_data})
                return;
            } else {

                // user doesnt exist, create and return data
                addUserToDb(username, email, function(attemptAddUserToDb) {
                    if (!attemptAddUserToDb.status) {
                        cb({ message: attemptAddUserToDb.message, status: attemptAddUserToDb.status})
                        return;
                    }
                                                
                    console.log("found user:")
                    console.log(attemptAddUserToDb.user_data)
                    cb({message: "user created", status: true, data: attemptAddUserToDb.user_data})
                    return;
                })
            }
        })
    }

}

// updates the username of a user, in case they change their discord name
const updateUser = (name, email, cb) => {
    console.log("updateUser query")
    console.log("UPDATE users SET name='" + name + "' WHERE email='" + email + "';")
    
    db.any("UPDATE users SET name=$1 WHERE email=$2;" [name, email])
        .then(function(data){
            db.any("SELECT name FROM users WHERE email = $1", [email])
            .then(function(data){
                if (data !== null && data.length > 0) {
                    cb({status: true});
                    return;
                }
                console.log("updateUser no name FAILED");
                cb({status: false});
                return;
            })
            .catch(function(e) {
                if (Array.isArray(e) && 'getErrors' in e) {
                    e = e.getErrors()[0];
                }
                console.log("updateUser search CATCH")
                console.log(e.message || e);
                cb({status: false, message: "updateUser search CATCH", error: (e.message || e)});
                return;
            });
        })
    .catch(function(e) {
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }
        console.log("updateUser CATCH")
        console.log(e.message || e);
        cb({status: false, message: "updateUser CATCH", error: (e.message || e)});
        return;
    });
}

// adds a user to the db
const addUserToDb = (name, email, cb) => {
    db.any("INSERT INTO users (name, email) VALUES ($1, $2)", [name, email])
        .then(function(){
            db.any("SELECT id, name, email FROM users WHERE email = $1", [email])
                .then(function(data){
                    if (data !== null && data.length > 0) {
                        cb({status: true, user_data: data});
                        return;
                    }
                    cb({status: false, message: "addUserToDb get user FAILED"});
                    return;
                })
                .catch(function(e) {
                    console.log(e);
                    cb({status: false, message: "addUserToDb get user CATCH"});
                    return;
                });
        })
    .catch(function(e) {
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }
        console.log("addUserToDb CATCH")
        console.log(e.message || e);
        cb({status: false, message: "addUserToDb CATCH", error: (e.message || e)});
        return;
    });
}

// get a user with email
function getUserByEmail(email, cb) {
    console.log("is called")
    db.any("SELECT id, name, email FROM users WHERE email = $1", [email])
        .then(function(data){
            console.log("actually ran")
            if (data !== null && data.length > 0) {
                cb({status: true, user_data: data});
                return;
            } else {
                cb({status: true, user_data: false});
                return;
            }
        })
        .catch(function(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            console.log("getUserByEmail CATCH")
            console.log(e.message || e);
            cb({status: false, message: "getUserByEmail CATCH", error: (e.message || e)});
            return;
        });
}
