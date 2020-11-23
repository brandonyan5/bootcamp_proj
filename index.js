const express = require('express')
const session = require('express-session')
const app = express()
const port = 8000
const mysql = require('mysql')
const bodyParser = require('body-parser')
const fetchInject = require('fetch-inject')
const https = require('https');
const email = "youremail@gmail.com";

// set up body parsing
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// set up the database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'bootcamp',
    multipleStatements: true
});

// set up templating engine
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(express.static(__dirname + '/public'));

// set up the session
app.use(session({
    secret: 'keyboard cat',
    cookie: {}
}))

//get info from the store, and sign them up
//then go to login page
app.post('/signup', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const storename = req.body.store
    const storeaddress = req.body.address
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        https.get('https://nominatim.openstreetmap.org/search?email='+email+'&format=json&q='+storeaddress, (resp) => {
          let data = '';
          resp.on('data', (chunk) => {
            data += chunk;
          });
          resp.on('end', () => {
            const parsed = JSON.parse(data);
            console.log(parsed[0].lat, parsed[0].lon);
            var lat = parsed[0].lat;
            var long = parsed[0].lon;
            connection.query({
                    sql: 'INSERT INTO user (username, password, nameofstore, storeaddress, storelat, storelong) VALUES (?, ?, ?, ?, ?, ?); SELECT LAST_INSERT_ID();',
                    values: [username, password, storename, storeaddress, lat, long],
                }, function (err, result) {
                    if (err) {
                        console.error(err)
                        res.send('Could not create account')
                        return
                    }
                    //created account, set session uid and go to login page
                    req.session.uid = result[1][0]['LAST_INSERT_ID()']
                    res.redirect('/login')
                }
            )
          });
        }).on("error", (err) => {
          console.log("Error: " + err.message);
        });
        connection.release();
    })
})

//login the store if account is already there, then redirect to dashboard
app.post('/login', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'SELECT * FROM user WHERE user.username=? AND user.password=?;',
                values: [username, password],


            }, function (err, result) {
                if (err || !result[0]) {
                    console.error(err)
                    res.send('Either user does not exist or username password combination is invalid')
                    return
                }
                //account is found, get session uid and redirect to dashboard
                req.session.uid = result[0]['id']
                res.redirect('/dashboard')
            }
        )
        connection.release();
    })
})

//logout for the store
app.post('/logout', (req, res) => {
    console.log(req.session);
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'SELECT * FROM user WHERE user.id=?;',
                values: [req.session.uid],
            }, function (err, result) {
                if (err || !result[0]) {
                    console.error(err)
                    res.send('Cannot logout if you are not logged in')
                    return
                }
                req.session.uid = null
                res.redirect('/')
            }
        )
        connection.release();
    })
});

//hit plus button when a person enters the store
app.post('/add', (req, res) => {
    console.log(req.session);
    pool.getConnection(function (err, connection) {
        if (err){ throw err; console.log("add fail");};
         console.log("add success");
        connection.query({
                sql: 'UPDATE user SET count = count + 1 WHERE id = ?',
                values: [req.session.uid],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                res.redirect('/dashboard')
            }
        )
        connection.release();
    })
})

//hit minus button when a person leaves the store
app.post('/subtract', (req, res) => {
    //const body = req.body.body
    console.log(req.session);
    pool.getConnection(function (err, connection) {
        if (err){ throw err; console.log("subtract fail");};
         console.log("subtract success");
        connection.query({
                sql: 'UPDATE user SET count = count - 1 WHERE id = ?',
                values: [req.session.uid],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If no error, redirect to store dashboard so the number updates
                res.redirect('/dashboard')
            }
        )
        connection.release();
    })
})

//direct input endpoint for when there is a large change in number of users
app.post('/update', (req, res) => {
    const newPeople = req.body.newPeople
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'UPDATE user SET count = ? WHERE id = ?',
                values: [req.body.newPeople, req.session.uid],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If no error, redirect to store dashboard so the number updates
                res.redirect('/dashboard')
            }
        )
        connection.release();
    })
})

//dashboard for the store
app.get('/dashboard', (req, res) => {
  console.log(req.session);
if (req.session.uid != null){
  console.log("dashboard success");
    pool.getConnection(function (err, connection) {
        if (err) throw err;
            connection.query({

                sql: `SELECT * FROM user WHERE user.id=?`,
                values: [req.session.uid],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If no error, get count of the store
                const shops = {}
                for (let i = 0; i < result.length; i++) {
                    shops[result[i].id] = {
                    count: result[i].count

                    }

                }
                res.locals = {
                    data: shops
                }
                res.render('dashboard')
            }
        )
        connection.release();
    })
// change this to render the default dashboard for a user
}else{ res.render('index'); res.redirect('/'); console.log("dashboard fail");}
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/map', (req, res) => {
    res.render('map')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
