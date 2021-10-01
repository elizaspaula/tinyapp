const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;
const {
  findUserByEmail,
  urlsForUser,
  generateRandomString,
} = require("./helpers");

const urlDatabase = {};
const usersDatabase = {};

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

//Below the end point

app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  if (!user) {
    return res.redirect("/login");
  }
  res.redirect("/url");
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email);

  if (!email || !password) {
    return res.status(400).send("email or password cannot be blank");
  }

  if (user) {
    return res.status(400).send("user with that email currently exists");
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

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const templateVars = { urls: urlsForUser(userId, urlDatabase), user: user };

  if (!user) {
    return res.status(401).render("urls_unlogged");
  }
  res.render("urls_index", templateVars);
});

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

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const templateVars = { user };

  if (!user) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

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

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];

  if (!url) {
    return res.status(400).send("This shortURL doesn't exit");
  }
  res.redirect(url.longURL);
});

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

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserByEmail(email, usersDatabase);
  const hashedPassword = user.password;
  if (!email || !password) {
    return res.status(403).send("email or password cannot be blank");
  }

  if (!user) {
    return res.status(403).send("no user with that email was found");
  }

  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send("password does not match");
  }

  req.session.user_id = user.id;
  res.redirect("/urls/");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
