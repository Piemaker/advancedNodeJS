const passport = require("passport");
const pug = require("pug");
const bcrypt = require("bcrypt");
module.exports = function(app,myDataBase){
    
    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return next();
        }
        res.redirect("/")
      }

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


}