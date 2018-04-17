export default (request, response) => {
  const pubnub = require('pubnub');
  const crypto = require('crypto');
  const vault = require('vault');

  function publish(channel, message) {
    pubnub.publish({
      "channel": channel,
      "message": message
    }).then((publishResponse) => {
      return publishResponse;
    }).catch((err) => {
      throw new Error(err);
    });
  }

  function validateSecret(secret, payload) {
    return new Promise(function(resolve, reject) {
      if (!secret) {
        // No secret is stored to validate against, resolve
        return resolve(true);
      } else {
        crypto.hmac(secret, JSON.stringify(payload), crypto.ALGORITHM.HMAC_SHA1).then((result) => {
          if (request.headers["x-spark-signature"] == result) {
            return resolve(true);
          } else {
            return reject(new Error("Spark Signature does not match.", request.headers["x-spark-signature"], result));
          }
        }).catch((err) => {
          return reject(new Error("Error trying validate Signature", err));
        });
      }
    });
  }

  let payload = JSON.parse(request.body);

  validateSecret(vault.get("secret"), payload)
    .then(valid => {
      let channel = `spark-${payload.resource}-${payload.event}`;
      return publish(channel, request.body)
        .then(status => {
          console.log(`Publish Status: ${status[0]}:${status[1]} with TT ${status[2]}`);
          return response.send("Published");
        })
        .catch(err => {
          throw err;
        })
    })
    .catch(err => {
      console.log(err)
      response.status = 500;
      return response.send("Can't publish");
    });
};