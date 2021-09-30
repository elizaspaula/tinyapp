const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(morgan("dev"));
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const usersDatabase = {
  1234: {
    id: "1234",
    email: "elizabete@live.com",
    password: "abc",
  },
};

// Check if the username it's on the database
const findUserByEmail = (email) => {
  for (const userId in usersDatabase) {
    const user = usersDatabase[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// Function to generate Randon ID
function generateRadomString(
  length,
  chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
) {
  let result = "";
  for (let i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

// Check if current cookies correspond with the user in the database
const cookieHasUser = function (cookies, usersDatabase) {
  for (const user in usersDatabase) {
    if (cookies === true) {
      return true;
    }
    return false;
  }
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// GET Register page
app.get("/register", (req, res) => {
  res.render("urls_register");
});

// // POST Register page
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if the email and password are not blank
  if (!email || !password) {
    return res.status(400).send("email or password cannot be blank");
  }

  // check to see if email exists in database already
  const user = findUserByEmail(email);
  if (user) {
    return res.status(400).send("user with that email currently exists");
  }

  const id = generateRadomString(4);

  usersDatabase[id] = {
    id: id,
    email: email,
    password: password,
  };

  console.log("user", usersDatabase);
  res.cookie("UserId", id);
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["UserId"];
  const user = usersDatabase[userId];
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRadomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["UserId"];
  const user = usersDatabase[userId];
  const templateVars = { user };

  if (!user) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["UserId"];
  const user = usersDatabase[userId];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

//Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//Update using POST
app.post("/urls/:shortURL/edit", (req, res) => {
  // extract the shortURL form the URL = > req.param
  const shortUrlID = req.params.shortURL;
  // extract the LongURL content from the form = > req.body
  const newURL = req.body.newURL;
  // update the URL content in the db associated with the shortURLid
  urlDatabase[shortUrlID] = newURL;
  res.redirect("/urls/" + shortUrlID);
});

// GET Login rout
app.get("/login", (req, res) => {
  res.render("urls_login");
});

//POST Login route

app.post("/login", (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  // check if client sent down blank email or password
  if (!email || !password) {
    return res.status(403).send("email or password cannot be blank");
  }

  const user = findUserByEmail(email);

  // if that user exists with that email
  if (!user) {
    return res.status(403).send("no user with that email was found");
  }

  // does the password provided from the request
  // match the password of the user
  if (user.password !== password) {
    return res.status(403).send("password does not match");
  }

  res.cookie("UserId", user.id);
  res.redirect("/urls/");
});

//Logout route
app.post("/logout", (req, res) => {
  res.clearCookie("UserId");
  res.redirect("/urls/");
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
