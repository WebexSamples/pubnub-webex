/*
 * In PubNub, create a function, and paste this code into it.
 * Then use the "Copy URL" button to grab the HTTP URL for the
 * function and use that URL as your Webex Webhook URL.
 */

export default (request, response) => {
  const pubnub = require('pubnub');

  function publish(channel, message) {
    return pubnub.publish({
      "channel": channel,
      "message": message
    }).then((publishResponse) => {
                console.log(channel + " " + publishResponse);

      return publishResponse;
    }).catch((err) => {
      throw new Error(err);
    });
  }

  let payload = JSON.parse(request.body);

  // this is just as good as your previous idea since I can subescribe to
  // webex.*
  // webex.memberships.*
  // webex.memberships.created
  publish(`webex.${payload.resource}.${payload.event}`, request.body).then(results => {
      return response.send("Published");
    })
    .catch(err => {
      console.log(err);
      response.status = 500;
      return response.send("Can't publish");
    });
};