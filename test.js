const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const findUserByEmail = (email, testUsers) => {
  for (const userId in testUsers) {
    const user = testUsers[userId];
    if (user.email === email) {
      return userId;
    }
  }
  return null;
};

console.log(findUserByEmail("user@example.com", testUsers));
