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

// middleware - cors
const corsOptions = {
    // from which URLs do we want to accept requests
    origin: (process.env.NODE_ENV == "production") ? 'https://talesfrom.space/ghe' : 'localhost:3000',
    credentials: true, 
    optionsSuccessStatus: 204
}

app.use('/user', routes.user);
app.use('/users', routes.user);
app.use('/circuit', routes.circuit);
// app.use('/api/v1/circuit', routes.circuit);

module.exports = app;