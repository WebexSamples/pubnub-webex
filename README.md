Building Cisco Webex Teams bots and integrations that need access to behind-the-firewall resources can be a challenge. Webex API events are delivered with an HTTP push model that requires your bot to be hosted on a web server that’s available on the public internet, but not all IT infrastructure allows for public web servers.

[PubNub](https://www.pubnub.com/) is a publish and subscribe service that makes it easy to deliver events to applications in real-time, across a wide variety of network configurations. If the application can reach the internet, it can receive PubNub events. The reference architecture, helper applications, and sample code provided here allow you to use PubNub as a transport to get your Webex Teams events delivered behind the firewall, to mobile clients, or wherever you need them to go.

As a bot builder, if you need to receive webhooks from the Webex API, but cannot provide a public-facing web service to receive them, you can use this reference architecture and example code for PubNub. The code found in this repository includes an application for PubNub's serverless computing platform, [Functions](https://www.pubnub.com/products/functions/) that exposes an HTTP interface to the public web to receive the incoming webhooks. The Function publishes these to a PubNub channel that mirrors the webhook resource and event type. For example, a *Message Created* webhook is simultaneously published to channels called `webex-messages-created`, `webex-messages-all`, and `webex-all-all`.  In your Webex application, you subscribe to the appropriate PubNub channels, then reads the JSON data in their app, just as if it were delivered over HTTP.

Only webhooks from the Webex API to your application transit over PubNub. API calls from your application code to the Webex API are made directly to api.ciscospark.com, just as before.

## The serverless Function

The file `pubnub-function.js` contains the code for the PubNub Function. It requires no configuration or changes, and can be deployed as is to your own PubNub account.

Deploy the function by following the [PubNub Function documentation](https://www.pubnub.com/docs/tutorials/pubnub-functions). When asked for a type of Function, choose *On Request* and anything you'd like for a URI Path. This URI Path becomes part of the webhook URL you'll give to the Webex API, but PubNub provides a way to copy the entire URI, so it's not important that you choose something memorable here. Then, in the Functions code editor, paste the contents of `pubnub-function.js`.

The Function is stopped by default. Save the Function code, then press Restart to start up the Function. On the left side of the code, you'll see the URI path you chose, and a *Copy URL* button. Pressing this will copy the entire Webhook endpoint URL to your clipboard.

## Configuring the Webex API

You'll need to create a webhook in the Webex Teams API (or update one you already have) using the Functions URL you just copied. Refer to the Webex for Developers documentation to see [how to create a webhook](https://developer.webex.com/webhooks-explained.html).

Create all the webhooks you need for your application and point them all at your Functions URL. The Function will operate correctly regardless of the type of webhook sent to it, so you should configure the webhooks you need for your application without regard to the Functions.

## Configuring your application

You'll need to make changes to your application code to subscribe to the PubNub channel, take the message content, and route it to your application logic. [PubNub provides client SDKs](https://www.pubnub.com/docs) for 70+ languages and frameworks. Refer to the PubNub documentation to learn how to subscribe to a channel using your chosen language.

Once you're subscribed to the channel, you'll need to take the PubNub messages as they arrive on the channel and route them to your application logic. The exact method you would do this would depend on the framework you're using and how your application is built, but the following illustration should help you understand how this works.

This example uses the Javascript SDK ciscospark in Node with Express, and with two routes configured, one for messages created and one for memberships created.

Before

```javascript
app.post('/messages', function(req, res) {
  var msg = {
      text: "pong!",
      roomId: req.body.data.roomId
    };
  ciscospark.messages.create(msg);
  res.send("done");
});

app.post('/memberships', function(req, res) {
  var msg = {
      text: "Hi, glad to be in the Space!",
      roomId: req.body.data.roomId
    };
  ciscospark.messages.create(msg);
  res.send("done");
});

```

With PubNub, since the webhooks are no longer arriving via HTTP POST, you'll need to decouple the application logic from the Express Router. This is done by adding functions with the application logic, and then having the Express Router cub channel.

```javascript
function handleMessage(body) {
  var msg = {
      text: "pong!",
      roomId: body.data.roomId
    };
  ciscospark.messages.create(msg);
}

function handleMembership(body) {
  var msg = {
      text: "Hi, glad to be in the Space!",
      roomId: body.data.roomId
    };
  ciscospark.messages.create(msg);  
}

pubnub = new PubNub({
  subscribeKey: process.env.PUBNUB_SUBKEY
});

pubnub.addListener({
  message: function(message) {
    if (message.channel == 'webex-messages-created') {
      handleMessage(message.message);
    } else if (message.channel == 'webex-memberships-created') {
      handleMembership(message.message);
    }
  }
})

pubnub.subscribe({
  channels: ['webex-messages-created', 'webex-meberships-created']
});

// Leave this in case there's still HTTP webhooks
app.post('/messages', function(req, res) {
  handleMessage(req.body);
  res.send("done");
});

// Leave this in case there's still HTTP webhooks
app.post('/memberships', function(req, res) {
  handleMembership(req.body);
  res.send("done");
});

```

## Howdy Botkit

Applications built upon Howdy Botkit can use the Botkit plugin `pubnub-plugin.js` found in the `botkit` directory of this repo. The Botkit plugin automatically configures your application to receive webhooks through PubNub instead of HTTP, with no application changes on your part.

To install, place the `pubnub-plugin.js` file in your Botkit `components` directory, activate the plugin by adding to your `bot.js` file the following line:

```javascript
require(__dirname + '/components/plugin-pubnub.js')(controller, process.env.pubnub_subkey);
```

This line should be added after the line that configures events, resulting in your bot.js looking like:

```javascript
// Tell Cisco Spark to start sending events to this application
require(__dirname + '/components/subscribe_events.js')(controller);
require(__dirname + '/components/plugin-pubnub.js')(controller, process.env.pubnub_subkey);
```

Then add the following lines to your `.env` file:

```
pubnub=https://YOUR-PUBNUB-FUNCTION-URL
pubnub_subkey=YOUR-PUBNUB-SUBSCRIBE-KEY
```

No further changes are needed. Restart your botkit application and your application will begin using PubNub for all messages.

## Validation

A test application included here called `monitor.js` subscribes to the PubNub channels for the Webex firehose, the messages firehose, and the messages created webhooks. Anything received on this channel are written to the console, so if PubNub is configured properly and your Webex webhooks are being sent to the right PubNub URL, then you will see a copy of every webhook printed to the console as long as monitor.js runs.

To start the monitor, set an environment variable `PUBNUB_SUBKEY` with your PubNub application's Subscribe Key, and then run `node monitor.js`. You can do this with a single command like

```
PUBNUB_SUBKEY=sub-c-YOUR_KEY node monitor.js
```
