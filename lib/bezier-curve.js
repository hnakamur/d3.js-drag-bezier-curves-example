var solveQuadraticEquation = require('solve-quadratic-equation');

function BezierCurve(xs, ys) {
  this.xs = xs;
  this.ys = ys;
}

BezierCurve.fromPointArray = function (points) {
  return new BezierCurve(
    points.map(function(point) { return point.x; }),
    points.map(function(point) { return point.y; })
  );
}

function getBernsteinPolynomialValueAt(b, t) {
  // See cagd.pdf 3.2 Horner's Algorithm in Bernstein Basis
  var n = b.length - 1;
  var u = 1 - t;
  var bc = 1;
  var tn = 1;
  var tmp = b[0] * u;
  var i = 1;
  for (; i < n; i++) {
    tn *= t;
    bc *= (n - i + 1) / i;
    tmp = (tmp + tn * bc * b[i]) * u;
  }
  return tmp + tn * t * b[n];
}

BezierCurve.prototype.getPointAt = function(t) {
  return {
    x: getBernsteinPolynomialValueAt(this.xs, t),
    y: getBernsteinPolynomialValueAt(this.ys, t)
  };
};

function getBernsteinPolynomialDerivative(b) {
  var n = b.length - 1;
  var d = new Array(n);
  var i = 0;
  for (; i < n; i++) {
    d[i] = n * (b[i + 1] - b[i]);
  }
  return d;
}

BezierCurve.prototype.getDerivative = function() {
  return new BezierCurve(
    getBernsteinPolynomialDerivative(this.xs),
    getBernsteinPolynomialDerivative(this.ys)
  );
};

// quadratic
// b0 * (1-t)^2 + 2 * b1 * (1-t) * t + b2 * t^2
// = (b0 - 2 * b1 + b2) * t^2 + 2 * (b1 - b0) * t + b0
//
// linear
// b0 * (1-t) + b1 * t
// = (b1 - b0) * t + b0

function getTangentParameters(bc) {
  var roots, a, b, c;

  if (bc.length === 3) {
    a = bc[0] - 2 * bc[1] + bc[2];
    b = 2 * (bc[1] - bc[0]);
    c = bc[0];
  } else {
    a = 0;
    b = bc[1] - bc[0];
    c = bc[0];
  }
  roots = solveQuadraticEquation(a, b, c);
//console.log('a', a, 'b', b, 'c', c, 'roots', roots);

  var i = 0;
  var n = roots.length;
  var rootsInRange = [];
  var root;
  for (i = 0; i < n; i++) {
    root = roots[i];
    if (0 <= root && root <= 1) {
      rootsInRange.push(root);
    }
  }
  return rootsInRange;
}

BezierCurve.prototype.getTangentParameters = function(epsilonLength) {
  var xt = getTangentParameters(this.xs);
  var yt = getTangentParameters(this.ys);
  var ts = xt.concat(yt).sort();
  var n = ts.length;
  var mergedTs = [];
  var i = 1;
  var t, tPrev;

  if (n > 0) {
    mergedTs.push(ts[0]);
  }
  for (; i < n; i++) {
    t = ts[i];
    tPrev = ts[i - 1];
    if (!this.nearlySamePointParameters(tPrev, t, epsilonLength)) {
      mergedTs.push(t);
    }
  }
  return mergedTs;
}

function getVectorLength(x, y) {
  return Math.sqrt(x * x + y * y);
}

BezierCurve.prototype.nearlySamePointParameters = function(t1, t2, epsilonLength) {
  var p1 = this.getPointAt(t1);
  var p2 = this.getPointAt(t2);
  var length = getVectorLength(p2.x - p1.x, p2.y - p1.y);

  if (epsilonLength === undefined) {
    epsilonLength = 1;
  }
  return length <= epsilonLength;
};

module.exports = BezierCurve;
