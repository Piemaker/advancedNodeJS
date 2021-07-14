'use strict';
require('dotenv').config({
  path: __dirname + '/sample.env'
});
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const bcrypt = require("bcrypt");

const app = express();
app.set('view engine', 'pug');

fccTesting(app); // For fCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false
  }
}));

app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/")
}

myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');

  // Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
    res.render('pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });

  app.route('/login').post(passport.authenticate('local', {
    failureRedirect: '/'
  }), (req, res) => {
    res.redirect('/profile');
  });

  app.route("/logout")
  .get((req,res)=>{
    req.logout()
    res.redirect("/")
  })

  app.route("/register")
  .post((req,res,next)=>{
    myDataBase.findOne({username:req.body.username},(err,user)=>{
      if(err){
        return next(err)
      }
      else if (user){
        res.redirect("/")
      }
      else {
        //use bcrypt to hash the password
        const saltRounds = 12;
        const hash = bcrypt.hashSync(req.body.password,saltRounds);
        myDataBase.insertOne({
          username: req.body.username,
          password: hash
        },
        (err,doc)=>{
          if(err){
            res.redirect("/")
          }
          else{
            next(null, doc.ops[0])
          }
        })
      }
    })
  })

  app.route('/profile').get(ensureAuthenticated,(req, res) => {
    res.render(process.cwd() + '/views/pug/profile',{username: req.user.username});
  });

  //handle missing pages
app.use((req,res,next)=>{
  res.status(404)
  .type("text")
  .send("Not Found");
})


  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({
      _id: new ObjectID(id)
    }, (err, doc) => {
      done(null, doc);
    });
  });
  passport.use(new LocalStrategy(
    function (username, password, done) {
      myDataBase.findOne({
        username: username
      }, function (err, user) {
        console.log('User ' + username + ' attempted to log in.');
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false);
        }
        //check if password's hash is not equal to the saved hash
        if (!bcrypt.compareSync(user.password,password) ) {
          return done(null, false);
        }
        return done(null, user);
      });
    }
  ));
  // Be sure to add this...
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', {
      title: e,
      message: 'Unable to login'
    });
  });
});
// app.listen out here...

app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + process.env.PORT);
});