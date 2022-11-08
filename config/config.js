require('dotenv').config()
module.exports = {
    "development": {
      "username": "ghe_admin",
      "password": "sqlshar3d",
      "database": "ghe_dev",
      "host": "localhost",
      "port": 5432,
      "dialect": "postgres"
    },
    // "test": {
    //   "username": "postgres",
    //   "password": null,
    //   "database": "better_cupid_dev",
    //   "host": "db",
    //   "dialect": "postgres"
    // },
    // "production": {
    //   "use_env_variable": "DATABASE_URL",
    //   "dialect": "postgres",
    //    "dialectOptions": {
    //     "ssl": {
    //         "rejectUnauthorized": false
    //     }
    // }
    // }
}