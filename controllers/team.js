
require('dotenv').config({ path: `.env` })
const e = require("express");
const { db, Common } = require("../models");
const { Model } = require("../models/team");
const { ParameterizedQuery: PQ} = require('pg-promise');
const bodyParser = require('body-parser');

// const winston = require('winston');
const { LoggerBase } = require('./../config/logger');
const logger = LoggerBase.child({ file: "controllers/team.js" });

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

module.exports.getAllTeamUsers = async(req, res) => {
    let teams_data = await Model.getAllTeamUsers();
    if (teams_data.status) {
        let data = teams_data.data;
        res.status(200).json({ data });
        return;
    } else {
        message = {message: "getAllTeamUsers teams failed db", db_error: teams_data.message};
        logger.error({message: message});

        res.status(200).json({status: false, message: "getAllTeamUsers"});
        return;
    }
}


// finds a team, takes an id
module.exports.findByID = async(req, res) => {
    console.log("findby id run")
    if (!Common.isInt(req.params.id)) {
        console.log("bad id: " . req.params.id)
        res.status(200).json({ status: false, message: "Bad id" })
        return;
    }
    const id = parseInt(req.params.id);
    // try {
    console.log("findTeamByID START")
    Model.findTeamByID(id, function(teamInfo) {
        if (teamInfo.error) {
            console.log("teamInfo.error")
            message = {message: "findByID - findTeamByID error", internal_message: teamInfo.message, error: teamInfo.error};
            logger.error({message: message});
            res.status(200).json({status: false, message: teamInfo.message})
            return;
        } else if (teamInfo.status === false) {
            console.log("teamInfo.status === false")
            res.status(200).json({status: false, message: "team does not exist", error: 0})
            return;
        }
        console.log("return teaminfo")
        res.status(200).json({status: true, data: teamInfo })
        return;
    })

        // let team_data_query = new PQ("SELECT id, name, team_lead_id, region, type_id, region FROM teams WHERE id = $1")
        // team_data_query.values = [id]
        // let team_data = await db.oneOrNone(team_data_query)
        // if (team_data) {
        //     let team_user_data_query = new PQ("SELECT id, team_id, user_id, approved FROM teams WHERE team_id = $1")
        //     team_user_data_query.values = [team_data.id]
        //     console.log("team_data")
        //     console.log(team_data)
        //     console.log("team_data_query")
        //     console.log(team_data_query)
        //     let team_user_data = await db.any(team_data_query)
        //     (team_user_data.length > 0) ? team_data["team_user_data"] = team_user_data : team_data["team_user_data"] = false
            
        //     return;
        // } else {
        //     res.status(200).json({status: false, message: "no team found"})
        //     return;
        // }
    // } catch (e) {
    //     if (Array.isArray(e) && 'getErrors' in e) {
    //         e = e.getErrors()[0];
    //     }
   
    //     message = {message: "findByID team failed db", db_error: (e.message || e)};
    //     logger.error({message: message});

    //     res.status(200).json({status: false, message: "findByID team CATCH"})
    //     return;
    // }
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
        console.log(teams_deleted);
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
    const { team_lead_id, name, region, type_id, member_info } = req.body;
    let missing = [];
    let check_member_info = await Model.checkMemberInfo(member_info);
    if (!team_lead_id || !name || !region || !type_id || !check_member_info.status) {
        if (!team_lead_id || !Common.isInt(team_lead_id)) missing.push("team_lead_id")
        if (!name) missing.push("name")
        if (!region) missing.push("region")
        if (!type_id || !Common.isInt(type_id)) missing.push("type_id")
        if (!check_member_info.status) missing["member_errors"] = (check_member_info.message)
                
        message = {message: "createTeam - insufficient info", internal_message:(check_member_info.message) ? check_member_info.message:false, db_error:(check_member_info.db_error) ? check_member_info.error:false};
        logger.error({message: message});
        res.status(200).json({status: false, message: "insufficient info", missing: missing})
        return;
    }
    const team_lead_id_parsed = parseInt(team_lead_id)
    const type_id_parsed = parseInt(type_id)

    Model.findTeamByName(name, function(teamInfo) {
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
        console.log("check_member_info.data")
        console.log(check_member_info.data)
        Model.addTeamToDb(team_lead_id_parsed, name, region, type_id_parsed, check_member_info.data, function(newTeam) {
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
    console.log("req.body")
    console.log(req.body)
    const { name, region, type_id, team_id, member_info, deleted_members } = req.body;
    let missing = [];
    if (!name || !region || !type_id || !team_id)  {
        if (!name) missing.push("name")
        if (!region) missing.push("region")
        if (!type_id || !Common.isInt(type_id)) missing.push("type_id")
        console.log("res1")
        res.status(200).json({status: false, message: "insufficient info", missing: missing})
        return;
    }
    const type_id_parsed = parseInt(type_id)
    const team_id_parsed = parseInt(team_id)

    let sendOnce = true
    console.log("OUTSIDE updateTeam")
    Model.updateTeam(name, region, type_id, team_id, member_info, deleted_members, function(updated){
        console.log("CALLED updateTeam")
        console.log("sendOnce")
        console.log(sendOnce)
            if (sendOnce) {
            if (updated.status) {
                sendOnce = false;
                console.log("sendOnce")
                console.log(sendOnce)
                console.log("res5")
                res.status(200).json({status: true, message: "team updated"});
                return;
            } else if (updated.error) {
                message = {message: "updateTeam - updateTeam error", internal_message: updated.message, error: updated.error};
                logger.error({message: message});
                console.log("res4")
                console.log(message)
                sendOnce = false;
                console.log("sendOnce")
                console.log(sendOnce)
                res.status(200).json({status: false, message: updated.message})
                return;
            }
        }

    });

}
    

