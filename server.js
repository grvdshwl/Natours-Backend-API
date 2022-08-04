process.on('uncaughtException', err => {
  console.log('Uncaught exception shutting down...');

  console.log(err.name, err.message);

  process.exit(1);
});

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const dbURL = process.env.DATABASE_URL;
const dbPassword = process.env.PASSWORD;
const dbCLUSTER = process.env.DATABASE_CLUSTER;

const db = `${dbURL}${dbPassword}${dbCLUSTER}`;

mongoose.connect(db).then(() => {
  console.log('Database connection established.');
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection shutting down...');

  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});
