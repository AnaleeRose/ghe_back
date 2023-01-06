require('dotenv').config({ path: `.env` })
const e = require("express");
const { db, Common } = require("../models");
const { ParameterizedQuery: PQ} = require('pg-promise');
const bodyParser = require('body-parser');

const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;
const { LoggerBase } = require('./../config/logger')
const logger = LoggerBase.child({ file: "auth.js" });

const fetch = require("node-fetch-commonjs");

// logger setup
// const logger = winston.createLogger({
//     level: 'info',
//     defaultMeta: { file: 'auth.js' },
//     format: combine(
//         colorize({ all: true }),
//         timestamp({
//             format: 'YYYY-MM-DD hh:mm:ss.SSS A',
//         }),
//         align(),
//         printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
//     ),
//     transports: [
//         new winston.transports.File({ filename: 'error.log', level: 'error' }),
//         new winston.transports.File({ filename: 'warning.log', level: 'warning' }),
//         new winston.transports.File({ filename: 'info.log', level: 'info' }),
//         new winston.transports.File({ filename: 'combined.log' }),
//     ],
// });


// takes discord_access_token, discord_refresh_token, email, username, discord_id by POST
// returns user data in JSON
exports.discord = (req, res) => {
    const { code } = req.body;
    let address = "", discord_access_token, discord_refresh_token;
    req.session.loggedIn = false

    logger.info({message: {session: req.session}});

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
                        let discriminator = discord_res.discriminator
                        let discord_name = username + "#" + discriminator

                        findOrCreate(discord_access_token, discord_refresh_token, email, username, discord_id, discord_name, function(user) {
                            if (user.status && !(!user.data)) {
                                console.log("user")
                                console.log(user)
                                console.log(user.data)
                                // user info exists
                                req.session.id = user.data.id
                                req.session.email = user.data.email
                                req.session.name = user.data.name

                                req.session.discord_id = discord_id
                                req.session.discord_name = discord_name
                                req.session.discord_access_token = discord_access_token
                                req.session.discord_refresh_token = discord_refresh_token
                                req.session.loggedIn = true

                                if (user.data.team) {
                                    req.session.team_id = user.data.team.id
                                }
                                
                                res.status(200).json({ user })
                                return;
                            } else {
                                // error handling
                                let findOrCreateMessage;
                                if (user.message && user.error) {
                                    findOrCreateMessage = {message: "discord login failed - sending to findorcreate failed", internal_message: user.message, error: user.error};
                                } else if (user.message) {
                                    findOrCreateMessage = {message: "discord login failed - sending to findorcreate failed", internal_message: user.message};
                                } else {
                                    findOrCreateMessage = {message: "discord login failed - sending to findorcreate failed", error: "unknown"};
                                }
                                
                                logger.error({message: findOrCreateMessage});
                                res.status(200).json({ message: user.message, status: user.status });
                                return;
                            }
                        })
                    } else {
                        logger.error({message: {message: "discord login failed - no username from discord"}});
                        return res.status(200).json({ status: false, message: "discord login failed - no username from discord" });
                    }
                })
            });
        } catch(e) {
            console.error("FAILED TRY")
            console.error(e)

            let unknownMessage = {message: "discord login failed - unknown", error: e};
            logger.warn({message: unknownMessage});

            return res.status(200).json({status: false, message: "no code from discord"})
        }
    } else {
        console.error("NO CODE")
        logger.error({message: {message: "discord login failed - no code from discord"}});
        return res.status(200).json({status: false, message: "no code from discord"})
    }
}


// checks if email is set in session, returns user data in JSON
module.exports.isLoggedIn = (req, res) => {
    if (req.session.loggedIn && req.session.loggedIn == true) {
        return res.status(200).json({status: true, message: "logged in",  id: req.session.id})
    } else {
        return res.status(200).json({message: "not logged in", session: req.session})
    }
}





// ----------------------------------> 
// ----------------------> 
// ---> helper functions
// ----------------------> 
// ----------------------------------> 

// finds or creates a user
const findOrCreate = async(discord_access_token, discord_refresh_token, email, username, discord_id, discord_name, cb) => {

    // add retry 
    let getUserAttempts = 0
    let user_exists = false;
    
    user_data = {email: email, username: username, discord_id: discord_id, discord_access_token: discord_access_token, discord_refresh_token:discord_refresh_token, discord_name: discord_name}

    let missing = [];
    if ((!discord_id) || !username || !email) {
        if (!discord_id || discord_id === NaN) missing.push("discord_id")
        if (!username) missing.push("username")
        if (!email) missing.push("email")
        cb({status: false, message: "insufficient info", missing: missing})
        return;
    }

    await db.tx(async t => {
        const find_user_query = new PQ("SELECT id, name, email, tracker_link, team_id, discord_name FROM users WHERE email = $1");
        find_user_query.values = [email];
        const findUser = await db.any(find_user_query);
        if (findUser.length > 0) {
            if (findUser[0].name !== username) {
                const update_user_query = new PQ("UPDATE users SET name=$1 WHERE id=$2;");
                update_user_query.values = [ username, findUser[0].id ];
                await db.none(update_user_query);
            }
            if (findUser[0].team_id !== null) {
                const get_team_query = new PQ("SELECT id, name, team_lead_id, region, type_id, region FROM teams WHERE id = $1");
                get_team_query.values = [findUser[0].team_id]
                findUser[0].team = await t.oneOrNone(get_team_query)
            }
            cb({status: true, message: "user found", data: findUser[0]})
            return;
        } else {
            console.log("didnt find user... ")
            const insert_user_query = new PQ("INSERT INTO users (name, email, discord_name) VALUES ($1, $2, $3) RETURNING *");
            insert_user_query.values = [username, email, discord_name];
            let new_user = await db.one(insert_user_query);
            cb({status: true, message: "user found", data: new_user})
            return;
        }
    });
}