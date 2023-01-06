
require('dotenv').config({ path: `.env` })
const e = require("express");
const { db, Common } = require("../models");
const { ParameterizedQuery: PQ} = require('pg-promise');
const bodyParser = require('body-parser');

const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;
const { LoggerBase } = require('./../config/logger');
const logger = LoggerBase.child({ file: "team.js" });

// const fetch = require("node-fetch-commonjs");
// adds a user to the db

module.exports.getAll = async(req, res) => {
    try {
        let teams_data = await db.any("SELECT * FROM teams")
        res.status(200).json({ teams_data })
        return;
    } catch (e) {
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }
        
        message = {message: "getAll teams failed db", db_error: (e.message || e)};
        logger.error({message: message});

        res.status(200).json({status: false, message: "getAll"})
        return;
    }

}

// finds a team, takes an id
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
        let team_data_query = new PQ("SELECT id, name, team_lead_id, region, type_id, region FROM teams WHERE id = $1")
        team_data_query.values = [id]
        console.log(team_data_query)
        let team_data = await db.oneOrNone(team_data_query)
        console.log(team_data)
        if (team_data !== null) {
            res.status(200).json({status: true, data: team_data })
            return;
        } else {
            res.status(200).json({status: false, message: "no team found"})
            return;

        }
    } catch (e) {
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }
   
        message = {message: "findByID team failed db", db_error: (e.message || e)};
        logger.error({message: message});

        res.status(200).json({status: false, message: "findByID team CATCH"})
        return;
    }
}






// deletes a user, takes an id
module.exports.deleteByID = async(req, res) => {
    if (!Common.isInt(req.params.id)) {
        res.status(200).json({ status: false, message: "Bad id" })
        return;
    }
    const id = parseInt(req.params.id);
    try {
        let teams_deleted = await db.any("DELETE FROM teams WHERE id = $1  RETURNING *;", [id])
        console.log(teams_deleted)
        if (teams_deleted.length >= 1) {
            res.status(200).json({status: true, message: teams_deleted.length + " team(s) have been deleted" })
            return;
        } else {
            res.status(200).json({status: false, message: "no teams deleted"})
            return;

        }
    } catch (e) {
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }
        
        message = {message: "deleteByID team failed db", db_error: (e.message || e)};
        logger.error({message: message});

        res.status(200).json({status: false, message: "deleteByID"})
        return;
    }
}

module.exports.test = async(req, res) => {
    // console.log("b4 update")
    // const updateRes = db.any("UPDATE users SET team_id = 15 WHERE id = 16 RETURNING *;", [], a => +a.id)
    //     .then((id)=>{return(id)})
    //     .catch((e)=>{
    //         console.log(e)
    //         if (Array.isArray(e) && 'getErrors' in e) {
    //             e = e.getErrors()[0];
    //         }  
    //         console.log((e.message || e))
            
            cb({ status: true, message: "holding"})
            return;
    //     })
    // console.log(updateRes)
    // console.log("after update")
}

module.exports.createTeam = async(req, res) => {
    const { team_lead_id, name, region, type_id } = req.body;
    let missing = [];
    if (!team_lead_id || !name || !region || !type_id) {
        if (!team_lead_id || !Common.isInt(team_lead_id)) missing.push("team_lead_id")
        if (!name) missing.push("name")
        if (!region) missing.push("region")
        if (!type_id || !Common.isInt(type_id)) missing.fpush("type_id")
        console.log("res1")
        res.status(200).json({status: false, message: "insufficient info", missing: missing})
        return;
    }
    const team_lead_id_parsed = parseInt(team_lead_id)
    const type_id_parsed = parseInt(type_id)

    findTeamByName(name, function(teamInfo) {
        if (teamInfo.error) {
                message = {message: "createTeam - findTeamByName error", internal_message: teamInfo.message, error: teamInfo.error};
                logger.error({message: message});
                console.log("res2")
                res.status(200).json({status: false, message: teamInfo.message})
                return;
        } else if (teamInfo.status === true) {
            console.log("res3")
            res.status(200).json({status: false, message: "team exists", error: 0})
            return;
        }
    }).then((teamInfo) => {
        console.log("teamInfo");
        console.log(teamInfo);
        addTeamToDb(team_lead_id_parsed, name, region, type_id_parsed, function(newTeam) {
            console.log("newTeam")
            console.log(newTeam)
            if (!newTeam.status) {
                message = {message: "createTeam - addTeamToDb error", internal_message: newTeam.message, error: newTeam.error};
                logger.error({message: message});
                console.log("res4")
                res.status(200).json({status: false, message: newTeam.message})
                return;
            } else {
                res.status(200).json({status: true, data: newTeam.team_data})
                return;
            }
        })
    })
}

