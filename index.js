const express = require('express')
const session = require('express-session')
const app = express()
const port = 8000
const mysql = require('mysql')
const bodyParser = require('body-parser')
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
    database: 'doordash',
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

//set up a function for calculating distance given lat and long
function latLongDist(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180; // φ, λ in radians
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

//get info from the store, and sign them up
//then go to login page
//converts store address to coordinates
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
                    res.redirect('/dashboard')
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
                    res.send('username and password combo is wrong, or user does not exist')
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
//sets req.session.uid to null after log out
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
//adds 1 to the count in the table
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
//subtracts 1 from the count
app.post('/subtract', (req, res) => {

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
//not being used currently
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
//uses inner join to only show the soldout item for that particular store
//and shows the count for that store
app.get('/dashboard', (req, res) => {
  console.log(req.session);
if (req.session.uid != null){
  console.log("dashboard success");
    pool.getConnection(function (err, connection) {
        if (err) throw err;
            connection.query({
                sql: `SELECT * FROM user INNER JOIN soldout ON soldout.store_id = ? AND user.id = ?`,
                values: [req.session.uid, req.session.uid],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                else if (result.length != 0) {
                // If no error, get count of the store
                const shops = {}
                for (let i = 0; i < result.length; i++) {
                        shops[result[i].id] = {
                            item: result[i].item
                        }
                }
                const shops2 = {}
                 shops2[result[0].id] = {
                 count: result[0].count
                 }
                res.locals = {
                    data: shops,
                    data2: shops2
                }
                res.render('dashboard')
                }
                else {
                    res.render('dashboard')
                }
            }
        )
        connection.release();
    })
//redirects to home page because no store is logged in
}else{ res.render('index'); res.redirect('/'); console.log("dashboard fail");}
})

//grab search results for partial string search (or full string search)
//select the stores within 20 miles of user location using math
app.post('/map', (req, res) => {
    const inp = req.body.search;
    const currLat = req.body.currLat;
    const currLong = req.body.currLong;
    //console.log(inp, currLat, currLong);
    pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query({
                sql: 'SELECT * FROM user WHERE nameofstore LIKE ?',
                values: [inp + "%"],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                const shops = {}
                for (var i = 0; i < result.length; i++) {
                    console.log(latLongDist(currLat, currLong, result[i].storelat, result[i].storelong))
                    if (latLongDist(currLat, currLong, result[i].storelat, result[i].storelong) <= 30000) {
                      console.log(result[i]);
                      shops[result[i].id] = {
                        nameofstore: result[i].nameofstore,
                        storeaddress: result[i].storeaddress,
                        count: result[i].count,
                        storeid: result[i].id
                      }
                    }
                }
                res.locals = {
                    data: shops
                }
                res.render('map')
            }
        )
        connection.release();
    })
})

//record user input from req.body
//then insert the item into the soldout table
app.post('/soldout', (req, res) => {
    const sold_out = req.body.soldout
    console.log(req.session);
    pool.getConnection(function (err, connection) {
        if (err){ throw err; console.log("add fail");};
         console.log("add success");
        connection.query({
                sql: 'INSERT INTO soldout (item, store_id) VALUES (?, ?);',
                values: [sold_out, req.session.uid],
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

//get correct entry from soldout table
//display the items on the screen
app.post('/moreinfo', (req, res) => {
  const id = req.body.storeid;
  console.log(req.session);
  console.log(id);
  console.log("moreinfo success");
    pool.getConnection(function (err, connection) {
        if (err) throw err;
            connection.query({
                sql: 'SELECT * FROM soldout WHERE soldout.store_id=?;',
                values: [id],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }

                //name data to reference in the html file
                const shops = {}
                for (let i = 0; i < result.length; i++) {
                    shops[result[i].id] = {
                    sold_out_item: result[i].item

                    }

                }
                res.locals = {
                    data: shops
                }
                res.render('more_info')
            }
        )
        //prevents pages not loading after a few requests
        connection.release();
    })

})

//get the item to delete from req.body
//then delete corresponding entry from the soldout table
app.post('/deleteitem', (req, res) => {
   const itemToDelete = req.body.deleteitem
    console.log(itemToDelete);
    pool.getConnection(function (err, connection) {
        if (err){ throw err; console.log("delete item fail");};
         console.log("delete item success");
        connection.query({
                sql: `DELETE FROM soldout WHERE store_id = ? AND item = ?`,
                values: [req.session.uid, itemToDelete],
            }, function (err, result) {
                if (err) {
                    console.error(err)
                    res.send('An error has occurred')
                    return
                }
                // If no error, redirect to store dashboard so the soldout list updates
                res.redirect('/dashboard')
            }
        )
        connection.release();
    })
})

//rendering corresponding pages
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
