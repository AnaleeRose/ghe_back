const express = require('express');
const routes = require('./routes');

const port = process.env.PORT || 4000;
const app = express();

// middleware - JSON parsing
// app.use(express.json());

// middleware - API routes
app.use('/api/v1', routes);

// connection
app.listen(port, () => console.log(`Server is running on port ${port}`));