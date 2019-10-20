const routes = require('express').Router();
const businessController = require('./business/businessController');
const other = require('./user');

routes.use('/business', businessController.router);
//routes.use('/other', other);

routes.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

module.exports = routes;