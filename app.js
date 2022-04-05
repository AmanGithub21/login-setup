require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const app = express();

const User = require("./models/User");

mongoose
  .connect("mongodb://localhost:27017/morfsysdb")
  .then(() => console.log("DB Connected"))
  .catch((e) => console.log("DB NOT CONNECTED", e));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRET_KEY,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 24 },
    resave: false,
  })
);

app.get("/", (req, res) => {
  return res.send("HELLO MORFSYS");
});

app.get("/getuser", async (req, res) => {
  try {
    // console.log(req.session.user);
    const { user } = req.session;
    if (user) {
      console.log(user);
      return res.status(200).json(user);
    } else {
      return res.status(200).json("NOT LOGGED IN YET");
    }
  } catch (e) {
    console.log("GETUSER ERROR", e);
    res.status(200).json({ MESSAGE: e.message, STACK: e.stack });
  }
});

// needs: firstName, LastName, username, email and password
app.post("/register", async (req, res) => {
  try {
    const newUser = new User({
      ...req.body,
      password: await bcrypt.hash(req.body.password, 5),
    });
    // console.log(newUser);
    newUser.save();
    res.status(200).json(newUser);
  } catch (e) {
    console.log("REGISTER ERROR", e);
    res.status(200).json({ MESSAGE: e.message, STACK: e.stack });
  }
});

// needs: username and password
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username });
    if (foundUser) {
      // console.log(foundUser);
      const result = await bcrypt.compare(password, foundUser.password);
      if (result) {
        req.session.loggedIn = true;
        req.session.user = foundUser;
        return res.status(200).json("LOGGED IN");
      } else {
        return res.status(200).json("PASSWORD INCORRECT");
      }
    } else {
      return res.status(200).json("USER NOT FOUND!");
    }
  } catch (e) {
    console.log("LOGIN ERROR", e);
    res.status(200).json({ MESSAGE: e.message, STACK: e.stack });
  }
});

app.post("/logout", async (req, res) => {
  try {
    await req.session.destroy();
    return res.status(200).json("Successfully logged Out");
  } catch (e) {}
});

app.put("/register", async (req, res) => {
  try {
    const { user } = req.session;
    const { firstName, lastName, username } = req.body;

    if (!user) {
      return res.status(404).json("NOT LOGGEDIN");
    }

    const updateUser = await User.findOne({ username: user.username });
    if (username) {
      const existingUser = await User.findOne({ username });
      if (!existingUser) {
        updateUser.username = username;
      } else {
        return res.status(404).json("USER ALREADY EXISTS.");
      }
    }
    if (firstName) {
      updateUser.firstName = firstName;
    }
    if (lastName) {
      updateUser.lastName = lastName;
    }
    await updateUser.save();
    req.session.user = updateUser;
    return res.status(200).json("USER UPDATED");
  } catch (e) {}
});

app.listen(3000, (req, res) => {
  console.log("Server running on 3000");
});
