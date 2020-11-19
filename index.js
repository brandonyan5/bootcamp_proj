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
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'INSERT INTO user (username, password, nameofstore) VALUES (?, ?, ?); SELECT LAST_INSERT_ID();',
                values: [username, password, storename],
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

app.post('/post', (req, res) => {
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
                res.redirect('/post')
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
                res.redirect('/post')
            }
        )
    })
})

/**
 * comment should create a comment associated with the post with the given post_id and should contain the given body
 */
app.post('/comment', (req, res) => {
    const post_id = req.body.id
    const body = req.body.body
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'INSERT INTO comment (user_id, body, post_id) VALUES(?, ?, ?)',
                values: [req.session.uid, body, post_id]
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If we do not error, return to home
                res.redirect('/')
            }
        )
    })
})

/**
 * this is our index route, here we should return a list of our posts and comments
 */
 /*
app.get('/', (req, res) => {
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
        // what does this table actually look like
                sql: `SELECT post.*, user.username,
                        (SELECT user.username FROM user WHERE user.id=comment.user_id) AS commenter,
                         comment.body AS comment FROM post
                         JOIN user ON user.id = post.user_id
                         LEFT JOIN comment ON comment.post_id=post.id`,
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If we do not error, compile our comments and posts
                const posts = {}
                for (let i = 0; i < result.length; i++) {
                    if (posts[result[i].id]) {
                        posts[result[i].id].comments.push({commenter: result[i].commenter, comment: result[i].comment})
                    } else {
                        posts[result[i].id] = {
                            id: result[i].id,
                            body: result[i].body,
                            username: result[i].username,
                            comments: result[i].commenter ? [{
                                commenter: result[i].commenter,
                                comment: result[i].comment
                            }] : []
                        }
                    }
                }
                res.locals = {
                    data: posts
                }
                res.render('index')
            }
        )
    })
})*/

app.get('/post', (req, res) => {
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

                            username: result[i].count

                        }

                }
                res.locals = {
                    data: shops
                }
                res.render('post')
            }
        )
    })
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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
