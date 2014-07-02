# Clockmaker

[![Build Status](https://secure.travis-ci.org/hiddentao/clockmaker.png)](http://travis-ci.org/hiddentao/clockmaker)

A flexible timer management system for Javascript.

Clockmaker is inspired by [Mozilla's MiniDaemon](https://developer.mozilla.org/en-US/docs/Web/API/window.setInterval#A_little_framework) and provides an alternative to the built-in `setTimeout` and `setInterval` functions. It is 
especially useful when you are running multiple timers and wish to exercise 
better control over them.

Features:

* Stop and restart timers.
* Change the timer delay in real-time.
* Start and stop multiple timers in one go.
* Robust error handling.
* Uses method chaining for ease of use.
* Works in node.js and in the browser.
* Has no other dependencies.
* Small: <1 KB minified and gzipped.

## Installation

### node.js

Install using [npm](http://npmjs.org/):

    $ npm install clockmaker

### Browser

Use [bower](https://github.com/bower/bower):

    $ bower install clockmaker

Or add the following inside your HTML:

```html
<script type="text/javascript" src="https://rawgithub.com/hiddentao/clockmaker/master/clockmaker.min.js"></script>
```

## How to use

These examples are all running in node.js. At the top of each example assume 
we have the following:

```javascript
var Timer = require('clockmaker').Timer,
    Timers = require('clockmaker').Timers;
```



### setTimeout

The basic `Timer` works in the same way as `setTimeout`:

```javascript
Timer(function() {
  console.log('2 seconds done');
}, 2000).start();
```

Notice how `start()` needs to be called to kick-off the timer. You can also 
explicitly construct the `Timer` object:

```javascript
var timer = new Timer(function() {
  console.log('2 seconds done');
}, 2000);

timer.start();
```

Once a basic timer has ticked and invoked its handler it cannot be started again:

```javascript
var timer = new Timer(function() {
  console.log('2 seconds done');
}, 2000);

timer.start();
timer.isStopped();  // false

// ... some time later

timer.start();  
timer.isStopped();  // true
```

### setInterval

We simulate `setInterval` behaviour by setting `repeat: true` in the options.

```javascript
var timer = new Timer(function() {
  console.log('Another 2 seconds done');
}, 2000, {
  repeat: true
});

timer.start();
```

Let's stop the timer after 10 ticks:

```javascript
var count = 0;

var timer = new Timer(function() {
  console.log('Another 2 seconds done');

  count++;
  if (10 === count) {
    timer.stop();
  }
}, 2000, {
  repeat: true
});

timer.start();
```

We can change the delay interval in real-time:

```javascript
var delayMs = 1000;

var timer = new Timer(function() {
  console.log('Next tick will take 1 second longer');

  delayMs += 1000;
  timer.setDelay(delayMs);
}, delayMs, {
  repeat: true
});

timer.start();
```

Let's stop and restart the timer using a second timer:

```javascript
var timer = new Timer(function() {
  console.log('Another 2 seconds done');
}, 2000, {
  repeat: true
});

timer.start();


// This second timer which will stop/start the first timer every 5 seconds
Timer(function() {
  if (timer.isStopped()) {
    timer.start();
  } else {
    timer.stop();
  }
}, 5000, {
  repeat: true
}).start();
```

A timer does not keep track of how much time has elapsed when it gets stopped. 
So when it gets started again it resumes with the full time delay.


### Asynchronous handlers

The timer waits for the handler to finish executing before scheduling the next 
tick. But what if our handler is asynchronous? we have to inform the timer of 
this:

```javascript
var timer = new Timer(function(cb) {
  // ... do some stuff
  cb();
}, 2000, {
  repeat: true,
  async: true
});

timer.start();
```

Until our handler invokes the `cb()` callback (see above) the timer will not 
schedule the next tick. This allows us to decide whether we want to schedule 
the next tick straight away or once we've done all our necessary work inside 
our handler.


### This context

The `this` context for the handler function can be set:

```javascript
var ctx = {
  dummy: true
};

new Timer(function() {
  console.log(this.dummy);  // true
}, 2000, {
  this: ctx
}).start();
```


### Synchronize to now

Sometimes we may want to reset a timer that's already running, i.e. stop and 
then restart it without actually having to do so:

```javascript
/*
In this example the second timer keeps 'resetting' the first one every 100ms. 
The net effect is that the first timer never actually completes a tick.
 */
var timer = new Timer(function() {
  console.log('hell world');  // this never gets executed
}, 2000);

timer.start();

Timer(function() {
  timer.synchronize();
}, 100).start();
```

### Handling errors

We can pass in an `onError` handler to be informed of errors:

```javascript
new Timer(function() {
  throw new Error('A dummy error');
}, 2000, {
  onError: function(err) {
    console.error(err);  // A dummy error
  }
}).start();
```

Error handling works for asynchronous handlers too:

```javascript
new Timer(function(cb) {
  cb(new Error('A dummy error'));
}, 2000, {
  async: true,
  onError: function(err) {
    console.error(err);  // A dummy error
  }
}).start();
```

### Multiple timers

We can control multiple timers at a time by using the `Timers` interface.

```javascript
var timers = new Timers();

var timer1 = timers.new(handlerFn, 2000, { repeat: true });
var timer2 = timers.new(aletFn, 1000);
var timer3 = ...

timer1.start(); // we can start them one a a time, or...

timers.start(); // ...start them all at once

... // some time later

timers.stop();  // stop all timers
```

## noConflict

If you're using Clockmaker in a browser app and are not using an AMD or 
CommonJS module system then it will add two new items into the global scope:

* `Timer`
* `Timers`

If these clash with existing values in your global scope then you can use the 
`.noConflict()` method calls to restore your existing values:

```javascript
// assume we're running in browser global scope, i.e. window

var Timer = 'my timer class';
var Timers = 'my timers class';

// ... load clockmaker ...

console.log(Timer); // Function
console.log(Timers); // Function

// restore my definitions

var ClockmakerTimer = Timer.noConflict();
var ClockmakerTimers = Timers.noConflict();

console.log(Timer); // 'my timer class'
console.log(Timers); // 'my timers class'
```


## Building

To build the code:

    $ npm install -g gulp
    $ npm install
    $ gulp build <-- this will build the code and run the tests


## Contributing

Contributions are welcome! Please see CONTRIBUTING.md.


## License

MIT - see LICENSE.md