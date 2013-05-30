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
    getLinePose(data, function(linePose) {
        if (!linePose) {
            this.trigger('rotate', 0.5);
        }

        var normalizedAngle = linePose.angle > 180 ?
            linePose.angle - 180 :
            linePose.angle;
        normalizedAngle /= 90;
        normalizedAngle -= 1;

        if (normalizedAngle !== 0) {
            this.trigger('rotate',  normalizedAngle);
        }

        if (Math.abs(normalizedAngle) < 0.1) {
            this.trigger('forward', 1);
        } else {
            this.trigger('forward', 0);
            this.trigger('land');
        }
    });
};

module.exports = Navigator;
