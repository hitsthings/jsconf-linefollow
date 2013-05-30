var EventEmitter = require('events').EventEmitter;
var util = require('util');
var getLinePose = require('./getLinePose');

function Navigator(videoStream) {
    this._stream = videoStream;

    videoStream.on('data', this._onData.bind(this));
}
util.inherits(Navigator, EventEmitter);

Navigator.createNavigator = function createNavigator(videoStream) {
    return new Navigator(videoStream);
};

Navigator.prototype._onData = function(data) {
    console.log('got data');
    getLinePose(data, function(linePose) {
        console.log('line pose: ', linePose);

        if (!linePose) {
            this.emit('rotate', 0.5);
        }

        var normalizedAngle = linePose.angle > 180 ?
            linePose.angle - 180 :
            linePose.angle;
        normalizedAngle /= 90;
        normalizedAngle -= 1;

        if (normalizedAngle !== 0) {
            this.emit('rotate',  normalizedAngle);
        }

        if (Math.abs(normalizedAngle) < 0.1) {
            this.emit('forward', 1);
        } else {
            this.emit('forward', 0);
            this.emit('land');
        }
    }.bind(this));
};

module.exports = Navigator;
