function EllipticArc(cx, cy, rx, ry, xAxisRotation, angleStart, angleExtent) {
  this.cx = cx;
  this.cy = cy;
  this.rx = rx;
  this.ry = ry;
  this.xAxisRotation = xAxisRotation;
  this.angleStart = angleStart;
  this.angleExtent = angleExtent;
}

EllipticArc.fromSvgPathParameters = function(x1, y1, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x2, y2) {
  var phi = toRadians(xAxisRotation % 360);
  var cosPhi = Math.cos(phi);
  var sinPhi = Math.sin(phi);
  var halfDifX = (x1 - x2) / 2;
  var halfDifY = (y1 - y2) / 2;
  var x1p =  cosPhi * halfDifX + sinPhi * halfDifY;
  var y1p = -sinPhi * halfDifX + cosPhi * halfDifY;
  var prx, pry, px1p, py1p, radiiCheck, sign, denominator, numerator,
      coef, cxp, cyp, halfSumX, halfSumY, cx, cy, ux, uy, vx, vy,
      angleStart, angleExtent;

  rx = Math.abs(rx);
  ry = Math.abs(ry);
  prx = rx * rx;
  pry = ry * ry;
  px1p = x1p * x1p;
  py1p = y1p * y1p;

  // check that radii are large enough
  radiiCheck = px1p / prx + py1p / pry;
  if (radiiCheck > 1) {
    rx *= Math.sqrt(radiiCheck);
    ry *= Math.sqrt(radiiCheck);
    prx = rx * rx;
    pry = ry * ry;
  }

  // compute: (cx1, cy1)
  var sign = largeArcFlag === sweepFlag ? -1 : 1;
  var denominator = prx * py1p + pry * px1p;
  var numerator = prx * pry - denominator;
  var coef = numerator < 0 ? 0 : sign * Math.sqrt(numerator / denominator);

  var cxp = coef * (rx * y1p / ry);
  var cyp = coef * (-ry * x1p / rx);

  var halfSumX = (x1 + x2) / 2;
  var halfSumY = (y1 + y2) / 2;
  var cx = cosPhi * cxp - sinPhi * cyp + halfSumX;
  var cy = sinPhi * cxp + cosPhi * cyp + halfSumY;

  var ux = (x1p - cxp) / rx;
  var uy = (y1p - cyp) / ry;
  var vx = (-x1p - cxp) / rx;
  var vy = (-y1p - cyp) / ry;

  sign = uy < 0 ? -1 : 1;
  numerator = ux; // (1 * ux + 0 * uy);
  denominator = Math.sqrt(ux * ux + uy * uy);
  var angleStart = toDegrees(sign * Math.acos(numerator / denominator));

  sign = ux * vy - uy * vx < 0 ? -1 : 1;
  numerator = ux * vx + uy * vy;
  denominator = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
  var angleExtent = toDegrees(sign * Math.acos(numerator / denominator));

  if (!sweepFlag && angleExtent > 0) {
    angleExtent -= 360;
  } else if (sweepFlag && angleExtent < 0) {
    angleExtent += 360;
  }
  angleExtent %= 360;
  angleStart %= 360;

  return new EllipticArc(cx, cy, rx, ry, xAxisRotation, angleStart, angleExtent);
};

function toRadians(degree) {
  return degree * Math.PI / 180;
}

function toDegrees(radian) {
  return radian * 180 / Math.PI;
}

EllipticArc.prototype.getPointAtT = function(t) {
  return this.getPointAtAngle(this.getAngleAtT(t));
}

EllipticArc.prototype.getAngleAtT = function(t) {
  return this.angleStart + t * this.angleExtent;
};

EllipticArc.prototype.getTAtAngle = function(angleDegrees) {
  return (angleDegrees - this.angleStart) / this.angleExtent;
};

EllipticArc.prototype.getPointAtAngle = function(angleDegrees) {
  var theta = toRadians(angleDegrees);
  var cx = this.cx;
  var cy = this.cy;
  var rx = this.rx;
  var ry = this.ry;
  var phi = toRadians(this.xAxisRotation % 360);
  var cosPhi = Math.cos(phi);
  var sinPhi = Math.sin(phi);
  var rxc = rx * Math.cos(theta);
  var rys = ry * Math.sin(theta);
  return {
    x: cx + cosPhi * rxc - sinPhi * rys,
    y: cy + sinPhi * rxc + cosPhi * rys
  };
};

function compareNumbers(asc) {
  return function(a, b) {
    return (a < b ? -1 : a > b ? 1 : 0) * (asc ? 1 : -1);
  }
}

EllipticArc.prototype.getXYTangentParameters = function() {
  return this.getXYTangentAngles().map(function(angle) {
    return this.getTAtAngle(angle);
  }, this);
};

EllipticArc.prototype.getXYTangentAngles = function() {
  // deriv(theta)
  // x: cosPhi * rx * sinTheta + sinPhi * ry * cosTheta
  // y: sinPhi * rx * sinTheta - cosPhi * ry * cosTheta

  // x = 0
  // cosPhi * rx * sinTheta + sinPhi * ry * cosTheta = 0
  // cosPhi * rx * sinTheta = - sinPhi * ry * cosTheta
  // sinTheta / cosTheta = -(ry / rx) * (sinPhi / cosPhi)
  // theta = atan2(-ry * sinPhi, rx * cosPhi)

  // y = 0
  // sinPhi * rx * sinTheta - cosPhi * ry * cosTheta = 0
  // sinPhi * rx * sinTheta = cosPhi * ry * cosTheta
  // sinTheta / cosTheta = ry * cosPhi / (rx * sinPhi)
  // theta = atan2(ry * cosPhi, rx * sinPhi)

  var rx = this.rx;
  var ry = this.ry;
  var phi = toRadians(this.xAxisRotation % 360);
  var cosPhi = Math.cos(phi);
  var sinPhi = Math.sin(phi);
  var angleStart = this.angleStart;
  var angleExtent = this.angleExtent;
  var angleX = toDegrees(Math.atan2(-ry * sinPhi, rx * cosPhi)) % 360;
  var angleY = toDegrees(Math.atan2(ry * cosPhi, rx * sinPhi)) % 360;
  var angles = [];
  var anglesInRange = [];

  if (angleStart >= 0) {
    if (angleX <= 0) {
      angleX += 360;
    }
    if (angleY <= 0) {
      angleY += 360;
    }
  } else if (angleStart < 0) {
    if (angleX >= 0) {
      angleX -= 360;
    }
    if (angleY >= 0) {
      angleY -= 360;
    }
  }

  angles.push(angleX - 360);
  angles.push(angleY - 360);
  angles.push(angleX - 180);
  angles.push(angleY - 180);
  angles.push(angleX);
  angles.push(angleY);
  angles.push(angleX + 180);
  angles.push(angleY + 180);
  angles.push(angleX + 360);
  angles.push(angleY + 360);

  anglesInRange = angles.filter(function(angle) {
    return this.isAngleInRange(angle);
  }, this);
  anglesInRange.sort(compareNumbers(angleExtent > 0));

  return anglesInRange;
};

EllipticArc.prototype.isAngleInRange = function(angleDegrees) {
  var angleStart = this.angleStart;
  var angleExtent = this.angleExtent;
  if (angleExtent >= 0) {
    return angleStart <= angleDegrees && angleDegrees <= angleStart + angleExtent;
  } else {
    return angleStart + angleExtent <= angleDegrees && angleDegrees <= angleStart;
  }
};

module.exports = EllipticArc;
