const app = require('./app')
const port = process.env.PORT || 8000

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config/config.js')[env];

// connection
app.listen(port, () => console.log(`Server is running on port ${port}`));