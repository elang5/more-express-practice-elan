require('dotenv').config();
const express = require('express');
const winston = require('winston');
const cors = require('cors');
const helmet = require('helmet');
const uuid = require('uuid/v4');
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

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

const cards = [{
  id: 1,
  title: 'Task One',
  content: 'This is card one',
}];
const lists = [{
  id: 1,
  header: 'List One',
  cardIds: [1],
}];

app.get('/card', (req, res) => {
  res.json(cards);
})

app.get('/list', (req, res) => {
  res.json(lists);
})

app.get('/list/:id', (req, res) => {
  const { id } = req.params;
  let parsedId = parseInt(id);
  const list = lists.find(li => li.id === parsedId);

  if (!list) {
    logger.error(`List with id ${id} not found.`);
    return res
      .status(404)
      .send('List Not Found');
  }

  res.json(list);
})

app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  let parsedId = parseInt(id);
  const card = cards.find(c => c.id === parsedId);

  if(!card) {
    logger.error(`Card with id ${id} not found.`);
    return ress
      .status(404)
      .send('Card Not Found')
  }
  res.json(card);
})

app.post('/card', (req, res) => {
  const { title, content } = req.body;

  if (!title) {
    logger.error(`Title is required`);
    return res
      .status(400)
      .send('Invalid data');
  }
  
  if (!content) {
    logger.error(`Content is required`);
    return res
      .status(400)
      .send('Invalid data');
  }

  const id = uuid();

const card = {
  id,
  title,
  content
};

cards.push(card);

logger.info(`Card with id ${id} created`);

res
  .status(201)
  .location(`http://localhost:8000/card/${id}`)
  .json(card);
})

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


module.exports = app;
