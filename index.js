// require packages
require('dotenv').config()
const express = require('express')
const ejsLayouts = require('express-ejs-layouts')
const db = require('./models')
const cookieParser = require('cookie-parser')
const crypto = require('crypto-js')

// config express app/middleware
const app = express()
const PORT = process.env.PORT || 3000
app.set('view engine', 'ejs')
app.use(ejsLayouts)
app.use(express.urlencoded({  extended: false }))
app.use(cookieParser())

// our custom auth middleware
app.use(async (req, res, next) => {
    // console.log('hello from a middleware)
    res.locals.myData = 'hello, fellow route'
    // if there is a cookie on the incoming request
    if(req.cookies.userId) {
        // decrypt the user id before you look up the user in the db
        const decryptedId = crypto.AES.decrypt(req.cookies.userId.toString(), process.env.ENC_SECRET)
        const decryptedIdString = decryptedId.toString(crypto.enc.Utf8)
        // look up the user in the db
        const user = await db.user.findByPk(decryptedIdString)
        // mount the user on the res.locals
        res.locals.user = user
        // if there is no cookie -- set the user to be null in the res.locals
    } else {
        res.locals.user = null
    }

    // move on to the next route or middleware in the chain
    next()

})
//  Controllers
app.use('/users', require('./controllers/user'))
app.use('/entries', require('./controllers/entries'))

// route definitions
app.get('/', (req, res) => {
    db.entry.findAll({
        include: [db.user]
    }) .then((entries) => {
        res.render('home', { entries: entries })
    }) .catch ((error) => {
        console.log(error)
        res.status(400).render('Home/404')
    })
    // console.log('the currently logged in user is:', res.locals.user)
    
})

app.get('/entry/new', (req, res) => {
    axios.get(`https://api.api-ninjas.com/v1/randomword?s=${req.query.word.data}&apikey=${process.env.X_Api_Key}`)
      .then(response => {
        res.render('results.ejs', { entries: response.data.word })
      })
      .catch(console.log)
  })

// listen on a port
app.listen(PORT, () => {
console.log(`This is a safe space on port ${PORT}`)
})