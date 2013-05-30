var drone = require('ar-drone');
var createNavigator = require('./navigator').createNavigator;

var client = drone.createClient();
client.config('video:video_channel', 3);

var landed = true;
function takeoff() {
    if (landed) {
        landed = false;
        client.takeoff();
        console.log('taking off');
    }
}
function land() {
    if (!landed) {
        landed = true;
        client.land();
        console.log('landing');
    }
}


var nav = createNavigator(client.getPngStream());

takeoff();

nav.on('rotate', function(a) {
    takeoff();
    
    console.log('rotating', a);
    if (a < 0) {
        client.counterClockwise(-a);
    } else {
        client.clockwise(a);
    }
});

nav.on('forward', function(speed) {
    takeoff();

    console.log('moving', speed);
    client.front(speed);
});

nav.on('land', land);

process.stdin.on('data', function(s) {
    if (/l/.test(s)) {
        land();
    }
});
process.stdin.resume();
