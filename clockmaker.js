(function (root, factory) {
  "use strict";

  // AMD
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  }
  // CommonJS
  else if (typeof exports === 'object') {
    module.exports = factory();
  }
  // Browser
  else {
    var clockmaker = factory();

    Object.keys(clockmaker).forEach(function(key) {
      var exported = clockmaker[key];

      var previous = root[key];

      // every export gets a .noConflict() method to allow clients to restore
      // the previous values for the overridden global scope keys
      exported.noConflict = function() {
        root[key] = previous;
        return exported;
      };

      root[key] = exported;
    });
  }
}(this, function () {
  "use strict";

  /** Function binder */
  var __bind = function(fn, fnThis) {
    return function() {
      fn.apply(fnThis, arguments);
    };
  };


  var Clockmaker = {};


  /** 
   * Construct a new timer
   *
   * @param {Function} fn The handler function to invoke on each tick.
   * @param {Number} delayMs The timer delay in milliseconds.
   * @param {Object} [options] Additional options.
   * @param {Object} [options.this] The `this` object to invoke `fn` with. If ommitted then `fn` is used as `this`.
   * @param {Boolean} [options.repeat] Whether the timer should keep repeating until we stop it.
   * @param {Boolean} [options.async] Whether `fn` is asynchronous (i.e. accepts a callback).
   * @param {Function} [options.onError] Function to call if `fn` throws an error.
   *
   * @return {Timer} A `Timer`.
   */
  var Timer = Clockmaker.Timer = function(fn, delayMs, options) {
    if (!(this instanceof Timer)) {
      return new Timer(fn, delayMs, options);
    }

    this._fn = fn;
    this._delayMs = delayMs;

    options = options || {};
    this._fnThis = options.this || this._fn;
    this._repeat = !!options.repeat;
    this._onError = options.onError;
    this._async = !!options.async;

    this._state = 'stopped';
    this._timerHandle = null;
    this._runCount = 0;

    this._doTick = __bind(this._doTick, this);
    this._doAfterTick = __bind(this._doAfterTick, this);
  };



  /**
   * Schedule next timer tick.
   */
  Timer.prototype._scheduleNextTick = function() {
    // currently stopped?
    if ('stopped' === this._state) {
      return;
    }

    // only do once?
    if (0 < this._runCount && !this._repeat) {
      this._state = 'stopped';
      return;
    }

    this._runCount++;

    this._timerHandle = setTimeout(this._doTick, this._delayMs);
  };




  /**
   * Execute a timer tick, i.e. execute the callbak function.
   */
  Timer.prototype._doTick = function() {
    try {
      if (this._async) {
        this._fn.call(this._fnThis, this._doAfterTick);
      } else {
        this._fn.call(this._fnThis);
        this._doAfterTick();
      }
    } catch (err) {
      this._doAfterTick(err);
    }
  };



  /**
   * Timer tick execution completed, now handle any errors.
   */
  Timer.prototype._doAfterTick = function(err) {
    if (this._onError) {
      this._onError(err);
    }

    this._scheduleNextTick();
  };



  /**
   * Start the timer.
   */
  Timer.prototype.start = function() {
    if ('started' === this._state) {
      return;
    }

    this._state = 'started';
    this._scheduleNextTick();

    return this;
  };



  /**
   * Stop the timer.
   */
  Timer.prototype.stop = function() {
    if (this._timerHandle) {
      clearTimeout(this._timerHandle);
      this._timerHandle = null;
    }

    this._state = 'stopped';

    return this;
  };



  /**
   * Set the timer delay.
   */
  Timer.prototype.setDelay = function(delayMs) {
    this._delayMs = delayMs;

    return this;
  };



  /**
   * Get whether this timer has stopped.
   */
  Timer.prototype.isStopped = function() {
    return 'stopped' === this._state;
  };




  /**
   * Manage a collection of `Timer` objects.
   *
   * @constructor
   */
  var Timers = Clockmaker.Timers = function() {
    if (!(this instanceof Timers)) {
      return new Timers();
    }

    this._timers = [];
  };



  /**
   * Create a new timer and add it to this collection.
   *
   * @see Timer()

   * @return {Timer} The new `Timer`, not yet started.
   */
  Timers.prototype.new = function(fn, delayMs, options) {
    var t = new Timer(fn, delayMs, options);

    this._timers.push(t);

    return t;
  };




  /**
   * Start all the timers.
   */
  Timers.prototype.start = function() {
    this._timers.forEach(function(t) {
      t.start();
    });
  };


  /**
   * Stop all the timers.
   */
  Timers.prototype.stop = function() {
    this._timers.forEach(function(t) {
      t.stop();
    });
  };



  return Clockmaker;

}));



