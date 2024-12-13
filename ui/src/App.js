import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TableContainer,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    firstName: '',
    lastName: '',
    insurance_provider: '',
  });
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    parameterized: false,
    validation: false,
    frontendValidation: false,
  });

  // Fetch current settings when the component mounts
  useEffect(() => {
    fetch('http://localhost:3001/settings')
      .then((response) => response.json())
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .catch((err) => console.error('Error fetching settings:', err));
  }, []);

  const toggleParameterized = () => {
    fetch('http://localhost:3001/toggle-parameterized', {
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => setSettings((prev) => ({ ...prev, parameterized: data.parameterized })))
      .catch((err) => console.error('Error toggling parameterized:', err));
  };

  const toggleValidation = () => {
    fetch('http://localhost:3001/toggle-validation', {
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => setSettings((prev) => ({ ...prev, validation: data.validation })))
      .catch((err) => console.error('Error toggling validation:', err));
  };

  const toggleFrontendValidation = () => {
    setSettings((prev) => ({ ...prev, frontendValidation: !prev.frontendValidation }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateInputs = () => {
    if (!filters.firstName && !filters.lastName && !filters.insurance_provider) {
      setError('At least one filter must be provided.');
      return false;
    }

    if (filters.firstName && !/^[a-zA-Z]+$/.test(filters.firstName)) {
      setError('First name must only contain letters.');
      return false;
    }

    if (filters.lastName && !/^[a-zA-Z]+$/.test(filters.lastName)) {
      setError('Last name must only contain letters.');
      return false;
    }

    if (
      filters.insurance_provider &&
      !['HealthPlus', 'MediCare', 'InsureCorp', 'WellnessGroup'].includes(filters.insurance_provider)
    ) {
      setError('Invalid insurance provider selected.');
      return false;
    }

    return true;
  };

  const fetchPatients = () => {
    if (settings.frontendValidation && !validateInputs()) {
      return;
    }

    setLoading(true);

    const params = new URLSearchParams();
    if (filters.firstName) params.append('firstname', filters.firstName);
    if (filters.lastName) params.append('lastname', filters.lastName);
    if (filters.insurance_provider) params.append('insurance_provider', filters.insurance_provider);

    fetch(`http://localhost:3001/patients?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching patients:', error);
        setLoading(false);
      });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        SQL Injection DEMO
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
          <Typography>Patient List (For Reference)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>These patients are included for reference in this demo:</Typography>
          <TableContainer component={Paper} sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>First Name</strong></TableCell>
                  <TableCell><strong>Last Name</strong></TableCell>
                  <TableCell><strong>Insurance Provider</strong></TableCell>
                  <TableCell><strong>Active</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { first_name: 'John', last_name: 'Doe', insurance_provider: 'HealthPlus', is_active: 'false' },
                  { first_name: 'Jane', last_name: 'Smith', insurance_provider: 'MediCare', is_active: 'false' },
                  { first_name: 'Carlos', last_name: 'Gonzalez', insurance_provider: 'InsureCorp', is_active: 'true' },
                  { first_name: 'Joe', last_name: 'Lopez', insurance_provider: 'InsureCorp', is_active: 'true' },
                  { first_name: 'Nick', last_name: 'Gonzalez', insurance_provider: 'MediCare', is_active: 'true' },
                  { first_name: 'Richard', last_name: 'Smith', insurance_provider: 'HealthPlus', is_active: 'true' },
                  { first_name: 'Sam', last_name: 'Pool', insurance_provider: 'InsureCorp', is_active: 'true' },
                ].map((patient, index) => (
                  <TableRow key={index}>
                    <TableCell>{patient.first_name}</TableCell>
                    <TableCell>{patient.last_name}</TableCell>
                    <TableCell>{patient.insurance_provider}</TableCell>
                    <TableCell
                      sx={{
                        color: patient.is_active === 'true' ? 'green' : 'red',
                      }}
                    >
                      {patient.is_active === 'true' ? 'Active' : 'Inactive'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
          <Typography>Examples of SQL Injection</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            <div>
              <span style={{ color: 'red' }}>a' OR 1=1 --</span> # Returns all Patients
            </div>
            <div>
              <span style={{ color: 'red' }}>' ; DROP TABLE patients;--</span> # Deletes the table
            </div>
            <div>
              <span style={{ color: 'red' }}>' ; UPDATE patients SET allergies='None';--</span> # Updates patients
            </div>
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Current Settings:</Typography>
        <Typography>Frontend Validation: {settings.frontendValidation ? 'Enabled' : 'Disabled'}</Typography>
        <Typography>Input Validation: {settings.validation ? 'Enabled' : 'Disabled'}</Typography>
        <Typography>Parameterized Queries: {settings.parameterized ? 'Enabled' : 'Disabled'}</Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="info" onClick={toggleFrontendValidation}>
            Toggle Frontend Validation
          </Button>
          <Button variant="contained" color="secondary" onClick={toggleValidation}>
            Toggle Backend Validation
          </Button>
          <Button variant="contained" color="primary" onClick={toggleParameterized}>
            Toggle Parameterized Queries
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 4, mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="First Name"
          variant="outlined"
          name="firstName"
          value={filters.firstName}
          onChange={handleInputChange}
          size="small"
          error={!!error}
        />
        <TextField
          label="Last Name"
          variant="outlined"
          name="lastName"
          value={filters.lastName}
          onChange={handleInputChange}
          size="small"
          error={!!error}
        />
        <FormControl variant="outlined" size="small" fullWidth>
          <InputLabel id="insurance-provider-label">Insurance Provider</InputLabel>
          <Select
            labelId="insurance-provider-label"
            id="insurance-provider-select"
            name="insurance_provider"
            value={filters.insurance_provider}
            onChange={handleInputChange}
            label="Insurance Provider"
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="HealthPlus">HealthPlus</MenuItem>
            <MenuItem value="MediCare">MediCare</MenuItem>
            <MenuItem value="InsureCorp">InsureCorp</MenuItem>
            <MenuItem value="WellnessGroup">WellnessGroup</MenuItem>
            <MenuItem value="InvalidGroup">InvalidGroup</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={fetchPatients}>
          Load Patients
        </Button>
      </Box>

      {error && <Typography color="error">{error}</Typography>}

      {loading && <div>Loading patients...</div>}

      {!loading && patients.length === 0 && <Typography>No patients found.</Typography>}

      {!loading && patients.length > 0 && (
        <TableContainer component={Paper} sx={{ maxWidth: '100%', margin: 'auto', mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>First Name</strong></TableCell>
                <TableCell><strong>Last Name</strong></TableCell>
                <TableCell><strong>Date of Birth</strong></TableCell>
                <TableCell><strong>Gender</strong></TableCell>
                <TableCell><strong>Phone Number</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Address</strong></TableCell>
                <TableCell><strong>City</strong></TableCell>
                <TableCell><strong>State</strong></TableCell>
                <TableCell><strong>Zip Code</strong></TableCell>
                <TableCell><strong>Insurance Provider</strong></TableCell>
                <TableCell><strong>Insurance Number</strong></TableCell>
                <TableCell><strong>Allergies</strong></TableCell>
                <TableCell><strong>Medical History</strong></TableCell>
                <TableCell><strong>Active</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient, index) => (
                <TableRow key={index}>
                  <TableCell>{patient.first_name}</TableCell>
                  <TableCell>{patient.last_name}</TableCell>
                  <TableCell>{patient.date_of_birth}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{patient.phone_number}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.address}</TableCell>
                  <TableCell>{patient.city}</TableCell>
                  <TableCell>{patient.state}</TableCell>
                  <TableCell>{patient.zip_code}</TableCell>
                  <TableCell>{patient.insurance_provider}</TableCell>
                  <TableCell>{patient.insurance_number}</TableCell>
                  <TableCell>{patient.allergies}</TableCell>
                  <TableCell>{patient.medical_history}</TableCell>
                  <TableCell
                    sx={{
                      color: patient.is_active === true ? 'green' : 'red',
                    }}
                  >
                    {patient.is_active === true ? 'Active' : 'Inactive'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default App;