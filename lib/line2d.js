function Line2D(points) {
  this.points = points;
}

Line2D.getIntersectionAndParameters = function(line1, line2) {
  var homogeneousIntersection, intersection, ts;
  var lines = [line1, line2];
  var homoLines = lines.map(function(line) {
    var homoPoints = line.points.map(function(p) {
      return HomogeneousPoint.fromPoint2D(p.x, p.y);
    });
    return HomogeneousLine.fromTwoHomogeneousPoints(homoPoints[0], homoPoints[1]);
  });

  homogeneousIntersection = HomogeneousPoint.getIntersection(homoLines[0], homoLines[1]);
  if (homogeneousIntersection.w !== 0) {
    intersection = homogeneousIntersection.toPoint2D();
    ts = lines.map(function(line) {
      return line.getParameterForPoint(intersection);
    });
    if (0 <= ts[0] && ts[0] <= 1 && 0 <= ts[1] && ts[1] <= 1) {
      return [intersection, ts];
    }
  }
  return null;
};

Line2D.prototype.getParameterForPoint = function(pt) {
  // pt = (1 - t) * p0 + t * p1
  // -> t = (pt - p0) / (p1 - p0)
  var p0 = this.points[0];
  var p1 = this.points[1];
  var tx = (pt.x - p0.x) / (p1.x - p0.x);
  var ty = (pt.y - p0.y) / (p1.y - p0.y);
  if (isNaN(tx)) {
    return ty;
  } else if (isNaN(ty)) {
    return tx;
  } else {
    if (Math.abs(pt.x - p0.x) > Math.abs(pt.y - p0.y)) {
      return tx;
    } else {
      return ty;
    }
  }
};

function HomogeneousPoint(x, y, w) {
  this.x = x;
  this.y = y;
  this.w = (w === undefined ? 1 : w);
}

// You must check this.w is not zero in advance.
HomogeneousPoint.prototype.toPoint2D = function() {
  return { x: this.x / this.w, y: this.y / this.w };
}

HomogeneousPoint.fromPoint2D = function(p1, p2) {
  return new HomogeneousPoint(p1, p2);
};

HomogeneousPoint.getIntersection = function(l1, l2) {
  return new HomogeneousPoint(
    l1.b * l2.c - l2.b * l1.c,
    l2.a * l1.c - l1.a * l2.c,
    l1.a * l2.b - l2.a * l1.b
  );
};

function HomogeneousLine(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

HomogeneousLine.fromTwoHomogeneousPoints = function(p1, p2) {
  return new HomogeneousLine(
    p1.y * p2.w - p2.y * p1.w,
    p2.x * p1.w - p1.x * p2.w,
    p1.x * p2.y - p2.x * p1.y
  );
};

module.exports = Line2D;
