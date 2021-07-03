const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const errorHandler = require('./middlewares/error');
const connectDB = require('./config/db');
const fileupload = require('express-fileupload');

//Load env bars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

//Routes Files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');

const app = express();

//Body Parser
app.use(express.json());

// Cookie Parser
app.use(cookieParser());

//Static File
app.use(express.static(path.join(__dirname, 'public')));

//Fileupload
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// set security headers
app.use(helmet());

// Prevent XSS  Attack
app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100
});

app.use(limiter);

// Prevent hpp param pollution
app.use(hpp());

//Mount Routers
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;


const server = app.listen(PORT, () => {
    console.log(`Server has started in ${process.env.NODE_ENV} mode at ${PORT}`.yellow.bold);
});

//Handle unhandled promise rejection
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error : ${err.message}`.red);
    //Close Server
    server.close(() => { process.exit(1) });
})

