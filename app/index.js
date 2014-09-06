var d3 = require('d3');
require('./main.css');
var BezierCurve = require('../lib/bezier-curve');
var EllipticArc = require('../lib/elliptic-arc');
var CurveSegment = require('../lib/curve-segment');

var svg = d3.select('#example').append('svg')
  .attr({
    width: 400,
    height: 400
  });

var handleRadius = 8;
var lastHandleRadius = 30;
var intersectionRadius = 4;

var curves = [
  {
    type: 'C',
    points: [
      {x: 120, y: 160},
      {x: 35, y: 200},
      {x: 220, y: 260},
      {x: 220, y: 40}
    ]
  }
];

var defs = svg.append('defs');
defs.append('marker')
  .attr({
    'id': 'arrowhead',
    viewBox: '0 0 10 10',
    'refX': 10,
    'refY': 5,
    'markerWidth': 10,
    'markerHeight': 10,
    'orient': 'auto'
  })
  .append('path')
  .attr({
    d: 'M10 5 0 10 0 8.7 6.8 5.5 0 5.5 0 4.5 6.8 4.5 0 1.3 0 0Z',
    stroke: 'none',
    fill: 'black'
  });

var controlLineLayer = svg.append('g').attr('class', 'control-line-layer');
var mainLayer = svg.append('g').attr('class', 'main-layer');
var intersectionLayer = svg.append('g').attr('class', 'intersection-layer');
var handleTextLayer = svg.append('g').attr('class', 'handle-text-layer');
var handleLayer = svg.append('g').attr('class', 'handle-layer');

var drag = d3.behavior.drag()
  .origin(function(d) { return d; })
  .on('drag', dragmove);

function dragmove(d) {
  d.x = d3.event.x;
  d.y = d3.event.y;
  d3.select(this).attr({cx: d.x, cy: d.y});
  d.pathElem.attr('d', pathData);
  if (d.controlLineElem) {
    d.controlLineElem.attr('d', controlLinePath);
  }
  handleTextLayer.selectAll('text.handle-text.path' + d.pathID + '.p' + (d.handleID + 1))
    .attr({x: d.x, y: d.y}).text(handleText(d, d.handleID));

  calculateIntersection();
}

function pathData(d) {
  var p = d.points;
  switch (d.type) {
  case 'L':
    return [
      'M', p[0].x, ' ', p[0].y,
      ' ', p[1].x, ' ', p[1].y
    ].join('');
  case 'Q':
    return [
      'M', p[0].x, ' ', p[0].y,
      'Q', p[1].x, ' ', p[1].y,
      ' ', p[2].x, ' ', p[2].y
    ].join('');
  case 'C':
    return [
      'M', p[0].x, ' ', p[0].y,
      'C', p[1].x, ' ', p[1].y,
      ' ', p[2].x, ' ', p[2].y,
      ' ', p[3].x, ' ', p[3].y,
    ].join('');
  case 'A':
    return 'M' + d.x1 + ' ' + d.y1 +
      'A' + d.rx + ' ' + d.ry +
      ' ' + d.xAxisRotation +
      ' ' + d.largeArcFlag + ' ' + d.sweepFlag +
      ' ' + d.x2 + ' ' + d.y2;
  }
}

function controlLinePath(d) {
  var values = [];
  d.points.forEach(function(p) {
    values.push(p.x);
    values.push(p.y);
  });
  return 'M' + values.join(' ');
}

function handleText(d, i) {
  return 'p' + (i + 1) + ': ' + d.x + '/' + d.y;
}

mainLayer.selectAll('path.curves').data(curves)
  .enter().append('path')
  .attr({
    'class': function(d, i) { return 'curves path' + i; },
    d: pathData
  })
  .each(function (d, i) {
    var pathElem = d3.select(this),
        controlLineElem,
        handleTextElem;
    if (d.type === 'Q' || d.type === 'C') {
      controlLineElem = controlLineLayer.selectAll('path.control-line.path' + i)
        .data([d]).enter().append('path')
        .attr({
          'class': 'control-line path' + i,
          d: controlLinePath(d)
        });

      handleTextElem = handleTextLayer.selectAll('text.handle-text.path' + i)
        .data(d.points).enter().append('text')
        .attr({
          'class': function(handleD, handleI) {
            return 'handle-text path' + i + ' p' + (handleI + 1);
          },
          x: function(d) { return d.x },
          y: function(d) { return d.y },
          dx: 10,
          dy: 0
        })
        .text(handleText);
      handleLayer.selectAll('circle.handle.path' + i)
        .data(d.points).enter().append('circle')
        .attr({
          'class': 'handle path' + i,
          cx: function(d) { return d.x },
          cy: function(d) { return d.y },
          r: function(d, i) { return i < 3 ? handleRadius : lastHandleRadius; }
        })
        .each(function(d, handleI) {
          d.pathID = i;
          d.handleID = handleI;
          d.pathElem = pathElem;
          d.controlLineElem = controlLineElem;
        })
        .call(drag);
    }
  });

function drawPoints(layer, points, cssClass, radius) {
  var elems = layer.selectAll('circle.' + cssClass).data(points);
  elems
    .attr({
      cx: function(d) { return d.x },
      cy: function(d) { return d.y },
    });

  elems.enter().append('circle')
    .attr({
      'class': cssClass,
      cx: function(d) { return d.x },
      cy: function(d) { return d.y },
      r: radius
    });

  elems.exit().remove();
}

function convertBezierCurveToPath(curve) {
  var xs = curve.xs;
  var ys = curve.ys;
  return 'M' +  xs[0] + ' ' + ys[0] +
      'C' +  xs[1] + ' ' + ys[1] +
      ' ' +  xs[2] + ' ' + ys[2] +
      ' ' +  xs[3] + ' ' + ys[3];
}

function drawCutCurve(layer, curve, cssClass) {
  var elems = layer.selectAll('path.' + cssClass).data([curve]);
  elems
    .attr({
      d: convertBezierCurveToPath
    });

  elems.enter().append('path')
    .attr({
      'class': cssClass,
      d: convertBezierCurveToPath,
      'marker-end': 'url(#arrowhead)'
    });

  elems.exit().remove();
}

function calculateIntersection() {
  var t;
  var d = curves[0].points[3];
  var lastHandleCurve = new EllipticArc(d.x, d.y, lastHandleRadius, lastHandleRadius, 0, 0, 360);
  var bezierCurve = BezierCurve.fromPoints(curves[0].points);
  var curvesSegments = [bezierCurve, lastHandleCurve].map(function(curve) {
    return CurveSegment.divideAtXYTangentPoints(curve);
  });

  var intersectionsAndParameters = CurveSegment.getIntersectionsAndParameters(curvesSegments[0], curvesSegments[1]);
  if (intersectionsAndParameters.length > 0) {
    t = intersectionsAndParameters[0][1][0];
  }

  var newCurve = bezierCurve.getCurveFromZeroToT(t);
  drawCutCurve(intersectionLayer, newCurve, 'cut-curve');
}

calculateIntersection();
