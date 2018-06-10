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

  return Promise.all([
    publish(`webex-${payload.resource}-${payload.event}`, request.body),
    publish(`webex-${payload.resource}all`, request.body),
    publish(`webex-all-all`, request.body)
  ])
    .then(results => {
      return response.send("Published");
    })
    .catch(err => {
      console.log(err);
      response.status = 500;
      return response.send("Can't publish");
    });
};