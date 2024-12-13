This is a demo project for Intro to Cyber Security that shows how a SQL injection works and how to protect against it.


## Setup
### NPM 
Run command
```zsh
npm i
```
```zsh
cd api
npm i
```
```zsh
cd ui
npm i
```
This step downloads the projects dependencies
### DB 
Run command
```zsh 
node ./Scripts/init_db.js
```
- This create the db and schema, also creates table "patients" and seeds the DB with some example patients. 
- It also creates a "settings" table for controlling the protects against SQL injections. 

### Start the API

To start the API, run the command:
```zsh
node ./api/index.js
```
This starts the backend server, which serves the API endpoints for querying the database. By default, it runs on: http://localhost:3001

### Start the UI
To start the React-based user interface, navigate to the UI directory and run:

```zsh
cd ui
npm start
```
This launches the frontend application, which connects to the API and demonstrates how SQL injections can affect the system. By default, it runs on: http://localhost:3000

Summary of Features

	•	Demonstrates how a SQL injection works.
	•	Provides a UI to interact with the system.
	•	Includes protections, such as:
	•	Parameterized queries.
	•	Input validation.
	•	Allows toggling protections through the settings table.
	•	Showcases both vulnerable and protected implementations.