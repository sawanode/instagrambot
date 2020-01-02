var express = require('express');
var router = express.Router();
const Instagram = require('./instx.js');
var request = require("request");
const FileCookieStore = require('tough-cookie-filestore2');
const Telegraf = require('telegraf');
var fs = require("fs");


var cookieStore = new FileCookieStore('./user/cookies.json'); //Cookies File

//Config Data
var username = "Username or Email",
    password = "Your Password";
var config = JSON.parse(fs.readFileSync("./user/data.json")); //or require("./user/data.json")

//Set Process False
config.Start = false;

var client = new Instagram({ cookieStore });

(async function () {
await client.login({username, password}); //Loin with username and password

if (!client.isLogin()) {
  console.log("Login Fuild!");
  return;
}

//Set Process True
config.Start = !config.Start;
//Start Task
start(err => {
  console.log("Error Code: " + err);
});

})();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

async function start(onError) {
console.log("Checking Stories ...");
//Get Only New Sotries
var list = await client.getNewStories(); //Result list of users has new Story (userid and storyid)
console.log(list);
if (list.error) {
  if (onError) onError(list.error);
  return;
}

for (var i in list) {
  var s = await client.SeeStory(list[i]); //Mark Story seen by userid and storyid
  //console.log(s);
  if (s.error) {
    console.log("Error Code 3"); //account block 
    await sleep(10000);
    i--;
    continue;
  }
  console.log("View: " + i);
  await sleep(100);
}
if (config.Start) { //process is true
  //Pause 4 seconds before rechecking (Recommended)
  await sleep(4000);
  start();
}
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stop() {
  //Stop process
  config.Start = false;
}

function logout() {
  fs.writeFileSync("./user/cookies.json", "{}", "UTF-8");
  cookieStore = new FileCookieStore('./user/cookies.json'); //Cookies File
  client = new Instagram({ cookieStore });
}

/* Skip Automatic Stop the Server */
/* Some free hosting stops the server  if it is not active during a short period like "reple.it" */
if (config.url) {
  setInterval(() => {
request.get(config.url, () => {console.log(config.url)});
}, 1 * 1000 * 60);
}


module.exports = router;
