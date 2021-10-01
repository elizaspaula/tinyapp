//

// Function to find the user by email

const findUserByEmail = (email, usersDatabase) => {
  for (const userId in usersDatabase) {
    const user = usersDatabase[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

// Function to find the URL for User
const urlsForUser = (id, urlDatabase) => {
  const result = {};
  for (const url in urlDatabase) {
    const user = urlDatabase[url].userID;
    if (user === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
};

// Function to generate a random string, used for creating shortURL and UserID
function generateRandomString(
  length,
  chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
) {
  let result = "";
  for (let i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
module.exports = {
  findUserByEmail,
  urlsForUser,
  generateRandomString,
};
