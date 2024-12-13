#!/usr/bin/env node

require('dotenv').config();
const { Client } = require('pg');

const fallbackUser = process.env.FALLBACK_SUPERUSER;
const fallbackPass = process.env.FALLBACK_PASS;
const adminUser = process.env.ADMIN_USER;     // "postgres"
const adminPass = process.env.ADMIN_PASS;
const host = process.env.DB_HOST;
const port = parseInt(process.env.DB_PORT, 10) || 5432;
const dbName = process.env.DB_NAME;
const appUser = process.env.APP_DB_USER;
const appUserPass = process.env.APP_DB_PASS;

async function connectAs(user, pass, database = 'postgres') {
  const client = new Client({
    user: user,
    password: pass,
    host: host,
    port: port,
    database: database
  });
  await client.connect();
  return client;
}

(async () => {
  console.log('DB_NAME from env:', dbName);

  let fallbackClient;
  try {
    // Connect with the fallback superuser to ensure 'postgres' user exists
    fallbackClient = await connectAs(fallbackUser, fallbackPass, 'postgres');
  } catch (err) {
    console.error(`Failed to connect with fallback superuser "${fallbackUser}".`);
    console.error('Make sure this role exists and you have the correct credentials in the .env.');
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  try {
    // Check if 'postgres' role exists
    const postgresCheck = await fallbackClient.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [adminUser]);
    if (postgresCheck.rows.length === 0) {
      console.log(`User "${adminUser}" does not exist. Creating...`);
      await fallbackClient.query(`CREATE ROLE ${adminUser} WITH SUPERUSER LOGIN PASSWORD '${adminPass}'`);
      console.log(`User "${adminUser}" created as SUPERUSER.`);
    } else {
      console.log(`User "${adminUser}" already exists.`);
    }

    // Disconnect from fallback and connect as postgres
    await fallbackClient.end();

    const adminClient = await connectAs(adminUser, adminPass, 'postgres');

    // Ensure the database exists
    const dbCheck = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (dbCheck.rows.length === 0) {
      console.log(`Database ${dbName} does not exist. Creating...`);
      await adminClient.query(`CREATE DATABASE ${dbName}`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }

    // Ensure the APP_DB_USER exists
    const userCheck = await adminClient.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [appUser]);
    if (userCheck.rows.length === 0) {
      console.log(`User ${appUser} does not exist. Creating...`);
      await adminClient.query(`CREATE USER ${appUser} WITH PASSWORD '${appUserPass}'`);
      await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${appUser}`);
    } else {
      console.log(`User ${appUser} already exists.`);
    }

    await adminClient.end();

    // Connect as the app user to set up the table and insert test data
    const appClient = await connectAs(appUser, appUserPass, dbName);

    // Create the patients table
    console.log('Creating patients table if not exists...');
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        date_of_birth DATE NOT NULL,
        gender VARCHAR(10) NOT NULL,
        phone_number VARCHAR(20),
        email VARCHAR(100),
        address VARCHAR(100),
        city VARCHAR(50),
        state VARCHAR(50),
        zip_code VARCHAR(20),
        insurance_provider VARCHAR(100),
        insurance_number VARCHAR(50),
        allergies TEXT,
        medical_history TEXT,
        is_active Boolean,
        date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        date_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Inserting test patients...');
    await appClient.query(`
      INSERT INTO patients (
        first_name, 
        last_name, 
        date_of_birth, 
        gender, 
        phone_number, 
        email, 
        address, 
        city, 
        state, 
        zip_code, 
        insurance_provider, 
        insurance_number, 
        allergies, 
        medical_history,
        is_active
      )
      VALUES
        ('John', 'Doe', '1980-05-12', 'Male', '555-1234', 'john.doe@example.com', '123 Main St', 'Anytown', 'Anystate', '12345', 'HealthPlus', 'HP-123456', 'Peanuts', 'Hypertension', 'false'),
        ('Jane', 'Smith', '1990-07-20', 'Female', '555-5678', 'jane.smith@example.com', '456 Oak Ave', 'Otherville', 'Otherstate', '67890', 'MediCare', 'MC-987654', 'None', 'Asthma', 'false'),
        ('Carlos', 'Gonzalez', '1975-03-10', 'Male', '555-2468', 'carlos.gonzalez@example.com', '546 Pine Rd', 'Differenttown', 'Diffstate', '13579', 'InsureCorp', 'IC-135790', 'Shellfish', 'Diabetes', 'true'),
        ('Joe', 'Lopez', '1975-03-10', 'Male', '555-2468', 'carlos.gonzalez@example.com', '643 Mill Rd', 'Town', 'Diffstate', '13579', 'InsureCorp', 'IC-864964', 'Pollen', 'Diabetes', 'true'),
        ('Nick', 'Gonzalez', '1975-03-10', 'Male', '555-2468', 'carlos.gonzalez@example.com', '945 Carrs Rd', 'Towson', 'Diffstate', '13579', 'MediCare', 'MC-456087', 'None', 'Broken Leg', 'true'),
        ('Richard', 'Smith', '1975-03-10', 'Male', '555-2468', 'carlos.gonzalez@example.com', '678 Oak Rd', 'Fallston', 'Diffstate', '13579', 'HealthPlus', 'HP-125476', 'Peanuts', 'None', 'true'),
        ('Sam', 'Pool', '1975-03-10', 'Male', '555-2468', 'carlos.gonzalez@example.com', '345 Main St', 'Bel Air', 'Diffstate', '13579', 'InsureCorp', 'IC-246790', 'None', 'Heart Attack', 'true')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Creating settings table if not exists...');
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        parameterized BOOLEAN NOT NULL DEFAULT false,
        validation BOOLEAN NOT NULL DEFAULT false
      );
    `);

    console.log('Inserting default settings...');
    await appClient.query(`
      INSERT INTO settings (parameterized, validation)
      VALUES
        (false, false)
      ON CONFLICT DO NOTHING;
    `);

    console.log('Schema and test data applied successfully.');
    await appClient.end();

    console.log('Database initialization complete.');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
})();