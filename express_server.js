const express = require("express");
const morgan = require("morgan");
const app = express();
const PORT = 8080; // default port 8080

app.use(morgan("dev"));

app.set("view engine", "ejs");

function generateRadomString(
  length,
  chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
) {
  let result = "";
  for (let i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRadomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
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
// Requires to change on the client and the server
// Once the user submits an Update request, it should modify the corresponding longURL, and then redirect the client back to "/urls".

// a. display the update form -- > URL form

// b. post request to update the data in the URLDatabase

app.post("/urls/:shortURL/edit", (req, res) => {
  // extract the shortURL form the URL = > req.param
  const shortUrlID = req.params.shortURL;
  // extract the LongURL content from the form = > req.body
  const newURL = req.body.newURL;
  // update the URL content in the db associated with the shortURLid
  urlDatabase[shortUrlID] = newURL;
  res.redirect("/urls/" + shortUrlID);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
