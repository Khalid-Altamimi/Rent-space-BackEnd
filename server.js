const dotenv = require('dotenv');
const path = require('path') // for photos

dotenv.config();
const express = require('express');

const app = express();

const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

const PORT = process.env.PORT || 3000;

// Controllers
const authCtrl = require('./controllers/auth');
const usersCtrl = require('./controllers/users');
const apartmentRouter = require('./controllers/apartment.js');

// MiddleWare
const verifyToken = require('./middleware/verify-token');
const Apartment = require('./models/apartment.js');

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(cors({ origin: process.env.CORS_ORIGIN })); //port **** for API sorce
app.use(express.json());
app.use(logger('dev'));

app.use(express.static(path.join(__dirname, "public"))); // for photos

// home page will be public (change code from line  32-37)
// Public
app.use('/auth', authCtrl);

app.get('/', async (req, res ) =>{
  try {
    const list = await Apartment.find();
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({err: err.message });
  }
});

// no need for the rest
/*
app.get('/apartments/:apartmentId', async (req, res ) =>{
  try {
    const apt = await Apartment.findById(req.params.apartmentId);
    if(!apt) return res.status(404).json({ err: 'Apartment not found' });
    res.status(200).json(apt);
  } catch (err) {
    res.status(500).json({err: err.message });
  }
});

app.use((req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader) {
    return res.redirect(302, '/');
  } 
  
  next();
});
*/

// Protected Routes
app.use(verifyToken);
app.use('/users', usersCtrl);
app.use('/apartments', apartmentRouter);

app.listen(PORT, () => {
  console.log('The express app is ready!');
});