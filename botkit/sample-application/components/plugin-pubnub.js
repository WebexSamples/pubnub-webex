var PubNub = require('pubnub');
var debug = require('debug')('botkit:pubnub');

class PubnubBotkit {

  constructor(controller, subscribeKey) {
    let pubnub = new PubNub({
      subscribeKey: subscribeKey,
      restore: true
    });

    pubnub.addListener({
      message: function(message) {
        let payload = JSON.parse(message.message);
        debug("New Message!!", payload);
        var bot = controller.spawn({});
        controller.ingest(bot, payload, null);
      }
    });

    debug("Subscribing...");
    pubnub.subscribe({
      channels: ['webex-all-all']
    });
  }

  createWebhook(controller) {
    debug('Connecting Cisco webhook events to pubnub...');

    var webhook_name = controller.config.webhook_name || 'Botkit Firehose';

    var list = controller.api.webhooks.list().then(function(list) {
        var hook_id = null;

        for (var i = 0; i < list.items.length; i++) {
            if (list.items[i].name == webhook_name) {
                hook_id = list.items[i].id;
            }
        }

        var hook_url = controller.config.pubnub;

        debug('pubnub webhook url is ', hook_url);

        if (hook_id) {
            controller.api.webhooks.update({
                id: hook_id,
                resource: 'all',
                targetUrl: hook_url,
                event: 'all',
                secret: controller.config.secret,
                name: webhook_name,
            }).then(function(res) {
                debug('SUCCESSFULLY UPDATED WEBHOOKS TO PUBNUB');
            }).catch(function(err) {
                debug('FAILED TO UPDATE WEBHOOK', err);
                throw new Error(err);
            });

        } else {
            controller.api.webhooks.create({
                resource: 'all',
                targetUrl: hook_url,
                event: 'all',
                secret: controller.config.secret,
                name: webhook_name,
            }).then(function(res) {

                debug('SUCCESSFULLY REGISTERED WEBHOOKS TO PUBNUB');
            }).catch(function(err) {
                debug('FAILED TO REGISTER WEBHOOK', err);
                throw new Error(err);
            });

        }
    });
  }
}

module.exports = function(controller, subscribeKey) {
  if (!subscribeKey) {
    console.log("Pubnub key required");
  } else {
    var pn = new PubnubBotkit(controller, subscribeKey);
    pn.createWebhook(controller);
  }
}