var sinon = require('sinon'),
  should = require('should'),
  _ = require('lodash'),
  tools = require('../src/tools.js');

describe('Tools', function () {

  describe('nowMs', function() {
    it('returns a string of format \'YYYY-MM-DD hh:mm:ss:mmm\'',function() {
      tools.nowMs().should.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3}$/).and.be.a.String;
    });
    
    it('returns the correct timestamp',function() {
      var clock = sinon.useFakeTimers();
      tools.nowMs().should.be.exactly('1970-01-01 00:00:00:000');
      clock.tick(1100);
      tools.nowMs().should.be.exactly('1970-01-01 00:00:01:100');
      clock.restore();
    });
  });
  
  describe('empty', function() {
    it('is a function that returns undefined',function() {
      tools.empty.should.be.a.Function;
      (tools.empty() === undefined ).should.equal(true,'empty should return undefined');
    });
  });
  
  describe('fileExtension', function() {
    it('returns an empty extension for empty file names',function() {
      tools.fileExtension('').should.equal('');
    });
    
    it('returns an empty extension for file names with no periods',function() {
      tools.fileExtension('test').should.equal('');
    });
    
    it('returns an empty extension for file named `.`',function() {
      tools.fileExtension('.').should.equal('');
    });
    
    it('returns an empty extension for files that start with a period and have no subsequent periods',function() {
      tools.fileExtension('.ignore').should.equal('');
    });
    
    it('returns an empty extension for files that end with one or more contiguous periods',function() {
      tools.fileExtension('test.').should.equal('');
      tools.fileExtension('test..').should.equal('');
      tools.fileExtension('test...').should.equal('');
    });
    
    it('returns an extension for a file named with an extension',function() {
      tools.fileExtension('test.txt').should.equal('txt');
      tools.fileExtension('.ignore.igntxt').should.equal('igntxt');
    });
  });
  
  describe('fileType', function() {
    it('returns null for a file with no extension',function() {
      (tools.fileType('test')  === null).should.equal(true,'file with no extension doesn\'t return null');
    });

    it('returns `img` for image type',function() {
      tools.fileType('test.png').should.be.exactly('img');
    });
    
    it('returns `audio` for audio type',function() {
      tools.fileType('test.mp3').should.be.exactly('audio');
    });
    
    it('returns `video` for video type',function() {
      tools.fileType('test.avi').should.be.exactly('video');
    });
  });

  describe('humanSize',function() {
    it('returns a human-readable filesize for a variety of file sizes',function() {
      tools.humanSize(1).should.be.exactly('0.1 kB');
      tools.humanSize(2).should.be.exactly('0.1 kB');
      tools.humanSize(200).should.be.exactly('0.2 kB');
      tools.humanSize(1000).should.be.exactly('1.0 kB');
      tools.humanSize(1024*1024).should.be.exactly('1024.0 kB');
      tools.humanSize(1024*1024 + 1).should.be.exactly('1.0 MB');
    });
  });

  describe('randomInt',function() {
    it('returns singular value consistently for a singular range (e.g [1,1[ )',function() {
      tools.randomInt(1,1).should.be.exactly(1);
      tools.randomInt(1,1).should.be.exactly(1);
      tools.randomInt(1,1).should.be.exactly(1);
      tools.randomInt(1,1).should.be.exactly(1);
      tools.randomInt(1,1).should.be.exactly(1);
      //probability is a bitch
    });
    
    it('rough distribution check for 10k random numbers between 0 and 9 with a 20% tolerance',function() {
      var i = 0,
        num = 10;
        results = _.range(0,num,0);
        trials = 10000,
        tolerance = 0.2;
      for(i = 0; i < trials; ++i) {
        results[tools.randomInt(0,num)] += 1;
      }

      minThreshold = trials/results.length * (1-tolerance);
      maxThreshold = trials/results.length * (1+tolerance);
      results.forEach(function(val){
        val.should.be.within(minThreshold,maxThreshold);
      });
    });
  });
  
  describe('randomFloat',function() {
    it('returns singular value consistently for a singular range (e.g [1,1[ )',function() {
      tools.randomFloat(1,1).should.be.exactly(1);
      tools.randomFloat(1,1).should.be.exactly(1);
      tools.randomFloat(1,1).should.be.exactly(1);
      tools.randomFloat(1,1).should.be.exactly(1);
      tools.randomFloat(1,1).should.be.exactly(1);
      //probability is a bitch
    });
    
    it('rough distribution check for 10k random numbers between 0 and 9 with a 20% tolerance',function() {
      var i = 0,
        num = 10;
        results = _.range(0,num,0);
        trials = 10000,
        tolerance = 0.2;
      for(i = 0; i < trials; ++i) {
        results[Math.floor(tools.randomFloat(0,num))] += 1;
      }

      minThreshold = trials/results.length * (1-tolerance/2);
      maxThreshold = trials/results.length * (1+tolerance/2);
      results.forEach(function(val){
        val.should.be.within(minThreshold,maxThreshold);
      });
    });
  });
  
  describe('varianceCoefficient',function() {
    it('rough distribution check for 10k random coefficients fall within range',function() {
      var i = 0,
        trials = 10000,
        variance = 0.2;
      for(i = 0; i < trials; ++i) {
        tools.varianceCoefficient(variance).should.be.within(1-variance/2,1+variance/2);
      }
    });
    
    it('rough check that 10k 0% variance always yields 1',function() {
      var i = 0,
        trials = 10000,
        variance = 0.0;
      for(i = 0; i < trials; ++i) {
        tools.varianceCoefficient(variance).should.be.within(1-variance/2,1+variance/2);
      }
    });
  });
  
  describe('ExponentialBackoff',function() {
    it('backoff not hitting threshold',function() {
      var backoff = tools.ExponentialBackoff(2,1024);
      backoff().should.be.exactly(1);
      backoff().should.be.exactly(2);
      backoff().should.be.exactly(0);
      backoff().should.be.exactly(4);
      for(i = 0; i < 3; ++i) {
        backoff().should.be.exactly(0);
      }
      backoff().should.be.exactly(8);
      for(i = 0; i < 7; ++i) {
        backoff().should.be.exactly(0);
      }
      backoff().should.be.exactly(16);
    });
    
    it('backoff hitting threshold',function() {
      var backoff = tools.ExponentialBackoff(2,10);
      backoff().should.be.exactly(1);
      backoff().should.be.exactly(2);
      backoff().should.be.exactly(0);
      backoff().should.be.exactly(4);
      for(i = 0; i < 3; ++i) {
        backoff().should.be.exactly(0);
      }
      backoff().should.be.exactly(8);
      for(i = 0; i < 7; ++i) {
        backoff().should.be.exactly(0);
      }
      backoff().should.be.exactly(10);

      for(i = 0; i < 9; ++i) {
        backoff().should.be.exactly(0);
      }
      backoff().should.be.exactly(10);
      
      for(i = 0; i < 9; ++i) {
        backoff().should.be.exactly(0);
      }
      backoff().should.be.exactly(10);
    });
    
    it('backoff and reset',function() {
      var backoff = tools.ExponentialBackoff(2,1024);
      backoff().should.be.exactly(1);
      backoff().should.be.exactly(2);
      backoff().should.be.exactly(0);
      backoff().should.be.exactly(4);
      backoff().should.be.exactly(0);
      backoff().should.be.exactly(0);
      backoff('reset').should.be.exactly(0);
      backoff().should.be.exactly(1);
      backoff().should.be.exactly(2);
      backoff().should.be.exactly(0);
      backoff().should.be.exactly(4);
    });
  });
  
  describe('makeSetter',function() {
    it('makes a setter',function() { 
      var obj = {'key':'val'},
        func = tools.makeSetter(obj,'key');
      obj.key.should.be.exactly('val');
      func('new val');
      obj.key.should.be.exactly('new val');
    });
  });

});