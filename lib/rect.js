function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.fromTwoPoints = function(p1, p2) {
  return new Rect(
    Math.min(p1.x, p2.x),
    Math.min(p1.y, p2.y),
    Math.abs(p2.x - p1.x),
    Math.abs(p2.y - p1.y)
  );
};

Rect.prototype.overlaps = function(rect) {
  return this.x < rect.x + rect.width  && this.x + this.width  > rect.x &&
         this.y < rect.y + rect.height && this.y + this.height > rect.y;
}

module.exports = Rect;
