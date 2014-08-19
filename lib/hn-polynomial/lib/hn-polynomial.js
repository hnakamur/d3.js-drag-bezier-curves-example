var Complex = require('complex-js');

function Polynomial() {
  var p = [],
      n = arguments.length,
      i;
  for (i = n - 1; i >= 0; i--) {
    p.push(arguments[i]);
  }
  this.init(p);
}

Polynomial.fromArray = function(p) {
  var poly = new Polynomial;
  poly.init(p);
  return poly;
}

Polynomial.prototype.init = function(p) {
  var p = p.concat(),
      i;
  for (i = p.length - 1; i >= 0 && p[i] === 0; i--) {
    p.pop();
  }
  this.p = p;
};

Polynomial.prototype.getValueAt = function(t) {
  var p = this.p,
      n = p.length - 1,
      h = p[n],
      i;

  for (i = n - 1; i >= 0; i--) {
    h = t * h + p[i];
  }
  return h;
};

Polynomial.prototype.complexValueAt = function(t) {
  var p = this.p,
      n = p.length - 1,
      h = Complex(p[n], 0),
      i;

  for (i = n - 1; i >= 0; i--) {
    h = t.mult(h).add(Complex(p[i], 0));
  }
  return h;
};

Polynomial.prototype.getNormalized = function() {
  var p = this.p.concat(),
      n = p.length - 1,
      pn = p[n],
      i;

  if (pn !== 1) {
    for (i = n; i >= 0; i--) {
      p[i] /= pn;
    }
  }
  return Polynomial.fromArray(p);
};

Polynomial.prototype.getDerivative = function() {
  var p = this.p,
      n = p.length - 1,
      q = new Array(n),
      i;

  for (i = n - 1; i >= 0; i --) {
    q[i] = p[i + 1] * (i + 1);
  }
  return Polynomial.fromArray(q);
};

Polynomial.prototype.toString = function() {
  var p = this.p,
      n = p.length - 1,
      chunks = [],
      i;

  function term(c, i) {
    var op,
        cAbs;
    if (c === 0) {
      return '';
    }

    if (c > 0) {
      op = '+';
      cAbs = c;
    } else {
      op = '-';
      cAbs = -c;
    }

    if (i > 1) {
      if (cAbs === 1) {
        return ' ' + op + ' x^' + i;
      } else {
        return ' ' + op + ' ' + cAbs + ' * x^' + i;
      }
    } if (i === 1) {
      if (cAbs === 1) {
        return ' ' + op + ' x';
      } else {
        return ' ' + op + ' ' + cAbs + ' * x';
      }
    } else {
      return ' ' + op + ' ' + cAbs;
    }
  }

  if (p[n] !== 0) {
    if (p[n] === 1) {
      chunks.push('x^' + n);
    } else if (p[n] === -1) {
      chunks.push('-x^' + n);
    } else {
      chunks.push('' + p[n] + ' * x^' + n);
    }
  }

  for (i = n - 1; i >= 0; i--) {
    chunks.push(term(p[i], i));
  }

  return chunks.join('');
};

Polynomial.prototype.getRootsInInterval = function(lower, upper, epsilon, maxIter) {
  var roots = this.getRoots(epsilon, maxIter),
      n = roots.length,
      rootsInInterval = [],
      zi,
      i;

  for (i = 0; i < n; i++) {
    zi = roots[i];
    if (Math.abs(zi.i) < 1e-5 && lower <= zi.r && zi.r <= upper) {
      rootsInInterval.push(zi.r);
    }
  }
  return rootsInInterval;
};

Polynomial.prototype.getRoots = function(epsilon, maxIter) {
  var poly = this.getNormalized();
  console.log('normalized poly=' + poly.toString());
  var p = poly.p.concat(),
      n = p.length - 1,
      r = 1 + Math.max.apply(null, p),
      z = new Array(n),
      dz = new Array(n),
      i,
      j,
      theta,
      k,
      dzMax,
      qJ,
      dzJLen,
      fzJ;
  // Set initial values
  for (j = 0; j < n; j++) {
    theta = 2 * Math.PI * j / n;
    z[j] = Complex.Polar(r, theta); 
    console.log('initial z['+j+']=' + z[j].toString());
  }

  if (epsilon === undefined) {
    epsilon = 1e-9;
  }
  if (maxIter === undefined) {
    maxIter = 200;
  }

  for (k = 0; k < maxIter; k++) {
    dzMax = 0;
    for (j = 0; j < n; j++) {
      // Compute the product qJ
      qJ = Complex(1, 0);
      for (i = 0; i < n; i++) {
        if (i !== j) {
          qJ = qJ.mult(z[j].sub(z[i]));
        }
      }

      fzJ = poly.complexValueAt(z[j]);
      dz[j] = Complex.neg(fzJ).divBy(qJ);
      dzJLen = dz[j].m;
      dzMax = Math.max(dzMax, dzJLen);
    }

    for (j = 0; j < n; j++) {
      z[j] = z[j].add(dz[j]);
    }

    if (dzMax <= epsilon) {
      console.log('converged with iteration=' + k);
      poly.printRoots(z);
      return z;
    }
  }
  console.log('not converged. k=' + k + ', epsilon=' + epsilon);
  throw new Error('Failed to converge. Increase eplison or maxIter and try again');
};

Polynomial.prototype.printRoots = function(z) {
  var n = z.length,
      i;
  for (i = 0; i < n; i++) {
    console.log('roots['+i+']=' + z[i].toString() + ' ' + z[i].toString(true));
    console.log('real f=' + this.getValueAt(z[i].r));
  }
}

module.exports = Polynomial;
