require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const helmet = require('helmet');
const morgan = require('morgan');
const cardRouter = require('./card/card-router');
const listRouter = require('./list/list-router');
const { NODE_ENV } = require('./config');

const app = express();

const whitelist = ['http://localhost:8000'];
const corsOptions = {
  origin (origin, callback) {
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common'))

app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`)
    return res.status(401).json({ error: 'Unauthorized request' })
  }
  // move to the next middleware
  next()
})

app.use(cardRouter);
app.use(listRouter);

app.use((error, req, res, next) => {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

app.get('/', (req, res) => {
  res.send('Hello, world!')
})


module.exports = app;
