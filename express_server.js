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

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const usersDatabase = {
  aJ48lW: {
    id: "aJ48lW",
    email: "elizabete@live.com",
    password: bcrypt.hashSync("1234", 10),
  },
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  if (!user) {
    return res.redirect("/login");
  }
  res.redirect("/url");
});

//  --- GET Register page
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//  --- POST Register page
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

  // 1. Generated new password with hash
  const hashedPassword = bcrypt.hashSync(password, 10);
  //console.log("Hash pass:", password, hashedPassword);

  const newUserID = generateRandomString(4);

  usersDatabase[newUserID] = {
    id: newUserID,
    email: email,
    password: hashedPassword,
  };

  console.log("user", usersDatabase);
  //res.cookie("UserId", id);
  req.session.user_id = newUserID; //encrypted the new user iD
  res.redirect("/urls");
});

//  --- GET "/urls.json",

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET --- "/urls"

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const templateVars = { urls: urlsForUser(userId, urlDatabase), user: user };

  if (!user) {
    return res.status(401).render("urls_unlogged");
  }
  res.render("urls_index", templateVars);
});

// --- POST "/urls"

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = usersDatabase[userID];
  if (!user) {
    return res.status(401).send("Access denied");
  }
  const shortURL = generateRadomString(6);
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID,
  };

  res.redirect("/urls/" + shortURL);
});

// --- GET "/urls/new"

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];
  const templateVars = { user };

  if (!user) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// ---- GET /urls/:shortURL

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];

  if (!user) {
    return res.render("urls_unlogged");
  }

  const url = urlDatabase[req.params.shortURL];

  if (url.userID !== userId) {
    return res.send("User it is not the owner of the shortURL");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: url.longURL,
    user,
  };

  res.render("urls_show", templateVars);
});

// --- GET /u/:shortURL

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// --- POST /urls/:shortURL/delete"
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = usersDatabase[userId];

  if (!user) {
    return res.status(401).send("Access denied");
  }

  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== userId) {
    return res.send("User it is not the owner of the shortURL");
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// --- POST EDIT
app.post("/urls/:shortURL/edit", (req, res) => {
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

//  ---GET LOGIN
app.get("/login", (req, res) => {
  res.render("urls_login");
});

// ---POST LOGIN
app.post("/login", (req, res) => {
  //console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email, usersDatabase);
  console.log("userID POST:", user);

  if (!email || !password) {
    return res.status(403).send("email or password cannot be blank");
  }

  if (!user) {
    return res.status(403).send("no user with that email was found");
  }

  const hashedPassword = user.password;

  if (!bcrypt.compareSync(password, hashedPassword)) {
    return res.status(403).send("password does not match");
  }
  //res.cookie("UserId", user.id);
  req.session.user_id = user.id;
  res.redirect("/urls/");
});

//--- POST "/logout"
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
