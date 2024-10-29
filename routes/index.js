var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local')
const upload = require("./multer")

passport.use(new localStrategy(userModel.authenticate()))

router.get('/', function (req, res, next) {
  res.render('index', { nav: false });
});

router.get('/register', (req, res) => {
  res.render('register', { nav: false })
})

router.get('/profile', isLoggedin, async (req, res) => {
  const user =
    await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts")
  res.render('profile', { user, nav: true, currentURL: '/profile' })
})

router.get('/show/posts', isLoggedin, async (req, res) => {
  const user =
    await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts")
  res.render('show', { user, nav: true })
})

router.get('/feed', isLoggedin, async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const posts = await postModel.find().populate("user")
  res.render('feed', { user, posts, nav: true, currentURL: '/feed' })
})

router.post('/createpost', isLoggedin, upload.single("postImage"), async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  })
  user.posts.push(post._id)
  await user.save()
  res.redirect("/profile")
})

router.get('/add', isLoggedin, async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user })
  res.render('add', { user, nav: true })
})

router.post('/fileupload', isLoggedin, upload.single("image"), async (req, res, next) => {
  const user = await userModel.findOne({ username: req.session.passport.user })
  user.profileImage = req.file.filename;
  await user.save()
  res.redirect("/profile")
})


router.post('/register', (req, res, next) => {
  const data = new userModel({
    username: req.body.username,
    email: req.body.email,
    contact: req.params.contact,
    name: req.body.fullname
  })

  userModel.register(data, req.body.password)
    .then(() => {
      passport.authenticate('local')(req, res, () => {
        res.redirect('/profile')
      });

    })
})

router.get('/edit', isLoggedin, async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render('edit', { user, nav: true });
});

router.post('/updateprofile', isLoggedin, upload.single("profileImage"), async (req, res) => {
  const user = await userModel.findOne({ username: req.session.passport.user });

  // Update user details
  user.username = req.body.username;  // Update username
  user.name = req.body.fullname;      // Update name
  user.email = req.body.email;
  user.contact = req.body.contact;

  if (req.file) {
    user.profileImage = req.file.filename;
  }

  await user.save();

  // Update the session with the new username
  req.session.passport.user = user.username;

  res.redirect('/profile');
});





router.post('/login', passport.authenticate('local', {
  failureRedirect: "/",
  successRedirect: "/profile"
}), (req, res) => {

})

router.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/', { currentURL: '/logout' });
  });
})

router.get('/about', (req, res) => {
  res.render('about', { nav: true,currentURL: '/about' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { nav: true,currentURL: '/contact' });
});

router.get('/privacy', (req, res) => {
  res.render('privacy', { nav: true,currentURL: '/privacy' });
});


function isLoggedin(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/')
}

module.exports = router;
