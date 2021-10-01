const { assert } = require("chai");

const {
  findUserByEmail,
  urlsForUser,
  generateRandomString,
} = require("../helpers.js");

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

const testUrlDatabase = {
  bfjqot: {
    longUrl: "http://www.lighthouselabs.ca",
    userID: "user1RandomID",
  },
  htlams: {
    longUrl: "http://www.google.com",
    userID: "user1RandomID",
  },
  mjqcht: {
    longUrl: "http://www.zara.com",
    userID: "user2RandomID",
  },
};

describe("findUserByEmail", function () {
  it("should return a user properties with valid email", function () {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedOutput = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur",
    };
    assert.deepEqual(user, expectedOutput);
  });

  it("should return undefined when no user exists for a given email address", function () {
    const user = findUserByEmail("me@test.com", testUsers);
    const expectedOutput = undefined;
    assert.equal(user, expectedOutput);
  });
});

describe("urlsForUser", function () {
  it("should return an object of url information specific to the given user ID", function () {
    const specificUrls = urlsForUser("user1RandomID", testUrlDatabase);
    const expectedOutput = {
      bfjqot: {
        longUrl: "http://www.lighthouselabs.ca",
        userID: "user1RandomID",
      },
      htlams: {
        longUrl: "http://www.google.com",
        userID: "user1RandomID",
      },
    };
    assert.deepEqual(specificUrls, expectedOutput);
  });

  it("should return an empty object if no urls exist for a given user ID", function () {
    const noSpecificUrls = urlsForUser("fakeUser", testUrlDatabase);
    const expectedOutput = {};
    assert.deepEqual(noSpecificUrls, expectedOutput);
  });
});

describe("generateRandomString", function () {
  it("should return a string with four characters", function () {
    const randomStringLength = generateRandomString(4).length;
    const expectedOutput = 4;
    assert.equal(randomStringLength, expectedOutput);
  });

  it("should not return the same string when called multiple times", function () {
    const firstRandomString = generateRandomString(4);
    const secondRandomString = generateRandomString(4);
    assert.notEqual(firstRandomString, secondRandomString);
  });
});
