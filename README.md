## Description
This web app allows people to keep track of how many customers are inside certain stores at a given time. By knowing this info before traveling to the store, people can avoid crowded stores and waiting in line. This is especially important in the age of COVID-19. Store employees can update a count, the number of customers currently in their store, and maintain a list of sold-out items. Users can view this info, in real-time, for any store within 20 miles. This web app could also be used for gyms, restaurants, etc.

## Structure of Repo
Main code for the backend, which handles the requests and interacting with the MySQL database, is located in index.js

Code for front end and user inferface is located in the views folder. These files interact with the index.js file

Code for CSS is located in public/css folder

## Setup/Getting Started
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

#### Contributors
Brandon Yan: Worked on the store dashboard and connecting that to the database. This is where store owners can update the count, and add to, or remove from, a list of their sold-out items. Also added the feature where customers can view sold-out items from the store search page.
