var PNG = require('png-js');
var jsfeat = require('jsfeat');


function getLinePose(pngData, options, next) {
    if (typeof options === 'function') {
        next = options;
        options = null;
    }

    options = options || {};

    var png = new PNG(pngData);
    png.decode(function(data) {

        var edges = getRedEdges(data, png.width, png.height, options);
        var longestLine = findLine(edges);

        var lineCenter = [
            (longestLine.ex - longestLine.sx) / 2 + longestLine.sx,
            (Math.max(longestLine.ey, longestLine.sy) - Math.min(longestLine.ey, longestLine.sy)) / 2 +
             Math.max(longestLine.ey, longestLine.sy)
        ];

        next({
            angle : getAngle(longestLine),
            xOffset : lineCenter[0] - edges.cols/2,
            yOffset : lineCenter[1] - edges.rows/2
        });
    });
}

function getRedEdges(image, width, height, options) {
    var r = options.blur_radius|2;
    var kernel_size = (r+1) << 1;
    var img_u8 = getReds(image, width, height);

    jsfeat.imgproc.gaussian_blur(img_u8, img_u8, kernel_size, 0);
    jsfeat.imgproc.canny(img_u8, img_u8, options.low_threshold|20, options.high_threshold|50);

    return img_u8;
}

function getReds(image, width, height) {
    // actually getting greens and inverting
    var reds = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);
    for (var i = 1, j = 0; i < image.length; i += 4, j++) {
        reds.data[j] = 255 - image[i];
    }
    return reds;
}

function getNeighbors(matrix, i, j) {
    var is = i === 0;
    var js = j === 0;
    var ie = i + 1 === matrix.cols;
    var je = j + 1 === matrix.rows;
    return {
        me : matrix.data[ j    * matrix.cols +  i],
        n  :       js ? undefined : matrix.data[(j-1) * matrix.cols +  i],
        ne : ie || js ? undefined : matrix.data[(j-1) * matrix.cols + (i+1)],
        e  : ie       ? undefined : matrix.data[ j    * matrix.cols + (i+1)],
        se : ie || je ? undefined : matrix.data[(j+1) * matrix.cols + (i+1)],
        s  :       je ? undefined : matrix.data[(j+1) * matrix.cols +  i],
        sw : is || je ? undefined : matrix.data[(j+1) * matrix.cols + (i-1)],
        w  : is       ? undefined : matrix.data[ j    * matrix.cols + (i-1)],
        nw : is || js ? undefined : matrix.data[(j-1) * matrix.cols + (i-1)]
    };
}


var PI = Math.PI;
var dirDiff = PI / 4;
var infoByDir = {
    s  : { opp : 'n', minAngle : (1 / 2 * PI) - dirDiff, maxAngle : (-1 / 2 * PI) + dirDiff }, // atan-related weirdness with min > max
    se : { opp : 'nw', minAngle : (-1 / 4 * PI) - dirDiff, maxAngle : (-1 / 4 * PI) + dirDiff },
    e  : { opp : 'w', minAngle : 0 - dirDiff,            maxAngle : 0 + dirDiff },
    ne : { opp : 'sw', minAngle : (1 / 4 * PI) - dirDiff, maxAngle : (1 / 4 * PI) + dirDiff }
};
var dirs = Object.keys(infoByDir);

function findLine(edges) {
    var lines = [];
    var line;
    for(var i = 0; i < edges.cols; i++) {
        for(var j = 0; j < edges.rows; j++) {
            var neighbors = getNeighbors(edges, i, j);
            if (!neighbors.me) continue;
            dirs.forEach(function(dir) {
                if (!neighbors[infoByDir[dir].opp]) {
                    //console.log(dir + " is ok: ", i, j, infoByDir[dir])
                    line = followLine(edges, i, j, i, j, infoByDir[dir]);
                    lines.push(line);
                }
            });
        }
    }
    return getLongest(lines);
}

var deltas = [ // how to change the i and j for each dir we care about
    { i : 0, j : 1 },
    { i : 1, j : 1 },
    { i : 1, j : 0 },
    { i : 1, j : -1 }
];

function followLine(edges, sx, sy, i, j, dirInfo) {
    var angle;
    var d = deltas.length;
    var lines = [];
    while(d--) {
        var ex = i + deltas[d].i;
        var ey = j + deltas[d].j;

        //console.log('(' + ex + ',' + ey + ')')
        if (ex < 0 || ey < 0 || ex >= edges.rows || ey >= edges.cols) continue;

        var isEdge = edges.data[edges.cols * ey + ex];
        if (!isEdge) continue;
        //console.log(' is edge');

        var isAngleInRange = angleInRange(getAngle(sx, sy, ex, ey), dirInfo);
        if (!isAngleInRange) continue;
        //console.log(' is angle');

        var line = followLine(edges, sx, sy, ex, ey, dirInfo);
        if (line) {
            lines.push(line);
        }
    }

    //console.log('lines: ' + lines.length, sx, sy, i, j);

    if (lines.length) {
        return getLongest(lines);
    } else if (sx !== i || sy !== j) { // not 0-length
        return toLine(sx, sy, i, j);
    }
}

function toLine(sx, sy, ex, ey) {
    return {
        sx: sx,
        sy: sy,
        ex: ex,
        ey: ey
    }
}

function angleInRange(angle, range) {
    if (range.minAngle > range.maxAngle)  {
        return angle > range.minAngle || angle < range.maxAngle;
    } 
    return angle > range.minAngle && angle < range.maxAngle;
}

function getLongest(lines) {
    var max, maxVal;
    var i = lines.length;
    while(i--) {
        var line = lines[i];
        if (!line) continue;

        var len = getDistance(line.sx, line.sy, line.ex, line.ey);
        if (!(len < maxVal)) {
            maxVal = len;
            max = line;
        }
    }
    return max;
}

function getAngle(sx, sy, ex, ey) {
    var dx = ex - sx;
    var dy = ey - sy;
    return Math.atan(dy / dx);
}

function getDistance(sx, sy, ex, ey) {
    var dx = ex - sx;
    var dy = ey - sy;
    return Math.sqrt(dx * dx + dy * dy);
}

module.exports = getLinePose;
module.exports._getRedEdges = getRedEdges;
module.exports._findLine = findLine;
module.exports._getNeighbors = getNeighbors;
module.exports._followLine = followLine;
module.exports._infoByDir = infoByDir;
