var zmq = require('zmq');
var util = require('util');
var EventEmitter2 = require('eventemitter2');
//http://byronsalau.com/blog/how-to-create-a-guid-uuid-in-javascript/
function createGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : r & 3 | 8;
    return v.toString(16);
  });
}
var ZMQEmitter = function () {
  this.pub = zmq.socket('pub');
  this.pub.desc = 'pub';
  this.sub = zmq.socket('sub');
  this.sub.desc = 'sub';
  this.sub.subscribe('');
  this.id = createGuid();
  var self = this;
  this.onAny(function (event, value) {
    var args = Array.prototype.slice.call(arguments);
    args.push(self.id);
    self.pub.send(args);
  });
  this.sub.on('message', function (topic, message) {
    var args = Array.prototype.slice.call(arguments);
    if (args[args.length - 1].toString() == self.id) {
      return;
    }
    args.shift();
    self.emit(topic.toString(), args);
  });
};
util.inherits(ZMQEmitter, EventEmitter2);
ZMQEmitter.prototype.MonitorListen = function MonitorListen(socket, interval) {
  var self = this;
  // Register to monitoring events
  [
    'connect',
    'connect_delay',
    'connect_retry',
    'listen',
    'bind_error',
    'accept',
    'accept_error',
    'close',
    'close_error',
    'disconnect'
  ].forEach(function (event) {
    socket.on(event, function (fd, ep) {
      self.emit('zmq-monitor-msg:' + socket.desc + '-' + event, fd, ep, this);
    });
  });
  // Handle monitor error
  socket.on('monitor_error', function (err) {
    console.log('Error in monitoring: %s, will restart monitoring in 5 seconds', err);
    setTimeout(function () {
      socket.monitor(500, 0);
    }, 5000);
  });
  socket.monitor(interval, 0);
};
ZMQEmitter.prototype.connect = function connect(URI, options) {
  var self = this;
  if (options == undefined) {
    options = {};
  }
  if (options.monitorInterval !== undefined) {
    this.MonitorListen(this.pub, options.monitorInterval);
    this.MonitorListen(this.sub, options.monitorInterval);
  }
  this.pub.bind(URI, function (err) {
    if (err) {
      self.pub.connect(URI);
    }
  });
  this.sub.connect(URI);
};
ZMQEmitter.prototype.close = function close(URI, options) {
  this.pub.close();
  this.pub.unmonitor();
  this.sub.close();
  this.sub.unmonitor();
};
module.exports = function () {
  return new ZMQEmitter();
};