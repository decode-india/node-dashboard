
var _ = require('underscore'),

    express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server, {log: false}),

    HitsHandler = require('./hitsHandler'),
    // Init handler
    // Parameter: polling interval in ms
    handler = new HitsHandler(3000);
  

/** Website's location */
app.use(express.static(__dirname + '/../public'));


/** Start listening on Redis channels */
handler.start();

/** Broadcast fresh stats to clients every sec */
io.sockets.on('connection', function(socket) {
  /* Client has possibility to notify
   * the server about specific keys it's
   * interested in */
  socket.on('stats', function(keys) {
    socket.keys = keys && keys.split(',');
  });

  var onStats = function(stats) {
    stats = !socket.keys ? stats : _.pick.apply(_, [stats].concat(socket.keys));
    socket.emit('stats', stats);
  };

  handler.on('stats', onStats);
  socket.on('disconnect', function() { handler.removeListener('stats', onStats); });
});

/** Listen for connections */
server.listen(process.env.PORT || 3000, function() {
  console.log("Server listening on port", process.env.PORT || 3000);
});

