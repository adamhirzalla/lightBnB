const { Pool } = require('pg');

const config = {
  user: 'labber',
  password: 'labber',
  database: 'lightbnb',
  host: 'localhost',
  port: 5432
};

const pool = new Pool(config);

pool.connect(() => console.log(`Connected to ${config.database} db on port ${config.port} 😎`));

module.exports = {
  query: (text, params) => {
    return pool.query(text, params);
  },
};