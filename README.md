##Setting up the MySQL database

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
