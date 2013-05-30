var getLinePose = require('./getLinePose');
var getRedEdges = getLinePose._getRedEdges;
var findLine = getLinePose._findLine;
var getNeighbors = getLinePose._getNeighbors;
var followLine = getLinePose._followLine;
var infoByDir = getLinePose._infoByDir;

function assert(b, msg) {
    if (!b) throw new Error(msg);
}

function assertDeepEqual(a, e, msg) {
    if (typeof a !== typeof e) assert(false, "Wrong type: " + msg);
    if (a === e) return;
    if (!{object:1,function:1}[typeof a]) assert(false, "Primitives unequal: (a: " + a + ", e: " + e + ")" + msg); 

    assertArraysEqual(Object.keys(a).sort(), Object.keys(e).sort(), "Keys unequal: " + msg);

    for(var k in a) {
        assertDeepEqual(a[k], e[k], k + " is unequal: (a: " + a[k] + ", e: " + e[k] + ")" + msg);
    }
}

function assertArraysEqual(a, e, msg) {
    if (a ^ e) assert(false, "One array was falsy: " + msg);
    if (!a) return;

    if (a.length !== e.length) assert(false, "Lengths didn't match ( " + a.length + ", " + e.length + " ): " + msg);

    var i = a.length;
    while(i--) {
        assertDeepEqual(a[i], e[i], "Index didn't match (" + i + "): " + msg);
    }
}

var img = [
    0, 10, 20, 30,    255, 100, 100, 100,    0, 0, 0, 0,    0, 255, 255, 255,
    0, 10, 20, 30,    255, 100, 100, 100,    0, 0, 0, 0,    0, 255, 255, 255,
    0, 10, 20, 30,    255, 100, 100, 100,    0, 0, 0, 0,    0, 255, 255, 255,
    0, 10, 20, 30,    255, 100, 100, 100,    0, 0, 0, 0,    0, 255, 255, 255,
    0, 10, 20, 30,    255, 100, 100, 100,    0, 0, 0, 0,    0, 255, 255, 255
], w = 4, h = 5, opts = {
    blur_radius : 2,
    low_threshold : 20,
    high_threshold : 50
};

var ex_red_edges = [
    255, 0, 0, 0,
    255, 0, 0, 0,
    255, 0, 0, 0,
    255, 0, 0, 0,
    0,   0, 0, 0
];

var redEdges = getRedEdges(img, w, h, opts);
assertArraysEqual(redEdges.data.slice(0, redEdges.cols * redEdges.rows), ex_red_edges, 'Edges not equal');

assertDeepEqual(getNeighbors(redEdges, 0, 0), {
    me : 255,
    ne : undefined,
    e : 0,
    se : 0,
    s : 255,
    nw : undefined,
    w : undefined,
    sw : undefined,
    n : undefined,
}, "Neighbors incorrect 0,0.");

assertDeepEqual(getNeighbors(redEdges, 1, 0), {
    me : 0,
    ne : undefined,
    e : 0,
    se : 0,
    s : 0,
    nw : undefined,
    w : 255,
    sw : 255,
    n : undefined,
}, "Neighbors incorrect 1,0.");

assertDeepEqual(getNeighbors(redEdges, 0, 1), {
    me : 255,
    ne : 0,
    e : 0,
    se : 0,
    s : 255,
    nw : undefined,
    w : undefined,
    sw : undefined,
    n : 255,
}, "Neighbors incorrect 0,1.");

assertDeepEqual(getNeighbors(redEdges, 1, 1), {
    me : 0,
    ne : 0,
    e : 0,
    se : 0,
    s : 0,
    nw : 255,
    w : 255,
    sw : 255,
    n : 0,
}, "Neighbors incorrect 1,1.");

assertDeepEqual(followLine(redEdges, 0, 1, 0, 1, infoByDir['s']), {sx: 0, sy: 1, ex: 0, ey: 3});

assertDeepEqual(findLine(redEdges), {sx: 0, sy: 0, ex: 0, ey: 3});

