const express = require("express");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const UserModel = require("./models/user");
// const OtpModel = require("./models/otp");
const jwt = require("jsonwebtoken");
const nodeMailer = require("nodemailer");
// const dotenv = require("dotenv").config();
require("dotenv").config();
const cors = require("cors");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let blacklist = [];

// login using the created account
app.post("/login", async (req, res) => {
  // username and password from login body
  const { username, password } = req.body;

  // hash the login password first
  const hashFromLogin = crypto
    .pbkdf2Sync(password, "SECRET", 60, 64, "sha256")
    .toString("hex");

  console.log(hashFromLogin);

  // user details from signup data
  const user = await UserModel.findOne({ username });
  console.log(user);

  try {
    // check if the entered creds are right or wrong
    if (hashFromLogin === user?.hash) {
      // if correct then make it jwt authenticated

      // accessToken is created
      const token = jwt.sign(
        {
          id: user._id,
          name: user?.name,
          role: user.role,
        },
        "SECRET",
        {
          expiresIn: "5mins",
        }
      );

      // refreshToken is created
      const refreshToken = jwt.sign({}, "REFRESHTOKEN", {
        expiresIn: "7 days",
      });

      return res.status(200).send({
        message: "Login successfull",
        token: token,
        refreshToken: refreshToken,
      });
    }
  } catch {
    return res
      .status(401)
      .send({ message: "No token provided, enter valid credentials" });
  }
});

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// create a user account
app.post("/signup", async (req, res) => {
  const { username, password, name, role } = req.body;

  // hash the password first
  const hash = crypto
    .pbkdf2Sync(password, "SECRET", 60, 64, "sha256")
    .toString("hex");

  try {
    const user = new UserModel({ username, hash, name, role });
    await user.save();

    return res.status(200).send({ message: "User created successfully" });
  } catch {
    return res
      .status(403)
      .send({ message: "You are not authorized to do this" });
  }
});

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// create an employee
app.post("/employee", async (req, res) => {
  const user = new UserModel(req.body);

  const token = req.headers["authorization"].split(" ")[1];

  if (!token) {
    return;
  }
  try {
    const { role } = jwt.verify(token, "SECRET");
    console.log(role);

    // by default only HR is being able to create a new employee
    // so check if the new employee being created is either Employee or Guests
    if (role === "Employee" || role === "Guests") {
      // if yes  only then send the details
      return res.status(200).send(user);
    }
    return res
      .status(401)
      .send("You don't have access to create a new employee");
  } catch (e) {
    return res.status(403).send("Forbidden");
  }
});

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// verify the token
app.get("/verify", async (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];

  try {
    const verify = jwt.verify(token, "SECRET");
    const user = await UserModel.findOne();

    if (verify && user.role === "Employee") {
      return res.status(200).send({ message: "Verified", user });
    }
  } catch {
    blacklist.push(token);
    return res.status(401).send("Token expired");
  }
});

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//reset a password
app.put("/reset-password", async (req, res) => {
  const { password } = req.body;
  const user = await UserModel.findOneAndUpdate(
    password,
    {
      $set: req.body,
    },
    { new: true }
  );

  const token = req.headers["authorization"].split(" ")[1];
  const refreshToken = req.headers["authorization"].split(" ")[1];

  for (let i = 0; i < blacklist.length; i++) {
    if (blacklist[i] === token) {
      return res.status(401).send("Token has expired");
    }
  }

  try {
    const verify = jwt.verify(token, "SECRET");
    const verifyRefreshToken = jwt.verify(refreshToken, "REFRESHTOKEN");

    if (verify) {
      return res.status(200).send(user);
    }
    // if refreshToken is valid create a new access token/primary token
    else if (verifyRefreshToken) {
      const newAccessToken = jwt.sign({}, "SECRET", { expiresIn: "5mins" });
      return res.status(200).send({ token: newAccessToken });
    }
    return res.status(403).send("Forbidden");
  } catch (e) {
    return res.status(403).send("Forbidden");
  }
});

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// get user details
app.get("/user/:id", async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  //console.log(user);
  const token = req.headers["authorization"]?.split(" ")[1];

  for (let i = 0; i < blacklist.length; i++) {
    if (blacklist[i] === token) {
      return res.status(401).send("Token has expired");
    }
  }

  try {
    const verify = jwt.verify(token, "SECRET");

    for (let i = 0; i < user.length; i++) {
      if (verify.role !== user[i].role) {
        return res.status(403).send("Forbidden");
      } else {
        return res.status(200).send(user[i]);
      }
    }
  } catch (e) {
    return res.status(403).send("Forbidden");
  }
});

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

app.post("/getemail", async (req, res) => {
  const { email } = req.body;
  let user = await UserModel.findOne({ email });
  const mail = await nodeMailer.createTransport({
    service: "gmail",
    port: 587, //465
    auth: {
      user: "bushjabeen22@gmail.com",
      pass: process.env.PASS,
    },
  });
  let otp = Math.floor(Math.random() * 1000000);

  const info = await mail.sendMail({
    from: "Bushra",
    to: `${email}`,
    subject: "Evaluation testing",
  });

  if (user) {
    // const token = jwt.sign({ email: user.email, otp: otp }, "SECRET");
    res.send({ email: user.email, otp: otp, id: user._id });
  } else {
    // const token = jwt.sign({ otp }, "SECRET");
    res.send({ otp });
  }
});

//------------------------------------------------------------------------------------------------------------------------------

mongoose.connect("mongodb://localhost:27017/web-17").then(() => {
  app.listen(8080, () => {
    console.log("Server started on port 8080");
  });
});
