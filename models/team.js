
const { all } = require('../routes/user');
const { LoggerBase } = require('./../config/logger');
const logger = LoggerBase.child({ file: "controllers/team.js" });
const { db, Common } = require("../models");
const { ParameterizedQuery: PQ} = require('pg-promise');


// stores calls to the db
var Model = (function() {

    //adds a new team to the db
    const addTeamToDb = async(team_lead_id, name, region, type_id, member_info, cb) => {
        console.log("member_info")
        console.log(member_info)

        let x = 0;
        let members_added = [];

        // starts a transaction
        await db.tx(async t => {
            // create the team
            const insert_team_query = new PQ("INSERT INTO teams (team_lead_id, name, region, type_id ) VALUES ($1, $2, $3, $4) RETURNING id");
            insert_team_query.values = [ team_lead_id, name, region, type_id ];
            const new_team_id = await t.one(insert_team_query).then((tm)=>{return tm.id})
            // const new_team_id = insert_team.id;
            console.log("new_team_id");
            console.log(new_team_id);

            // update the user creating the team to be the team lead
            const update_user_query = new PQ("UPDATE users SET team_id = $1 WHERE id = $2 RETURNING *;");
            update_user_query.values = [ new_team_id, team_lead_id ];
            await t.one(update_user_query)

            // Ensure the team got added and pick up the info, is technically no longer useful.
            const new_team_query = new PQ("SELECT id, name, team_lead_id, region, type_id, region FROM teams WHERE id = $1");
            const  new_team_info =  await  t.oneOrNone(new_team_query, [new_team_id], a => a);
            console.log("new_team_info");
            console.log(new_team_info);
            //  new_team_info = db.any("UPDATE users SET team_id = 15 WHERE id = 16 RETURNING *;", [], a => +a.id)

            // add each team members
            member_info.forEach(async(member, key)=>{
                message = {message: "ADD TEAM - MEMBER ID", member:member[0]}
                logger.error({message:message})
                console.log(message)

                // Make sure member exists
                let member_id = member[0];
                let check_member_id_query = new PQ("SELECT id FROM users WHERE id = $1");
                check_member_id_query.values = [ member_id ];

                message = {member_id: member_id, type: typeof member_id}
                logger.error({message:message});
                console.log(message);

                let check_if_exists = await db.oneOrNone(check_member_id_query);

                message = {check_member_id_query:check_member_id_query}
                logger.error({message:message});
                console.log(message);

                if (check_if_exists) {
                    // add member to team
                    let add_member_query = new PQ("INSERT INTO public.team_users(team_id, user_id) VALUES ($1, $2) RETURNING id;");
                    add_member_query.values = [new_team_info.id,member_id];
                    // message = {message: "add_member_query CALLED", add_member_query:add_member_query}
                    // logger.error({message:message});
                    await db.one(add_member_query);
                    members_added.splice(x, 0, member_id);
                    message = {message: "add_member_query CALLED", add_member_query:add_member_query}
                    logger.error({message:message});
                } else {
                    
                    message = "check_member_id_query failed";
                    logger.error({message:message});
                    console.log(message);
                }
                x++;
            })
            console.log("members_added")
            console.log(new_members_added)
            new_team_info["members_added"] = members_added
            return new_team_info;
        }).then((new_team_info)=>{
            // cb({ status: true, team_data: info });
            //send back all info on the new team
            cb({ status: true, team_data: new_team_info, members_added: members_added});
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

    const checkMemberInfo = async(all_member_info) => {
        let missing_ids = '';
        message = {message: "all_member_info", all_member_info: all_member_info};
        logger.error({message: message});
        try {
            let seperated_member_info = [];
            let split_info = all_member_info.split(',');
            let x = 0;
            split_info.forEach((member_info, key) => {
                if (member_info.length === 0) return;
                message = {message: "member_info", member_info: member_info};
                logger.error({message: message});

                let member_id_untested = member_info.split('|')[0]
                let member_id = (Common.isInt(member_id_untested)) ? parseInt(member_id_untested) : false 
                let sub_code = member_info.split('|')[1]
                let is_sub = (sub_code === 1) ? true : false
                if (!member_id) {
                    message = {message: "BAD: Member id: " + member_id_untested + " | IsSub: " + is_sub + ", cannot be formed into Number"};
                    logger.error({message: message});
                    missing_ids = missing_ids + member_id_untested
                    return;
                }

                message = {message: "GOOD: Member id: " + member_id + "| IsSub: " + is_sub};
                logger.error({message: message});
                seperated_member_info[x] = [member_id, is_sub];
                message = {message: "seperated_member_info", seperated_member_info: seperated_member_info};
                logger.error({message: message});
                x++
            });        
            if (missing_ids.length > 0) {
                // throw "missing ids - throw"                
                message = {message: "TEHRE ARE MISSING IDS" + member_id + "| IsSub: " + is_sub};
                logger.error({message: message});
                return;
            }
            return {status: true, data: seperated_member_info}
        } catch(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            
            message = {message: "checkMemberInfo fucked", error: (e.message || e)};
            logger.error({message: message});
            return {status:false, message: "checkMemberInfo bugged ", missing_ids: missing_ids, error: (e.message || e)}
        }
    }

    const findTeamByName = async(name, cb) => {
        try {
            const getTeam = new PQ('SELECT id, name FROM teams WHERE name = $1');
            getTeam.values = [name];
            let team_data = await db.any(getTeam);
            if (team_data.length !== 0)  {
                const getTeamUsers = new PQ('SELECT users.id, users.discord_name, tm.team_id, tm. approved FROM team_users AS tm JOIN users on users.id = tm.user_id WHERE tm.team_id = $1');
                getTeamUsers.values = [team_data.id];
                let team_users_info = await db.any(getTeamUsers);
                let team_users = (team_users.length > 0) ? team_users_info : false;
                cb({ status: true, team_data: team_data, team_users: team_users })
                return;
            } else {
                cb({ status: false });
                return;
            }
        } catch(e) {
            console.log(e)
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }  
            console.log("CHECK")
            console.log((e.message || e))
            
            cb({ status: false, message: "findTeamByName failed db", error: (e.message || e) })
            return;
        }
    }

    const findTeamByID = async(id, cb) => {
        try {
            const getTeam = new PQ('SELECT id, name FROM teams WHERE id = $1');
            getTeam.values = [id];
            let team_data = await db.one(getTeam);
            if (team_data.length !== 0)  {
                console.log("TEAM FOUND")
                console.log(team_data)
                const getTeamUsers = new PQ('SELECT users.id, users.discord_name, tm.team_id FROM team_users AS tm JOIN users on users.id = tm.user_id WHERE tm.team_id = $1;');
                getTeamUsers.values = [team_data.id];
                console.log(getTeamUsers)
                let team_users_info = await db.any(getTeamUsers);
                let team_users = (team_users_info.length > 0) ? team_users_info : false;
                cb({ status: true, team_data: team_data, team_users: team_users })
                return;
            } else {
                console.log("TEAM NOT FOUND")
                console.log(getTeam)
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

    const getAllTeamUsers = async() => {
        try {
            let team_users_data = await db.any("SELECT * FROM team_users")
            return {status: true, data: team_users_data}
        } catch (e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
            
            message = {message: "getAllTeamUsers teams failed db", db_error: (e.message || e)};
            logger.error({message: message});

            return { status: false, message: "getAllTeamUsers failed db", error: (e.message || e) }
        }
    }

    return {
        addTeamToDb:addTeamToDb,
        findTeamByName:findTeamByName,
        findTeamByID:findTeamByID,
        checkMemberInfo:checkMemberInfo,
        getAllTeamUsers: getAllTeamUsers
    }
})();

module.exports = { Model };