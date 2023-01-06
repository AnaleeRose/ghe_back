require('dotenv').config({ path: `.env` })
const e = require("express");
const { db, Common } = require("../models");
const { ParameterizedQuery: PQ} = require('pg-promise');
const bodyParser = require('body-parser');

const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;
const { LoggerBase } = require('./../config/logger')
const logger = LoggerBase.child({ file: "user.js" });
var message = [];

const { discord } = require("./auth");


// returns all user data in JSON
module.exports.getAll = async(req, res) => {
    await db.many("SELECT id id, discord_name name FROM users")
        .then((data)=>{
            res.status(200).json({ data })
        })
        .catch((e)=>{
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            message = {message: "getAll users failed db", db_error: (e.message || e)};
            logger.error({message: message});

            res.status(200).json({status: false, message: "getAll"})
            return;
        })
}
module.exports.getAll_debug = async(req, res) => {
    await db.many("SELECT * FROM users")
        .then((data)=>{
            res.status(200).json({ data })
        })
        .catch((e)=>{
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            message = {message: "getAll users failed db", db_error: (e.message || e)};
            logger.error({message: message});

            res.status(200).json({status: false, message: "getAll"})
            return;
        })
}
// deletes a user, takes an id
module.exports.deleteByID = async(req, res) => {
    if (!Common.isInt(req.params.id)) {
        res.status(200).json({ status: false, message: "Bad id" })
        return;
    }
    const id = parseInt(req.params.id);
    await db.any("DELETE FROM users WHERE id = $1  RETURNING *;", [id])
        .then((users_deleted)=>{
            if (users_deleted.length >= 1) {
                res.status(200).json({ status: true, message: users_deleted.length + " users(s) have been deleted" })
                return;
            } else {
                res.status(200).json({status: false, message: "no users deleted"})
                return;
            }
        })
        .catch((e)=>{
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
        
            message = {message: "deleteByID user failed db", db_error: (e.message || e)};
            logger.error({message: message});

            res.status(200).json({status: false, message: "deleteByID"})
            return;

        })
}

// logout user on the backend only
module.exports.logout = (req, res) => {
    req.session.loggedIn = false;
    req.session = null;
    res.status(200).json({status: true, message: "logged out"})
}

// takes user ID by get, returns tracker data in JSON
module.exports.findByID = async(req, res) => {
    console.log("findby id run")
    if (!Common.isInt(req.params.id)) {
        console.log("bad")
        res.status(200).json({ status: false, message: "Bad id" })
        return;
    }
    const id = parseInt(req.params.id);
    console.log("id: " + id)
    try {
        let find_user_query = new PQ("SELECT id, rl_username, rank, tracker_verified FROM users WHERE id = $1")
        find_user_query.values = [id]
        console.log(find_user_query)
        let user_data = await db.oneOrNone(find_user_query)
        if (user_data !== null) {
            res.status(200).json({ status: true, data: user_data })
            return;
        } else {
            res.status(200).json({status: false, message: "user info not found"})
            return;

        }
    } catch (e) {
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }
   
        message = {message: "findByID user failed db", db_error: (e.message || e)};
        logger.error({message: message});

        res.status(200).json({status: false, message: "findByID CATCH"})
        return;
    }
}

// takes user ID by get, returns tracker data in JSON
module.exports.findByDiscordName = async(req, res) => {
    const { discord_name } = req.body;

    let missing = [];
    if (!discord_name || discord_name === null || discord_name === undefined) {
        if (!discord_name) missing.push("discord_name")
        res.status(200).json({status: false, message: "insufficient info", missing: missing})
        return;
    }

    await db.oneOrNone("SELECT id, name FROM users WHERE discord_name = $1", [discord_name])
        .then((data)=>{
            if (data.length > 0) {
                res.status(200).json({status: true, data: data})
            } else {
                res.status(200).json({status: false})
            }
            return;
        })
        .catch((e)=>{
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
       
            message = {message: "findByDiscordName user failed db", db_error: (e.message || e)};
            logger.error({message: message});

            res.status(200).json({status: false, message: "findByID"})
            return;
        });
}

// gets the tracker info for a user, GET method
module.exports.getTrackerInfo = async(req, res) => {
    if (!Common.isInt(req.params.id)) {
        res.status(200).json({ status: false, message: "Bad id" })
        return;
    }
    const id = parseInt(req.params.id);
    await db.oneOrNone("SELECT platform, tracker_link, rank, rl_username FROM users WHERE id = $1", [id])
        .then((data)=>{
            if (data) {
                res.status(200).json({status: true,data: data})
                return;
            } else {
                message = {message: "getTrackerInfo user not found, id: " + id};
                logger.info({message: message});

                res.status(200).json({status: false,message: "user tracker info not found"})
                return;
            }
        })
        .catch((e)=>{
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
       
            message = {message: "getTrackerInfo user failed db", db_error: (e.message || e)};
            logger.error({message: message});

            res.status(200).json({status: false, message: "getTrackerInfo"})
            return;
        });
}


// sets the tracker info for a user, POST methods
module.exports.setTrackerInfo = async(req, res) => {
    // res.status(200).json({status: false,message: "user tracker info not found"})
    // return;
    const {platform, tracker_link, rank, rl_username} = req.body;
    if (!Common.isInt(req.params.id)) {
        res.status(200).json({ status: false, message: "Bad id" })
        return;
    }
    const id = parseInt(req.params.id);
    let tracker_info = [{id: id, platform: platform, tracker_link: tracker_link, rank: rank, rl_username: rl_username}]
    let missing = [];
    if (!platform || !tracker_link || !rank || !rl_username) {
        if (!id || id === NaN) missing.push("id")
        if (!platform) missing.push("platform")
        if (!tracker_link) missing.push("tracker_link")
        if (!rank) missing.push("rank")
        if (!rl_username) missing.push("rl_username")
        res.status(200).json({status: false, message: "insufficient info", missing: missing})
        return;
    }

    await db.none("UPDATE users SET platform = $1, tracker_link = $2, rank = $3, rl_username = $4 WHERE id = $5", [platform, tracker_link, rank, rl_username, id])
        .then((data)=>{
            res.status(200).json({status: true, tracker_info})
            return;
        })
        .catch((e)=>{
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }

            message = {message: "setTrackerInfo user failed db", db_error: (e.message || e)};
            logger.error({message: message});

            res.status(200).json({status: false, message: "setTrackerInfo CATCH"})
            return;
        });
}