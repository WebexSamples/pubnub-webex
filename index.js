var PubNub = require('pubnub');
// If dotenv is found, use that. I typically only use
// dotenv in dev systems
try { require('dotenv').config(); } catch(e) {}

pubnub = new PubNub({
  publishKey: process.env.PUBNUB_PUBKEY,
  subscribeKey: process.env.PUBNUB_SUBKEY
});

pubnub.addListener({
  message: function(message) {
    console.log("New Message!!", message);
  }
})
console.log("Subscribing..");
pubnub.subscribe({
  channels: ['spark-messages-created']
});