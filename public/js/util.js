var frist = function(obj)
{
	for(var i in obj)
	{
		return obj[i];
	}

	return undefined;
};

var requestAnimFrame = (function(callback) {
return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
function(callback) {
  window.setTimeout(callback, 1000 / 60);
};
})();