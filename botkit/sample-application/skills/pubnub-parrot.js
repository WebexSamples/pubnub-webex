module.exports = function(controller) {
    // This before middleware allows the help command to accept sub-thread names as a parameter
    // so users can say help to get the default thread, but help <subthread> will automatically
    // jump to that subthread (if it exists)
    controller.hears(['(.*)'], 'direct_message,direct_mention', function (bot, message) {
      bot.reply(message, "Squawk! " + message.match[1])
    });
}
