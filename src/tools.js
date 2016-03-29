'use strict';

var _ = require('lodash');

/**
 * @module libs/tools
 */

/**
 * empty function
 */
function empty() {}
exports.empty = empty;

/**
 * UTC date in 'YYYY-MM-DD hh:mm:ss:mmm' format
 * @param {Date} date - a date
 * @returns {string} - UTC date in 'YYYY-MM-DD hh:mm:ss:mmm' format
 */
function datetimeMs(date) {
  return [date.getUTCFullYear(), '-',
    _.padStart(date.getUTCMonth() + 1, 2, '0'), '-',
    _.padStart(date.getUTCDate(), 2, '0'), ' ',
    _.padStart(date.getUTCHours(), 2, '0'), ':',
    _.padStart(date.getUTCMinutes(), 2, '0'), ':',
    _.padStart(date.getUTCSeconds(), 2, '0'), ':',
    _.padStart(date.getUTCMilliseconds(), 3, '0')].join('');
}
exports.datetimeMs = datetimeMs;

/**
 * UTC current datetime in 'YYYY-MM-DD hh:mm:ss:mmm' format
 * @returns {string} - UTC date in 'YYYY-MM-DD hh:mm:ss:mmm' format
 */
function nowMs() {
  return datetimeMs(new Date());
}
exports.nowMs = nowMs;

/**
 * Get the file extension of a file
 * @param filename
 * @returns {string} - the extension
 * @example
 * fileExtension('test.txt'); // returns 'txt'
 * fileExtention('test.'); // returns ''
 * fileExtention('test..'); // returns ''
 * fileExtention('test'); // returns ''
 * fileExtention('.ignore'); // returns ''
 * fileExtention('.ignore.txt'); // returns 'txt'
 *
 */
function fileExtension(filename) {
  var a = filename.split('.');
  if (a.length === 1 || (a[0] === '' && a.length === 2)) { return ''; }
  return a.pop().toLowerCase();
}
exports.fileExtension = fileExtension;

/**
 * Get the media filetype
 * @param filename - media filename
 * @returns {?string} - media type or null if media isn't known
 * @exmaple
 * fileType('hi.bmp') //returns 'img'
 * fileType('hi.txt') // returns null
 */
function fileType(filename) {
  var extension = fileExtension(filename);
  if (['png', 'bmp', 'jpeg', 'jpg', 'gif', 'png', 'svg', 'xbm', 'webp'].indexOf(extension) !== -1) { return 'img'; }
  if (['wav', 'mp3'].indexOf(extension) !== -1) { return 'audio'; }
  if (['3gp', '3gpp', 'avi', 'flv', 'mov', 'mpeg', 'mpeg4', 'mp4', 'ogg', 'webm', 'wmv'].indexOf(extension) !== -1) {
    return 'video';
  }
  return null;
}
exports.fileType = fileType;

/**
 * Converts bytes into a human readable size with units and magnitudes
 * @param sizeInBytes
 * @returns {string} - human readable size
 * @example
 * humanSize(1); //returns '0.1 kB'
 * humanSize(2) //returns '0.1 kB'
 * humanSize(200) //returns '0.2 kB'
 * humanSize(1000) //returns '1.0 kB'
 * humanSize(1024*1024) //returns '1024.0 kB'
 * humanSize(1024*1024 + 1) //returns '1.0 MB'
 */
