//App setup
const express = require("express");
const app = express();
const PORT = 8080;

const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");

const bodyParser = require("body-parser");
app.use(cookieParser());
app.use(morgan("dev"));
app.set("view engine", "ejs");

app.use(
  cookieSession({
    name: "session",
    keys: ["Some way to encrypt the values", "$!~`yEs123bla!!%"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

//Helpers functions:
const {
  findUserByEmail,
  urlsForUser,
  generateRandomString,
} = require("./helpers");

//Variable to store the URL and USER
const urlDatabase = {};
const usersDatabase = {};

//---------------------------------------------------------------------------------------------------------------------------------------------------//

// ** ROUTING BELOW ** //

//Root - GET /
//Redirect to /urls if the user is logged, otherwise go to /login
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  if (!user) {
    return res.redirect("/login");
  }
  res.redirect("/url");
});

// Root - GET /register
// Redirect to/url if the user is logged, otherwise go to register page
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("urls_register");
});

//Root - POST /register
//Redirected to the /urls if the credentials are valid, otherwise it will create a new user.
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Email or Password cannot be blank");
  }

  const user = findUserByEmail(email, usersDatabase);
  if (user) {
    return res
      .status(400)
      .send("User with that email currently exists. Please go to login page");
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUserID = generateRandomString(4);

  usersDatabase[newUserID] = {
    id: newUserID,
    email: email,
    password: hashedPassword,
  };
  req.session.user_id = newUserID;
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Root - GET /urls
//Redirect to index page if the user is logged, otherwise will return an error message
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const templateVars = { urls: urlsForUser(userId, urlDatabase), user: user };

  if (!user) {
    return res.status(401).render("urls_unlogged");
  }
  res.render("urls_index", templateVars);
});

//Root - POST /urls
//Redirect to index page if the user is logged,otherwise will show up an error message
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = usersDatabase[userID];
  if (!user) {
    return res.status(401).send("Access denied");
  }

  const shortURL = generateRandomString(6);

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID,
  };

  res.redirect("/urls/" + shortURL);
});

//Root - GET /urls/new
//Redirect to urls_new if the user is logged. Otherwise it will redirect to login page.
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const templateVars = { user };

  if (!user) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//Root - GET urls/:shortURL
//Redirect to urls_show if the user is logged. Otherwise will redirect to "unlloged_page".
//Note - users can access only their own shortULR
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const url = urlDatabase[req.params.shortURL];

  if (!url) {
    return res.send("This URL doesn't exit");
  }
  if (!user) {
    return res.render("urls_unlogged");
  }
  if (url.userID !== userId) {
    return res.status(401).send("User it is not the owner of the shortURL");
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: url.longURL,
    user,
  };

  res.render("urls_show", templateVars);
});

//Root - GET "/u/:shortURL"
//Redirect to longURL if the shortURL exists. Otherwise will return an error message
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];

  if (!url) {
    return res.status(400).send("This shortURL doesn't exit");
  }
  res.redirect(url.longURL);
});

//Root - POST /urls/:shortURL/delete
//If the user is logged and owns the URL can delete the shortULR and it will redirect to /urls. Otherwise the user can't delete it.
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const shortURL = req.params.shortURL;

  if (!user) {
    return res.status(401).send("Access denied");
  }

  if (urlDatabase[shortURL].userID !== userId) {
    return res.send("User it is not the owner of the shortURL");
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//Root - POST /urls/:shortURL
//If the user is logged redirect to URL and allow to update it. If the user doesn't own the URL or it's not logged returns error message.
app.post("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];

  if (!user) {
    return res.status(401).send("Access denied");
  }
  const shortUrlID = req.params.shortURL;
  if (urlDatabase[shortUrlID].userID !== userId) {
    return res.send("User it is not the owner of the shortURL");
  }

  const newURL = req.body.newURL;
  urlDatabase[shortUrlID].longURL = newURL;
  res.redirect("/urls/" + shortUrlID);
});

//Root - GET /login
//Redirects to urls index page if already logged in
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  res.render("urls_login");
});

//Root - POST /login
//redirects to urls index page if email and password are valid. Otherwise it will return an error message
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, usersDatabase);

  if (!email || !password) {
    return res.status(403).send("Email or Password cannot be blank");
  }

  if (!user) {
    return res
      .status(403)
      .send("No user with that email was found. Please register a new user");
  }
  const hashedPassword = user.password;
  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send("password does not match");
  }

  req.session.user_id = user.id;
  res.redirect("/urls/");
});

//Root - Post Logout
//Clears cookies and redirects to urls index page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
