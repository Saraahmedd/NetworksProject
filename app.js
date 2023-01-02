var express = require("express");
var path = require("path");
var { connectToDb, getDb } = require("./db");
const fs = require("fs");
let alert = require("alert");
const session = require("express-session");
const bodyParser = require("body-parser");
const req = require("express-lib");
const { render } = require("ejs");
const dotenv = require("dotenv");
var app = express();

let db;
const account = { username: "admin", password: "admin" };

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

dotenv.config({ path: "./config.env" });
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveuninitialized: false,
  })
);

const PORT = process.env.PORT || 3030;

connectToDb((err) => {
  if (!err) {
    // app.listen(3000, () => {
    //   console.log("listening");
    // });
    app.listen(PORT, () => {
      console.log(`server started on port ${PORT}`);
    });
    db = getDb();
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function auth(req, res, next) {
  if ("username" in req.session) {
    next();
  } else {
    res.redirect("/");
  }
}

app.get("/", function (req, res) {
  res.render("login");
});

app.post("/home", async function (req, res) {
  let user = "";
  req.session.username = req.body.username;
  var userLogin =
    account.username == req.body.username &&
    account.password == req.body.password;
  console.log(userLogin);
  if (userLogin) {
    res.render("home");
  } else {
    alert("credentials are incorrect");
  }
});

const cities = ["annapurna", "bali", "inca", "paris", "rome", "santorini"];

app.post("/search", function (req, res) {
  var input = req.body.Search;
  var result = [];
  for (var i = 0; i < cities.length; i++) {
    if (cities[i].toLowerCase().includes(input.toLowerCase()))
      result.push(cities[i]);
  }
  if (result.length == 0) alert(" No Results Found ");
  res.render("searchresults", { result: result });
});

app.get("/registration", function (req, res) {
  res.render("registration.ejs");
});

app.post("/", async function (req, res) {
  var userExist = await db
    .collection("myCollection")
    .findOne({ username: req.body.username });
  if (!userExist && req.body.password) {
    db.collection("myCollection").insertOne({
      username: req.body.username,
      password: req.body.password,
      wantlist: [],
    });
    var newUser = await db.collection("myCollection").findOne({
      username: req.body.username,
      password: req.body.password,
    });
    console.log(newUser);
    alert("user added successfully");
    res.render("login");
  } else {
    alert("credentials are incorrect");

    //fs.FileSync("/registration", originalRegistration);
  }
});

app.get("/wanttogo", function (req, res) {
  showlist(req, res).catch(console.error);
});

app.get("/:name", auth, (req, res) => {
  res.render(req.params.name);
});

app.post("/:name", function (req, res) {
  console.log(req.session, "hoiii😱😱😱😱😱");
  addtowantlist(req, res, req.params.name);
});

async function addtowantlist(req, res, product) {
  var username = req.session.username;
  var user = await db
    .collection("myCollection")
    .findOne({ username: username });
  console.log(user, user.wantlist);
  var wantlist = user.wantlist;
  var found = false;
  console.log(
    req.session.username,
    "helloooo2",
    user.wantlist,
    user.wantlist.length,
    wantlist.length
  );
  for (let i = 0; i < wantlist.length; i++) {
    if (wantlist[i] == product) {
      found = true;
    }
  }
  if (found) {
    alert("Destination is already in your wantlist!");
  } else {
    alert("Destination is added successfully!");
    wantlist.push(product);
    var username = { username: req.session.username };
    var newwantlist = { $set: { wantlist: wantlist } };
    console.log(newwantlist);
    await db
      .collection("myCollection")
      .updateOne(username, newwantlist, function (err, res) {
        if (err) throw err;
        console.log("1 document updated");
      });
  }
  res.render(product);
  //client.close();
}

async function showlist(req, res) {
  var username = { username: req.session.username };
  var user = await db.collection("myCollection").findOne(username);
  var wantlist = user.wantlist;
  res.render("wanttogo", { wantlist: wantlist });
  //client.close();
}

async function showlist(req, res) {
  var username = { username: req.session.username };
  var user = await db.collection("myCollection").findOne(username);
  var wantlist = user.wantlist;
  console.log(wantlist);
  res.render("wanttogo", { wantlist: wantlist });
  //client.close();
}