function humanSize(sizeInBytes) {
  var i = 0,
    byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
  sizeInBytes /= 1024;
  while (sizeInBytes > 1024 && i < byteUnits.length) {
    sizeInBytes /= 1024;
    i += 1;
  }
  return Math.max(sizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}
exports.humanSize = humanSize;

/**
 * Random int between [min,max].
 * @param {number} min - min inclusive
 * @param {number} max - max inclusive
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
exports.randomInt = randomInt;

/**
 * Random float between [min,max].
 * @param {number} min - min inclusive
 * @param {number} max - max inclusive
 * @returns {number}
 */
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

exports.randomFloat = randomFloat;


/**
 * return a random coefficient within a variance
 * @param {number} variance - desired max variance
 * @returns {number}
 * @example
 * varianceCoefficient(0.2) //20% variance, returns a number between 0.9 and 1.1
 */
function varianceCoefficient(variance) {
  return randomFloat(1 - variance / 2, 1 + variance / 2);
}
exports.varianceCoefficient = varianceCoefficient;


/**
 * Higher order function returns a function that exponentially backs off
 * @param {number} multiplier - exponential multiplier
 * @param {number} max - if max is reached in the exponential backoff, make the backoff linear that triggers every 'max' calls
 * @param {?number} [variance=0] - variance in the output of the next exponential backoff
 * @returns {Function} - the function will return 0 if the exponential backoff hasn't reached it's next threshold, and a number N if the backoff reaches it's threshold. N represents the next threshold for which this function will return true.
 * @exmaple
 * backoff(); // returns 1
 * backoff(); // returns 0
 * backoff(); // returns 2
 * backoff(); // returns 0
 * backoff(); // returns 0
 * backoff(); // returns 4
 * backoff(); // returns 0 ...
 * //you can reset all the counters to 0 by passing a truthy value to backoff. i.e:
 * backoff('reset')  //  resets the backoff to it's initial state
 */
function ExponentialBackoff(multiplier,max,variance) {
  variance = variance || 0;
  var counter = 0, next = 0;
  return function(reset) {
    if (reset) {
      counter = 0;
      next = 0;
      return 0;
    }
    counter++;
    if (counter >= next || counter >= max) {
      if (next < max) {
        //calculate the next largest threshold
        next = Math.ceil(Math.max(next * multiplier, 1) * varianceCoefficient(variance));
        //round down to the max value if the next threshold is larger than max
        next = Math.min(next,max);
      }
      counter = 0;
      return next;
    } else {
      return 0;
    }
  };
}
exports.ExponentialBackoff = ExponentialBackoff;

/**
 * makes a member setter for an object
 * @param {object} object - object to create setter on
 * @param {string} setting - setting name
 * @returns {Function}
 * @example
 * var setter = makeSetter(myObject,'member');
 * myObject.member //returns 5;
 * setter(4);
 * myObject.membber //returns 4;
 */
function makeSetter(object,setting) {
  return function(newVal){
    object[setting] = newVal;
  };
}

exports.makeSetter = makeSetter;

/**
 * check if all the keys in the array are keys in the object
 * @param {object} object
 * @param {array} keys
 * @returns {boolean}
 */
function hasKeys(object,keys) {
   return (keys.length === _.intersection(_.keys(object),keys).length);
}

exports.hasKeys = hasKeys;

function isEmailBasicallyValid(email) {
   return /^..+@.+\...+$/.test(email);
}

exports.isEmailBasicallyValid = isEmailBasicallyValid;

class ClientError {
  constructor(status,errorCode) {
    this.status = status;
    this.errorCode = errorCode;
  }
}

exports.ClientError = ClientError;

class InputError {
  constructor(details) {
    this.status = 422;
    this.errorCode = 'invalidInput';
    this.details = details;
  }
}
exports.InputError = InputError;

function sessionExists(redis,sessionString,callback) {
  if(!_.isString(sessionString)) { return process.nextTick(function(){callback(new ClientError(400,'invalidSessionString'));}); }
  redis.hgetall('session:'+sessionString,function getSessionFromCache(err,data){
    if(err) { return callback(err);}
    if(data === null) { return callback(new ClientError(401,'invalidSession'));}
    data.session = sessionString;
    data.userId = Number(data.userId);
    callback(null, data);
  });
}
exports.sessionExists = sessionExists;

/**
 *
 * Takes a set of keys in an object, and nests them one level deeper
 * @param {object} object the object we are operating on
 * @param {string} parentName the name of the key we will stuff the children in
 * @param {array} children array of keynames to stuff in the parent and delete from the root object
 * @example
 *   nest({'name': 'george', 'height':180, 'weight': 75}, 'stats',['height','weight']);
 *   //returns {'name': 'george', 'stats': {'height':180, 'weight': 75}}
 */
function nest(object,parentName,children) {
  object[parentName] = object[parentName] || {};
  children.forEach(function (child) {
    object[parentName][child] = object[child];
    delete object[child];
  });
}
exports.nest = nest;

function getStack(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}
exports.getStack = getStack;
