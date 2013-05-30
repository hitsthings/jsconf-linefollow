var drone = require('ar-drone');
var createNavigator = require('./navigator').createNavigator;

var client = drone.createClient();

var landed = true;
function takeoff() {
    if (landed) {
        landed = false;
        client.takeoff();
    }
}
function land() {
    if (!landed) {
        landed = true;
        client.land();
    }
}


var nav = createNavigator(client.getPngStream());

nav.on('rotate', function(a) {
    takeoff();
    if (a < 0) {
        client.counterClockwise(-a);
    } else {
        client.clockwise(a);
    }
});

nav.on('forward', function(speed) {
    takeoff();
    client.forward(speed);
});

nav.on('land', land);
