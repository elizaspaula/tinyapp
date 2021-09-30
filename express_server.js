const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(morgan("dev"));
app.set("view engine", "ejs");

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
    password: "1234",
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

// function urlsForUser
const urlsForUser = (id) => {
  const result = {};
  for (const url in urlDatabase) {
    const user = urlDatabase[url].userID;
    if (user === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
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

//function CookieHasUser
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

//  --- GET Register page
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//  --- POST Register page
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("email or password cannot be blank");
  }

  const user = findUserByEmail(email);

  if (user) {
    return res.status(400).send("user with that email currently exists");
  }

  // 1. Generated new password with hash
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log("Hash pass:", password, hashedPassword);

  const id = generateRadomString(4);

  usersDatabase[id] = {
    id: id,
    email: email,
    password: hashedPassword,
  };

  console.log("user", usersDatabase);
  res.cookie("UserId", id);
  res.redirect("/urls");
});

//  --- GET "/urls.json",

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// GET --- "/urls"

app.get("/urls", (req, res) => {
  const userId = req.cookies["UserId"];
  const user = usersDatabase[userId];
  const templateVars = { urls: urlsForUser(userId), user: user };

  if (!user) {
    return res.render("urls_unlogged");
  }

  res.render("urls_index", templateVars);
});

// --- POST "/urls"

app.post("/urls", (req, res) => {
  const userID = req.cookies["UserId"];
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
  const userId = req.cookies["UserId"];
  const user = usersDatabase[userId];
  const templateVars = { user };

  if (!user) {
    return res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

// ---- GET /urls/:shortURL

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["UserId"];
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
  const userId = req.cookies["UserId"];
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
  const userId = req.cookies["UserId"];
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
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email);

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
  res.cookie("UserId", user.id);
  res.redirect("/urls/");
});

//--- POST "/logout"
app.post("/logout", (req, res) => {
  const userId = req.cookies["UserId"];
  const user = usersDatabase[userId];
  res.clearCookie("UserId");
  res.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
