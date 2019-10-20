const express = require('express');
const routes = require('./routes');
const app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//  connecting all the routes
app.use('/', routes);

app.listen(process.env.PORT || 3000, () => {
    console.log('App listening on port 3000');
});

