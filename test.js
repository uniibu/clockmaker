var sinon = require('sinon');

var chai = require('chai'),
  expect = chai.expect,
  should = chai.should();

chai.use(require('sinon-chai'));


var clockmaker = require('./clockmaker.min');



var mocker = null;

module.exports = test = {
  beforeEach: function() {
    mocker = sinon.sandbox.create({
      useFakeTimers: true
    });
  },
  afterEach: function() {
    mocker.restore();
  }
};


test['Timer'] = {
  'construct': {
    'function call': function() {
      var t = clockmaker.Timer();

      t.should.be.instanceOf(clockmaker.Timer);
    },
    'new object': function() {
      var t = new clockmaker.Timer();

      t.should.be.instanceOf(clockmaker.Timer);      
    }
  },

  'method chaining': function() {
    var timer = clockmaker.Timer(this.fn, 1000);

    timer.setDelay(0).stop().start().stop();
  },

  'basic timer': {
    beforeEach: function() {
      this.fn = mocker.spy();
      this.timer = clockmaker.Timer(this.fn, 1000);
    },

    'start': function() {
      this.timer.start();
      this.timer.isStopped().should.be.false;

      mocker.clock.tick(10000);

      this.fn.should.have.been.calledOnce;
      this.fn.should.have.been.calledOn(this.fn);
    },

    'multiple start calls ok': function() {
      this.timer.start();
      this.timer.start();

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;
    },

    'multiple stop calls ok': function() {
      this.timer.stop();
      this.timer.stop();
    },

    'cannot be restarted once completed': function() {
      this.timer.stop().start();
      this.timer.isStopped().should.be.false;

      mocker.clock.tick(10000);

      this.fn.should.have.been.calledOnce;

      this.timer.isStopped().should.be.true;

      this.timer.start();

      this.timer.isStopped().should.be.true;
      
      mocker.clock.tick(10000);

      this.fn.should.have.been.calledOnce;
    },

    'change delay before start': function() {
      this.timer.setDelay(5000).start();

      mocker.clock.tick(1000);

      this.fn.should.have.been.notCalled;

      mocker.clock.tick(4001);

      this.fn.should.have.been.calledOnce;
    }
  },


  'handler context': function() {
    var fn = mocker.spy();
    var timer = clockmaker.Timer(fn, 1000, {
      this: test
    });

    timer.start();

    mocker.clock.tick(1001);

    fn.should.have.been.calledOnce;
    fn.should.have.been.calledOn(test);
  },


  'error handling': {
    beforeEach: function() {
      var err = this.err = new Error('blah');

      this.fn = mocker.spy(function() {
        throw err;
      });
    },

    'no error handler set': function() {
      var timer = clockmaker.Timer(this.fn, 1000);      

      timer.start();

      mocker.clock.tick(1001);
    },

    'error handler set': function() {
      var onError = mocker.spy();

      var timer = clockmaker.Timer(this.fn, 1000, {
        onError: onError
      });      

      timer.start();

      mocker.clock.tick(1001);

      onError.should.have.been.calledOnce;
      onError.should.have.been.calledWithExactly(this.err);
    }
  },


  'repeating timer': {
    beforeEach: function() {
      this.fn = mocker.spy();
      this.timer = clockmaker.Timer(this.fn, 1000, {
        repeat: true
      });
    },

    afterEach: function() {
      this.timer.stop();
    },

    'repeats': function() {
      this.timer.start();

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledTwice;
    },

    'can be paused and resumed': function() {
      this.timer.start();

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;

      this.timer.stop();
      this.timer.isStopped().should.be.true;

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;

      this.timer.start();
      this.timer.isStopped().should.be.false;

      mocker.clock.tick(1);

      this.fn.should.have.been.calledOnce;

      mocker.clock.tick(1000);

      this.fn.should.have.been.calledTwice;
    },

    'change delay mid-way': function() {
      this.timer.start();

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;

      this.timer.stop();
      this.timer.setDelay(5000);
      this.timer.start();


      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;

      mocker.clock.tick(4000);

      this.fn.should.have.been.calledTwice;
    }    
  },


  'asynchronous handler': {
    beforeEach: function() {
      var self = this;

      self.handler = function() {};

      self.fn = mocker.spy(function() {
        self.handler.apply(this, arguments);
      });

      self.timer = clockmaker.Timer(self.fn, 1000, {
        repeat: true,
        async: true
      });
    },

    'waits for callback to return': function() {
      this.timer.start();

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;
    },


    're-schedules repeat timer after callback returns': function() {
      this.handler = function(cb) {
        setTimeout(cb, 10000);
      };

      this.timer.start();

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOnce;

      mocker.clock.tick(10001);

      this.fn.should.have.been.calledOnce;

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledTwice;
    },

    'handler context': function() {
      var timer = clockmaker.Timer(this.fn, 1000, {
        this: test,
        async: true
      });

      timer.start();

      mocker.clock.tick(1001);

      this.fn.should.have.been.calledOn(test);
    },

    'error handling': {
      beforeEach: function() {
        this.onError = mocker.spy();

        this.handler = function() {};

        this.fn = mocker.spy(function() {
          this.handler.apply(this, arguments);
        });

        this.timer = clockmaker.Timer(this.fn, 1000, {
          async: true,
          onError: this.onError
        });
      },

      'outside callback': function() {
        var err = new Error('blah');

        this.handler = function(cb) {
          throw err;
        }

        this.timer.start();

        mocker.clock.tick(1001);

        this.onError.should.have.been.calledOnce;
        this.onError.should.have.been.calledWithExactly(err);
      },
      'inside callback': function() {
        var err = new Error('blah');

        this.handler = function(cb) {
          cb(err);
        };

        this.timer.start();

        mocker.clock.tick(1001);

        this.onError.should.have.been.calledOnce;
        this.onError.should.have.been.calledWithExactly(err);
      }
    }

  },

};



test['Timers'] = {
  'construct': {
    'function call': function() {
      var t = clockmaker.Timers();

      t.should.be.instanceOf(clockmaker.Timers);
    },
    'new object': function() {
      var t = new clockmaker.Timers();

      t.should.be.instanceOf(clockmaker.Timers);      
    }
  },

  'create new timer': function() {
    var timers = clockmaker.Timers();

    var timer = timers.new(null, 123, {});

    timer.should.be.instanceOf(clockmaker.Timer);
  },

  'start all timers': function() {
    var timers = clockmaker.Timers();

    timers.new(null, 123, {});
    timers.new(null, 123, {});

    var startSpy = mocker.spy();

    timers._timers.forEach(function(t) {
      t.start = startSpy;
    });

    timers.start();

    startSpy.should.have.been.calledTwice;
  },

  'stop all timers': function() {
    var timers = clockmaker.Timers();

    timers.new(null, 123, {});
    timers.new(null, 123, {});

    var stopSpy = mocker.spy();

    timers._timers.forEach(function(t) {
      t.stop = stopSpy;
    });

    timers.stop();

    stopSpy.should.have.been.calledTwice;
  }

};

