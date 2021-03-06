## Description
This web app allows people to keep track of how many customers are inside certain stores at a given time. By knowing this info before traveling to the store, people can avoid crowded stores and waiting in line. This is especially important in the age of COVID-19. Store employees can update a count, the number of customers currently in their store, and maintain a list of sold-out items. Users can view this info, in real-time, for any store within 20 miles. This web app could also be used for gyms, restaurants, etc.

## Structure of Repo
Main code for the backend, which handles the requests and interacting with the MySQL database, is located in index.js

Code for front end and user inferface is located in the views folder. These files interact with the index.js file

Code for CSS is located in public/css folder

## Setup/Getting Started
Install yarn and npm

### Setting up the MySQL database

Download and install MySQL (brew install mysql) for Mac

Start your SQL server

mysql -u root -p Your password should match the password in: const pool = mysql.createPool({ host: 'localhost', user: 'root', password: 'password', database: 'bootcamp', multipleStatements: true })

CREATE DATABASE bootcamp;

USE bootcamp;

CREATE TABLE user (id INTEGER PRIMARY KEY AUTO_INCREMENT);

ALTER TABLE user ADD username varchar(255) NOT NULL UNIQUE;

ALTER TABLE user ADD password varchar(255) NOT NULL;

ALTER TABLE user ADD nameofstore varchar(255) NOT NULL;

ALTER TABLE user ADD count INTEGER NOT NULL;

ALTER TABLE user ALTER count SET DEFAULT 0;

ALTER TABLE user ADD storeaddress varchar(255) NOT NULL;

ALTER TABLE user ADD storelat double NOT NULL;

ALTER TABLE user ADD storelong double NOT NULL;

CREATE TABLE soldout (id INTEGER PRIMARY KEY AUTO_INCREMENT);

ALTER TABLE soldout ADD item text NOT NULL;

ALTER TABLE soldout ADD store_id INTEGER NOT NULL;

### Last Steps
cd into the correct folder where the project is

Run npm start in the Terminal

Go to localhost:8000 on your browser and see the app!

#### Contributors
Brandon Yan: Worked on the store dashboard and connecting that to the database. This is where store owners can update the count, and add to, or remove from, a list of their sold-out items. Also added the feature where customers can view sold-out items from the store search page.

William Sun: Worked on the backend geolocation, adding lat and long to the SQL table, identifying where the stores' addresses were in latitude and longitude and grabbing stores within 30km based on lat and long values. Also added code to autofill a valid address in the signup page (although it currently does not work due to us not setting up a Google Cloud billing account).

Jay Sarva: Worked on the store search page and set up HTML geolocation to retrieve the user's location (to provide stores only a certain distance away). Also did general front-end clean-up for the store dashboard and added landing page. 