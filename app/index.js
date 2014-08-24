var d3 = require('d3');
require('./main.css');
var BezierCurve = require('../lib/bezier-curve');
var Rect = require('../lib/rect');

var svg = d3.select('#example').append('svg')
  .attr({
    width: 400,
    height: 400
  });

var handleRadius = 8;
var tangentPointRadius = 4;

var curves = [
  {
    type: 'Q',
    points: [
      {x: 25, y: 150},
      {x: 180, y: 30},
      {x: 320, y: 254}
    ]
  },
  {
    type: 'C',
    points: [
      {x: 150, y: 125},
      {x: 40, y: 30},
      {x: 240, y: 120},
      {x: 145, y: 200}
    ]
  }
];

var controlLineLayer = svg.append('g').attr('class', 'control-line-layer');
var boundingBoxLayer = svg.append('g').attr('class', 'bounding-box-layer');
var mainLayer = svg.append('g').attr('class', 'main-layer');
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

  createBoundingBoxes();
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
    if (d.type !== 'L') {
      controlLineElem = controlLineLayer.selectAll('path.control-line.path' + i)
        .data([d]).enter().append('path')
        .attr({
          'class': 'control-line path' + i,
          d: controlLinePath(d)
        });
    }
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
        r: handleRadius
      })
      .each(function(d, handleI) {
        d.pathID = i;
        d.handleID = handleI;
        d.pathElem = pathElem;
        d.controlLineElem = controlLineElem;
      })
      .call(drag);

  });

function calcTangentParameters(d) {
  var curve = BezierCurve.fromPointArray(d.points);
  var deriv = curve.getDerivative();
  d.tangentParameters= deriv.getTangentParameters();
}

function BezierCurveSegment(curve, t0, t1) {
  this.curve = curve;
  this.t0 = t0;
  this.t1 = t1;
  this.p0 = curve.getPointAt(t0);
  this.p1 = curve.getPointAt(t1);
  this.bbox = Rect.fromTwoPoints(this.p0, this.p1);
}

function getInitialSegments(curve) {
  var deriv = curve.getDerivative();
  var ts = [].concat(0, deriv.getTangentParameters(), 1);
  var i = 1;
  var n = ts.length;
  var segments = [];
  for (; i < n; i++) {
    segments.push(new BezierCurveSegment(curve, ts[i - 1], ts[i]));
  }
  return segments;
}

function intersection(curve1, curve2) {
}

function isAnyOverlaps(segment, otherSegments) {
  var bbox = segment.bbox;
  var n = otherSegments.length;
  var i = 0;
  for (; i < n; i++) {
    if (bbox.overlaps(otherSegments[i].bbox)) {
      return true;
    }
  }
  return false;
}

function selectOverlappingSegments(curve0Segments, curve1Segments) {
  var curve0OverlappingSegments = [];
  var curve1OverlappingSegments = [];
  curve0Segments.forEach(function(curve0Segment) {
    if (isAnyOverlaps(curve0Segment, curve1Segments)) {
      curve0OverlappingSegments.push(curve0Segment);
    }
  });
  curve1Segments.forEach(function(curve1Segment) {
    if (isAnyOverlaps(curve1Segment, curve0Segments)) {
      curve1OverlappingSegments.push(curve1Segment);
    }
  });
  return [curve0OverlappingSegments, curve1OverlappingSegments];
}

function divideSegment(segment) {
  var curve = segment.curve;
  var t0 = segment.t0;
  var t1 = segment.t1;
  var tm = (t0 + t1) / 2;
  return [
    new BezierCurveSegment(curve, t0, tm),
    new BezierCurveSegment(curve, tm, t1)
  ];
}

function divideSegments(segments) {
  var dividedSegments = [];
  var n = segments.length;
  var i = 0;
  var tmpSegments;
  for (; i < n; i++) {
    tmpSegments = divideSegment(segments[i]);
    dividedSegments.push(tmpSegments[0]);
    dividedSegments.push(tmpSegments[1]);
  }
  return dividedSegments;
}

function createBoundingBoxes() {
  calcTangentParameters(curves[0]);
  calcTangentParameters(curves[1]);

  var curvesSegments = curves.map(function(d) {
    var curve = BezierCurve.fromPointArray(d.points);
    return getInitialSegments(curve);
  });
  for (var i = 0; i < 6; i ++) {
    curvesSegments = selectOverlappingSegments(curvesSegments[0], curvesSegments[1]);
    curvesSegments = curvesSegments.map(function(segments) {
      return divideSegments(segments);
    });
  }
  curvesSegments = selectOverlappingSegments(curvesSegments[0], curvesSegments[1]);
  curvesSegments.forEach(function(curveSegments, i) {
    boxElems = boundingBoxLayer.selectAll('rect.bbox' + i).data(curveSegments);
    boxElems
      .attr({
        x: function(d) { return d.bbox.x },
        y: function(d) { return d.bbox.y },
        width: function(d) { return d.bbox.width },
        height: function(d) { return d.bbox.height }
      });

    boxElems.enter().append('rect')
      .attr({
        'class': 'bbox' + i,
        x: function(d) { return d.bbox.x },
        y: function(d) { return d.bbox.y },
        width: function(d) { return d.bbox.width },
        height: function(d) { return d.bbox.height }
      });

    boxElems.exit().remove();
  });

  var points = [];
  curves.forEach(function(d) {
    var curve = BezierCurve.fromPointArray(d.points);
    var ts = d.tangentParameters;
    ts.forEach(function(t) {
      points.push(curve.getPointAt(t));
    });
  });

  var elems = boundingBoxLayer.selectAll('circle.tangent-point').data(points);
  elems
    .attr({
      cx: function(d) { return d.x },
      cy: function(d) { return d.y },
    });

  elems.enter().append('circle')
    .attr({
      'class': 'tangent-point',
      cx: function(d) { return d.x },
      cy: function(d) { return d.y },
      r: tangentPointRadius
    });

  elems.exit().remove();
}

createBoundingBoxes();
