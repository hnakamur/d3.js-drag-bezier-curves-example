var d3 = require('d3');

var svg = d3.select('#example').append('svg')
  .attr({
    width: 400,
    height: 400
  });

var handleRadius = 8;

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
  return 'p' + (i + 1) + ': ' + d.x + ',' + d.y;
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
