var botkit = require('botkit');
var builder = require('botbuilder');
var http = require('http');
var cheerio = require('cheerio');

var token = 'PUT YOUR TOKEN HERE';
var channelId = 'CHANNEL_ID';

// create slackbot controller
var controller = botkit.slackbot({
  debug: false
});

// create the slackbot
var slackbot = controller.spawn({
   token: token,
   retry: Infinity
});

// connect the slackbot to a stream of messages
slackbot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

//
function download(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

function sendSlackMessage(text, image){
  slackbot.say({
    channel: channelId,
    attachments: [
      {
          fallback: text,
          color: "#36a64f",
          title: text,
          image_url: image
      }]
  });
}

function prepMessage(link){
  http.get(link, function(res) {
    console.log("Got response: " + res.statusCode);
    console.log(res.headers.location);
    var newLink = res.headers.location;
    download(newLink, function(data){
      var $ = cheerio.load(data);
      var image = $("#post1 > div > p > img").attr().src;
      var text = $("#post1 > div > h3").text();
      sendSlackMessage(text, image);
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

// setup rss watcher
var Watcher  = require('feed-watcher');
// var feed     = 'http://lorem-rss.herokuapp.com/feed?unit=second&interval=5';
var feed     = 'http://thecodinglove.com/rss';
var interval = 10;

// if not interval is passed, 60s would be set as default interval.
var watcher = new Watcher(feed, interval)

// Check for new entries every n seconds.
watcher.on('new entries', function (entries) {
  entries.forEach(function (entry) {
    prepMessage(entry.link);
  })
})

// Start watching the feed.
watcher.start()
  .then(function (entries) {
    //entries.forEach(function (entry) {
      //prepMessage(entry.link);
      //console.log(entry.title);
   //});
   console.log('watcher started!');
})
.catch(function(error) {
   console.error(error)
});

controller.on('team_migration_started', function(slackbot){
  console.log('team_migration_started');
  throw new Error('team_migration_started');
});

// Test method
controller.hears('ping',['direct_message','direct_mention','mention'], function(slackbot,message) {
  slackbot.reply(message,'pong');
});
