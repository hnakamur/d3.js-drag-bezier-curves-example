var Line2D = require('./line2d');
var Rect = require('./rect');

function CurveSegment(curve, t0, t1) {
  this.curve = curve;
  this.t0 = t0;
  this.t1 = t1;
  this.p0 = curve.getPointAtT(t0);
  this.p1 = curve.getPointAtT(t1);
  this.bbox = Rect.fromTwoPoints(this.p0, this.p1);
}

CurveSegment.divideAtXYTangentPoints = function(curve) {
  var ts = [].concat(0, curve.getXYTangentParameters(), 1);
  var i = 1;
  var n = ts.length;
  var segments = [];
  for (; i < n; i++) {
    segments.push(new CurveSegment(curve, ts[i - 1], ts[i]));
  }
  return segments;
};

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
        pairs.push([seg0, seg1]);
      }
    }
  }
  return pairs;
};

CurveSegment.isAnyOverlaps = function(segment, otherSegments) {
  var bbox = segment.bbox;
  var n = otherSegments.length;
  var i = 0;
  for (; i < n; i++) {
    if (bbox.overlaps(otherSegments[i].bbox)) {
      return true;
    }
  }
  return false;
};

CurveSegment.selectOverlappingSegments = function(curve0Segments, curve1Segments) {
  var curve0OverlappingSegments = [];
  var curve1OverlappingSegments = [];
  curve0Segments.forEach(function(curve0Segment) {
    if (CurveSegment.isAnyOverlaps(curve0Segment, curve1Segments)) {
      curve0OverlappingSegments.push(curve0Segment);
    }
  });
  curve1Segments.forEach(function(curve1Segment) {
    if (CurveSegment.isAnyOverlaps(curve1Segment, curve0Segments)) {
      curve1OverlappingSegments.push(curve1Segment);
    }
  });
  return [curve0OverlappingSegments, curve1OverlappingSegments];
};

CurveSegment.divideSegment = function(segment) {
  var curve = segment.curve;
  var t0 = segment.t0;
  var t1 = segment.t1;
  var tm = (t0 + t1) / 2;
  return [
    new CurveSegment(curve, t0, tm),
    new CurveSegment(curve, tm, t1)
  ];
};

CurveSegment.divideSegments = function(segments) {
  var dividedSegments = [];
  var n = segments.length;
  var i = 0;
  var tmpSegments;
  for (; i < n; i++) {
    tmpSegments = CurveSegment.divideSegment(segments[i]);
    dividedSegments.push(tmpSegments[0]);
    dividedSegments.push(tmpSegments[1]);
  }
  return dividedSegments;
};

CurveSegment.getIntersectionAndParametersAsLines = function(curveSeg0, curveSeg1) {
  var lines = [curveSeg0, curveSeg1].map(function (curveSeg) {
    return new Line2D([curveSeg.p0, curveSeg.p1]);
  });
  return Line2D.getIntersectionAndParameters(lines[0], lines[1]);
};

CurveSegment.prototype.getParameterInCurve = function(segmentT) {
  return (1 - segmentT) * this.t0 + segmentT * this.t1;
};

CurveSegment.getIntersectionsAndParameters = function(curve0Segments, curve1Segments) {
  var i, pairs, intersectionAndParams;
  var intersectionsAndParams = [];
  var curvesSegments = [curve0Segments, curve1Segments];

  for (i = 0; i < 5; i ++) {
    curvesSegments = CurveSegment.selectOverlappingSegments(curvesSegments[0], curvesSegments[1]);
    curvesSegments = curvesSegments.map(function(segments) {
      return CurveSegment.divideSegments(segments);
    });
  }
  curvesSegments = CurveSegment.selectOverlappingSegments(curvesSegments[0], curvesSegments[1]);

  pairs = CurveSegment.getBboxOverlappingPairs(curvesSegments[0], curvesSegments[1]);
  
  pairs.forEach(function(pair) {
    var params;
    intersectionAndParams = CurveSegment.getIntersectionAndParametersAsLines(pair[0], pair[1]);
    if (intersectionAndParams !== null) {
      params = intersectionAndParams[1];
      params[0] = pair[0].getParameterInCurve(params[0]);
      params[1] = pair[1].getParameterInCurve(params[1]);
      intersectionsAndParams.push(intersectionAndParams);
    }
  });
  return intersectionsAndParams;
}

module.exports = CurveSegment;
