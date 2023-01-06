require('dotenv').config();
const initoptions = {};
const pgp = require("pg-promise")(initoptions);

const connection_details = "postgres://ghe_admin:sqlshar3d@" + process.env.DB_URL + ":5432/ghe_dev";
const db = pgp(connection_details);

var Common = (function() {
    var isInt = function(value) {
        return !isNaN(value) && 
            parseInt(Number(value)) == value && 
            !isNaN(parseInt(value, 10));
    };

    return {
        isInt: isInt,
    }
})();

module.exports = { db, Common };
