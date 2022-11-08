require('dotenv').config();
const express = require('express')
const cors = require('cors')
const session = require('express-session')
// const morgan = require('morgan')

const routes = require('./routes')
// const passport = require('./passport')

const app = express() 

// middleware - JSON parsing
app.use(express.json())


let decideOrigin = "";

switch (process.env.NODE_ENV ) {
    case ("production"):
        decideOrigin = 'https://ghesports.org/'
        break;

    case ("development"):
        decideOrigin = 'https://ghesports.dev/'
        break;

    case ("local"):
        decideOrigin = 'https://localhost:3000/'
        break;
    default:
        break;
}


// middleware - cors
const corsOptions = {
    // from which URLs do we want to accept requests
    origin: decideOrigin,
    credentials: true, 
    optionsSuccessStatus: 204
}
app.use(cors(corsOptions));


app.use('/user', routes.user);
app.use('/users', routes.user);
app.use('/circuit', routes.circuit);
// app.use('/api/v1/circuit', routes.circuit);

module.exports = app;