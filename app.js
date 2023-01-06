require('dotenv').config()
const express = require('express')
const cors = require('cors')
// const session = require('express-session')
const Keygrip = require('keygrip')
const cookieSession = require('cookie-session')
const bodyParser = require("body-parser");
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
    optionsSuccessStatus: 200
}
// const passport = require('./passport')

const app = express() 


app.use(session)
app.use(express.json())
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// app.get('/',(req,res)=>
//     {
//     if(req.session.isPopulated)
//         res.status(200).json(req.session)
//     else
//         res.redirect('/auth')
// })

app.get('/views', function (req, res, next) {
    // Update views
    req.session.views = (req.session.views || 0) + 1

    // Write response
    res.end(req.session.views + ' views, key: ' + req.session.key1)
})

app.use('/auth', routes.auth);
app.use('/circuit', routes.circuit);
app.use('/team', routes.team);
app.use('/teams', routes.team);
app.use('/user', routes.user);
app.use('/users', routes.user);
app.get('*',(req,res) => {
    res.status(200).json({status: false,message:"default"})
})

module.exports = app;