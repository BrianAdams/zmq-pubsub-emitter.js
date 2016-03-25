var test = require('tape');
var pupSubURI = 'tcp://127.0.0.1:3555';

var pubSocket;
var subSocket;
var zmqEmitter;


test('zmq emitter can connect to a ZeroMQ pup-sub socket.',{timeout:1000},function(t){
    var zmq = require('zmq');
    zmqEmitter = require('../')();

    pubSocket = zmq.socket('pub');
    subSocket = zmq.socket('sub');
    pubSocket.bindSync(pupSubURI);
    subSocket.connect(pupSubURI);

    t.plan(2);

    zmqEmitter.on('zmq-monitor-msg:pub-connect', function(fd, ep) {
      t.pass('zmq pub emitter connected');
    });

    zmqEmitter.on('zmq-monitor-msg:sub-connect', function(fd, ep) {
      t.pass('zmq sub emitter connected');
    });
    zmqEmitter.connect(pupSubURI,{monitorInterval:100});
});
test('cleanup',function(t){
  pubSocket.close();
  subSocket.close();
  zmqEmitter.close();
  pubSocket = null;
  subSocket = null;
  zmqEmitter = null;
  t.end();
});

test('events emitted on eventemitter flow to subscriber process',{timeout:1000},function(t){
    var zmq = require('zmq');
    zmqEmitter = require('../')();

    //Note: If we did not setup the publisher early to establish the socket, we would have to
    //wait up to 500ms for the subscriber to retry connecting to the socket before it would
    //receive messages.
    zmqEmitter.connect(pupSubURI);
    subSocket = zmq.socket('sub');

    subSocket.connect(pupSubURI);
    subSocket.subscribe('');
    t.plan(2);

    subSocket.on('message',function(topic,message){
      t.equal(topic.toString(),'test','topic matches');
      t.equal(message.toString(),'foo bar','message matches');
    })
    setTimeout(function(){
      zmqEmitter.emit('test','foo bar');
    },200); //Give the subscriber time so it does not miss the message.


});
test('cleanup',function(t){
  subSocket.close();
  zmqEmitter.close();
  subSocket = null;
  zmqEmitter = null;
  t.end();
});

test('zmq publishied events are are emitted on the event emitter',{timeout:1000},function(t){
    var zmq = require('zmq');
    zmqEmitter = require('../')();

    //Note: If we did not setup the publisher early to establish the socket, we would have to
    //wait up to 500ms for the subscriber to retry connecting to the socket before it would
    //receive messages.
    pubSocket = zmq.socket('pub');
    pubSocket.bindSync(pupSubURI);
    t.plan(1);

    zmqEmitter.on('fooz',function(data){
      t.equal(data.toString(),'barz','data matches for fooz topic');
    });

    zmqEmitter.connect(pupSubURI);
    setTimeout(function(){
      pubSocket.send(['fooz', 'barz']);
    },200);


});
test('cleanup',function(t){
  pubSocket.close();
  zmqEmitter.close();
  pubSocket = null;
  zmqEmitter = null;
  t.end();
});
