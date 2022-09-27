const initoptions = {};
const pgp = require("pg-promise")(initoptions);
const connection_details = "postgres://ghe_admin:sqlshar3d@localhost:5432/ghe_dev";
const db = pgp(connection_details);

module.exports = { db };