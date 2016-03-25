This module lets you interact with zeroMQ pubsub as if it was an eventEmitter.

[![Build Status](https://travis-ci.org/BrianAdams/zmq-pubsub-emitter.js.svg?branch=master)](https://travis-ci.org/BrianAdams/zmq-pubsub-emitter.js)

To install

`npm install zmq-pubsub-emitter`

Basic Usage:

```
zmqEmitter = require('zmq-pubsub-emitter')();
zmqEmitter.connect(pupSubURI);

zmqEmitter.on('foo',function(data){
  console.log(data.toString()); //You get buffers from zeroMQ.
});

zmqEmitter.emit('bar','message data');

```

Todo:
- [ ]: Add option for msgpack serialization to avoid getting raw buffers
