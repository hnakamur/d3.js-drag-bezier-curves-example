var Line2D = require('./line2d');
var Rect = require('../lib/rect');

function CurveSegment(curve, t0, t1) {
  this.curve = curve;
  this.t0 = t0;
  this.t1 = t1;
  this.p0 = curve.getPointAt(t0);
  this.p1 = curve.getPointAt(t1);
  this.bbox = Rect.fromTwoPoints(this.p0, this.p1);
}

CurveSegment.getBboxOverlappingPairs = function(curve0Segments, curve1Segments) {
  var pairs = [];
  var n0 = curve0Segments.length;
  var n1 = curve1Segments.length;
  var i0, i1, seg0, seg1;
  for (i0 = 0; i0 < n0; i0++) {
    seg0 = curve0Segments[i0];
    for (i1 = 0; i1 < n1; i1++) {
      seg1 = curve1Segments[i1];
      if (seg0.bbox.overlaps(seg1.bbox)) {
        pairs.push({ seg0: seg0, seg1: seg1 });
      }
    }
  }
  return pairs;
};

CurveSegment.getIntersectionAndParametersAsLines = function(curveSeg0, curveSeg1) {
  var lines = [curveSeg0, curveSeg1].map(function (curveSeg) {
    return new Line2D([curveSeg.p0, curveSeg.p1]);
  });
  return Line2D.getIntersectionAndParameters(lines[0], lines[1]);
};

module.exports = CurveSegment;
