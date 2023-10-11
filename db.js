"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { getDatabaseUri } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    user: 'postgres',
    host: 'localhost',
    database: getDatabaseUri(),
    password: 'postgres',
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    user: 'postgres',
    host: 'localhost',
    database: getDatabaseUri(),
    password: 'postgres',
    port: 5432 
  });
}

db.connect();

module.exports = db;