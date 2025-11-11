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

app.use('/auth', authCtrl);
app.use('/users', usersCtrl);
app.use('/apartments', apartmentRouter);

app.listen(PORT, () => {
  console.log('The express app is ready!');
});