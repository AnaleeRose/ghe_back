require('dotenv').config()
const express = require('express')
const cors = require('cors')
// const session = require('express-session')
const Keygrip = require('keygrip')
const cookieSession = require('cookie-session')
const cookieParser = require("cookie-parser");
const routes = require('./routes')

const session = cookieSession({
    name: 'ghe_web_session',
    keys: ['key1', 'key2'],
    maxAge: 4 * 60 * 60 * 1000,
    sameSite: 'none'
})

const corsOptions = {
    // from which URLs do we want to accept requests
    origin: process.env.FRONT_URL,
    credentials: true, 
    optionsSuccessStatus: 204
}
// const passport = require('./passport')

const app = express() 


app.use(session)
app.use(express.json())
app.use(cors(corsOptions));

app.get('/',(req,res)=>
    {
    if(req.session.isPopulated)
        res.status(200).json(req.session)
    else
        res.redirect('/auth')
})

app.get('/views', function (req, res, next) {
    // Update views
    req.session.views = (req.session.views || 0) + 1

    // Write response
    res.end(req.session.views + ' views, key: ' + req.session.key1)
})

app.use('/auth', routes.auth);
app.use('/user', routes.user);
app.use('/users', routes.user);
app.use('/circuit', routes.circuit);

module.exports = app;