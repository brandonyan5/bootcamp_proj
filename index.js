const express = require('express')
const session = require('express-session')
const app = express()
const port = 3000
const mysql = require('mysql')
const bodyParser = require('body-parser')

// set up body parsing
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// set up our database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'bootcamp',
    multipleStatements: true
})

// set up our templating engine
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(express.static(__dirname + '/public'));

// set up our session
app.use(session({
    secret: 'keyboard cat',
    cookie: {}
}))

/**
 * signup should create a new user with the given username and password, log the user in, and redirect the user to
 * the home page
 * (in a real application, we would not store a password in plain text, but it is okay to do so here)
 */
app.post('/signup', (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const storename = req.body.store
    const storeaddress = req.body.address
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'INSERT INTO user (username, password, nameofstore, storeaddress) VALUES (?, ?, ?, ?); SELECT LAST_INSERT_ID();',
                values: [username, password, storename, storeaddress],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('Could not create account')
                    return
                }
                // If we do not error, we have created the account, lets set our session user id and return to home
                req.session.uid = result[1][0]['LAST_INSERT_ID()']
                res.redirect('/')
            }
        )
    })
})

/**
 * login should log the user in to an account, if one exists, and redirect the user to the home page
 */
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
                // If we do not error, we have found the account, lets set our session user id and redirect to home
                req.session.uid = result[0]['id']
                res.redirect('/')
            }
        )
    })
})

app.post('/logout', (req, res) => {
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
    })
})

/**
 * post should create a post with the given body if the user is logged in
 */

app.post('/add', (req, res) => {
    //const body = req.body.body
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'UPDATE user SET count = count + 1 WHERE id = ?',
                values: [req.session.uid],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If we do not error, return to home
                res.redirect('/dashboard')
            }
        )
    })
})

app.post('/subtract', (req, res) => {
    //const body = req.body.body
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'UPDATE user SET count = count - 1 WHERE id = ?',
                values: [req.session.uid],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If we do not error, return to home
                res.redirect('/dashboard')
            }
        )
    })
})

app.get('/dashboard', (req, res) => {
if (req.session.uid != null)
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
                // If we do not error, compile our comments and posts
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
    })
// change this to render the default page for non-logged in user/employee
else res.render('index')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/map', (req, res) => {
    res.render('map')
})

app.get('/', (req, res) => {
    res.render('index')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
