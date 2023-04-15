require('dotenv').config({ path: `.env` })
const e = require("express");
const { db, Common } = require("../models");
const { ParameterizedQuery: PQ} = require('pg-promise');
const bodyParser = require('body-parser');

const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;
const { LoggerBase } = require('./../config/logger')
const logger = LoggerBase.child({ file: "circuit.js" });
var message = [];

module.exports.displayMatchups = function(req, res) {
    if (!Common.isInt(req.params.id)) {
        res.status(200).json({ status: false, message: "Bad id" });
        return;
    }
    const id = parseInt(req.params.id);
    db.any("SELECT matche.id match_id,  matche.name match_name,  matche.match_number match_number,  matche.round round,  matche.next_match_id next_match_id,  team1.id team_1_id,  team1.name team_1_name,  team2.id team_2_id,  team2.name team_2_name,  circuit.total_rounds FROM matches as matche LEFT JOIN circuits as circuit ON matche.circuit_id = circuit.id LEFT JOIN teams as team1 ON team1.id = matche.team_1_id LEFT JOIN teams as team2 ON team2.id = matche.team_2_id WHERE matche.circuit_id = $1;", [id])
        .then(function(data) {
            if (data !== null && data.length > 0) {
                res.status(200).json({ data })
            } else {
                res.status(200).json({ data })
            }
        })
        .catch(function(e) {
            if (Array.isArray(e) && 'getErrors' in e) {
                e = e.getErrors()[0];
            }
                    
            message = {message: "displayMatchups failed db", db_error: (e.message || e)};
            logger.error({message: message});
        });
}

