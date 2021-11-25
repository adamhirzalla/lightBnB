/* eslint-disable camelcase */
const properties = require('./json/properties.json');
const users = require('./json/users.json');
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

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const query = `
  SELECT *
  FROM users
  WHERE email IN ($1, $2) 
  ;`;
  const values = [email.toLowerCase(), email.toUpperCase()];
  return pool.query(query, values)
    .then(result => result.rows.length > 0 ? result.rows[0] : null)
    .catch(err => console.log(err.message));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = `
  SELECT *
  FROM users
  WHERE id = $1
  ;`;
  const values = [id];
  return pool.query(query, values)
    .then(result => result.rows.length > 0 ? result.rows[0] : null)
    .catch(err => console.log(err.message));
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const query = `
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *
  ;`;
  const values = [user.name, user.email, user.password];
  return pool.query(query, values)
    .then(result => result.rows.length > 0 ? result.rows[0] : null)
    .catch(err => console.log(err.message));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const query = `
  SELECT *
  FROM reservations JOIN properties ON properties.id = property_id
  WHERE guest_id = $1
  LIMIT $2
  ;`;
  const values = [guest_id, limit];
  return pool.query(query, values)
    .then(result => result.rows.length > 0 ? result.rows : null)
    .catch(err => console.log(err.message));
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

//  {
//   city,
//   owner_id,
//   minimum_price_per_night,
//   maximum_price_per_night,
//   minimum_rating;
// }
const getAllProperties = function(options, limit = 10) {
  // 1
  const { city, owner_id, minimum_price_per_night, maximum_price_per_night, minimum_rating} = options;
  const params = [];
  // 2
  if (owner_id) {
    let query = `SELECT * FROM properties WHERE owner_id = $1 LIMIT $2`;
    params.push(owner_id, limit);
    return pool.query(query, params).then((res) => res.rows);
  }

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  
  if (city) {
    params.push(`%${city}%`);
    queryString += `WHERE city LIKE $${params.length} `;
  }
  
  if (minimum_price_per_night && maximum_price_per_night) {
    params.push(minimum_price_per_night * 100, maximum_price_per_night * 100);
    queryString += `AND (cost_per_night >= $${params.length - 1} AND cost_per_night <= $${params.length}) `;
  }
  
  // 4
  queryString += `
    GROUP BY properties.id
    `;
  
  if (minimum_rating) {
    params.push(minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${params.length}`;
  }
  
  
  
  params.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${params.length};
  `;
  // 5
  console.log(queryString, params);

  // 6
  return pool
    .query(queryString, params)
    .then(result => result.rows)
    .catch(err => console.log(err.message));
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */

/*  {
  owner_id: int,
  title: string,
  description: string,
  thumbnail_photo_url: string,
  cover_photo_url: string,
  cost_per_night: string,
  street: string,
  city: string,
  province: string,
  post_code: string,
  country: string,
  parking_spaces: int,
  number_of_bathrooms: int,
  number_of_bedrooms: int
} */
const addProperty = function(property) {
  const {
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  } = property;
  const query = `
  INSERT INTO properties
  (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code)
  VALUES
  ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *
  ;`;
  const params = [
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms,
    country,
    street,
    city,
    province,
    post_code
  ];

  return pool
    .query(query, params)
    .then(result => result.rows)
    .catch(err => console.log(err.message));
};
exports.addProperty = addProperty;
