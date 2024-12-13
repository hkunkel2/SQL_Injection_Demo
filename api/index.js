require('dotenv').config({ path: '../.env' });
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.APP_DB_USER || 'demo_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sql_injection_demo',
  password: process.env.APP_DB_PASS || 'demo_password',
  port: parseInt(process.env.DB_PORT, 10) || 5432
});

// Allowed insurance providers for validation
const validInsuranceProviders = ['HealthPlus', 'MediCare', 'InsureCorp', 'WellnessGroup'];

// Helper function for backend validation
const validateFilters = (filters) => {
  const errors = [];

  if (filters.firstname && !/^[a-zA-Z]+$/.test(filters.firstname)) {
    errors.push('First name must contain only letters.');
  }

  if (filters.lastname && !/^[a-zA-Z]+$/.test(filters.lastname)) {
    errors.push('Last name must contain only letters.');
  }

  if (
    filters.insurance_provider &&
    !validInsuranceProviders.includes(filters.insurance_provider)
  ) {
    console.log('validation 1 failed');
    errors.push('Invalid insurance provider selected.');
  }

  return errors;
};

app.get('/patients', async (req, res) => {
    const { firstname, lastname, insurance_provider } = req.query;
    const settingsResults = await pool.query('SELECT parameterized, validation FROM settings WHERE id = 1');
    const { parameterized, validation } = settingsResults.rows[0]
    console.log('Settings: parameterized = ', parameterized, ', validation = ', validation);
    if(validation == true) {
        const errors = validateFilters(req.query);
        if (errors.length > 0) {
          console.log('Validation errors:', errors);
            return res.status(400).json({ errors });
        }
    }

    try {
        let queryText = 'SELECT * FROM patients';
        const conditions = [];
        if (parameterized == true) {
            if (firstname) {
                values.push(`%${firstname.toLowerCase()}%`); // Add to values array
                conditions.push(`LOWER(first_name) LIKE $${values.length}`); // Use $<index> as placeholder
            }

            if (lastname) {
                values.push(`%${lastname.toLowerCase()}%`); // Add to values array
                conditions.push(`LOWER(last_name) LIKE $${values.length}`);
            }

            if (insurance_provider) {
                values.push(`%${insurance_provider}%`); // Add to values array
                conditions.push(`insurance_provider LIKE $${values.length}`);
            }
        } else {
            if (firstname) {
                // Vulnerable: directly inserting user input into the query string
                conditions.push(`LOWER(first_name) LIKE '%${firstname.toLowerCase()}%'`);
            }
      
            if (lastname) {
                // Vulnerable: directly inserting user input
                conditions.push(`LOWER(last_name) LIKE '%${lastname.toLowerCase()}%'`);
            }
      
            if (insurance_provider) {
                // Vulnerable: directly inserting user input
                conditions.push(`insurance_provider LIKE '%${insurance_provider}%'`);
            }
        }

        // If there are conditions, append them with WHERE clause, else return nothing
        if (conditions.length > 0) {
            queryText += ' WHERE is_active is true AND ' + conditions.join(' AND ');
        } else {
            queryText += ' WHERE 0 = 1';
        }
  
        queryText += ' ORDER BY id';
  
      // Because queryText might now contain malicious code if the user tampered with inputs
      let result;
      console.log('Query:', queryText);
      if (parameterized == true) {
        result = await pool.query(queryText, values);
      } else {
        result = await pool.query(queryText);
      }

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/settings', async (req, res) => {
    try {
      const result = await pool.query('SELECT parameterized, validation FROM settings WHERE id = 1');
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Settings record not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/toggle-parameterized', async (req, res) => {
    try {
      const result = await pool.query('SELECT parameterized FROM settings WHERE id = 1');
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Settings record not found' });
      }
  
      const newParameterized = !result.rows[0].parameterized;
  
      await pool.query('UPDATE settings SET parameterized = $1 WHERE id = 1', [newParameterized]);
      res.json({ parameterized: newParameterized });
    } catch (error) {
      console.error('Error toggling parameterized:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/toggle-validation', async (req, res) => {
    try {
        const result = await pool.query('SELECT validation FROM settings WHERE id = 1');
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Settings record not found' });
        }
  
        const newValidation = !result.rows[0].validation;
  
        await pool.query('UPDATE settings SET validation = $1 WHERE id = 1', [newValidation]);
        res.json({ validation: newValidation });
    } catch (error) {
        console.error('Error toggling validation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
  });

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});