/*
 * This app can be used to validate that Webex webhooks are making to PubNub.
 * It subscribes to the PubNub channels for messages, messages created, 
 * and the firehose, and prints everything recieved on those channels to the
 * console.
 */

var PubNub = require('pubnub');

// If dotenv is found, use that. I typically only use dotenv in dev systems
try { require('dotenv').config(); } catch(e) {}

if (!process.env.PUBNUB_SUBKEY) {
  // pubnub api key not given, so quit.
  console.log("No Subscriber Key specified");
  process.exit(1);
}

pubnub = new PubNub({
  subscribeKey: process.env.PUBNUB_SUBKEY,
  restore: true,
  logVerbosity: true
});

pubnub.addListener({
  message: function(message) {
    console.log(message);
  },
  status: function(status) {
    console.log(status);
  }
})

console.log("Subscribing...");
pubnub.subscribe({
  channels: ['webex.messages.created', 'webex.messages.*', 'webex.*']
});