module.exports.updateTeam = async(req, res) => {
    const { name, region, type_id, team_id } = req.body;
    let missing = [];
    if (!name || !region || !type_id || !team_id)  {
        if (!name) missing.push("name")
        if (!region) missing.push("region")
        if (!type_id || !Common.isInt(type_id)) missing.fpush("type_id")
        console.log("res1")
        res.status(200).json({status: false, message: "insufficient info", missing: missing})
        return;
    }
    const type_id_parsed = parseInt(type_id)
    const team_id_parsed = parseInt(team_id)
    const update_team_query = new PQ("UPDATE teams SET name=$1, region=$2, type_id=$3 WHERE id = $4 RETURNING *;");
    update_team_query.values = [ name, region, type_id, team_id ];
    try {
        let updated_team = await db.one(update_team_query)
        if (updated_team) {
            res.status(200).json({ status: true, data: updated_team})
            return;
        }
        res.status(200).json({ status: false, message: "updateTeam failed", error:"unknown"})
        return;
    } catch (e) {
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }
        
        message = {message: "updateTeam team failed db", db_error: (e.message || e)};
        logger.error({message: message});

        res.status(200).json({status: false, message: "updateTeam"})
        return;
    }

}
    


const addTeamToDb = async(team_lead_id, name, region, type_id, cb) => {
    await db.tx(async t => {
        const insert_team_query = new PQ("INSERT INTO teams (team_lead_id, name, region, type_id ) VALUES ($1, $2, $3, $4) RETURNING id");
        insert_team_query.values = [ team_lead_id, name, region, type_id ];
        const new_team_id = await t.one(insert_team_query).then((tm)=>{return tm.id})
        // const new_team_id = insert_team.id;
        console.log(new_team_id)

        const update_user_query = new PQ("UPDATE users SET team_id = $1 WHERE id = $2 RETURNING *;");
        update_user_query.values = [ new_team_id, team_lead_id ];
        await t.one(update_user_query)

        const new_team_query = new PQ("SELECT id, name, team_lead_id, region, type_id, region FROM teams WHERE id = $1");
        new_team_query.values = [ new_team_id ];
        return await t.oneOrNone(new_team_query)
    }).then((info)=>{
        cb({ status: true, team_data: info });
        return;
    }).catch((e)=>{
        console.log(e)
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }  
        message = {message: "createTeam - findTeamByName error", internal_message: "details", error: (e.message || e)};
        logger.error({message: message});
        cb({ status: false, message: "await db.tx({mode}, t => { FAILED", error: (e.message || e) })
        return;
    })
}


const findTeamByName = async(name, cb) => {
    try {
        const getTeam = new PQ('SELECT id, name FROM teams WHERE name = $1');
        getTeam.values = ['name'];
        let team_data = await db.any(getTeam);
        if (team_data.length !== 0)  {
            cb({ status: true, team_data: team_data })
            return;
        } else {
            cb({ status: false })
            return;
        }
    } catch(e) {
        console.log(e)
        if (Array.isArray(e) && 'getErrors' in e) {
            e = e.getErrors()[0];
        }  
        console.log((e.message || e))
        
        cb({ status: false, message: "findTeamByName failed db", error: (e.message || e) })
        return;
    }
}
