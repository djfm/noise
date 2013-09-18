var KineticUtil = function(){

};

KineticUtil.onDrag = function(element, options)
{

	var info = function(e)
	{
		return {
			start: element.kineticUtil_dragStartedAt,
			current: {x: event.layerX, y: event.layerY},
			topLeft: {
				x: Math.min(element.kineticUtil_dragStartedAt.x, event.layerX),
				y: Math.min(element.kineticUtil_dragStartedAt.y, event.layerY)
			},
			delta: {
				x: event.layerX - element.kineticUtil_dragStartedAt.x,
				y: event.layerY - element.kineticUtil_dragStartedAt.y
			},
			size: {
				width: Math.abs(element.kineticUtil_dragStartedAt.x - event.layerX),
				height: Math.abs(element.kineticUtil_dragStartedAt.y - event.layerY)
			},
			mouseEvent: e
		};
	};

	var dragStart = function(e)
	{
		element.kineticUtil_lastPos = element.kineticUtil_dragStartedAt

		if(options.onStart)
		{
			options.onStart(info(e));
		}
	};

	var dragMove = function(e)
	{
		if(options.onMove)
		{
			options.onMove(info(e));
		}
	};

	var dragEnd = function(e)
	{
		if(options.onEnd)
		{
			options.onEnd(info(e));
		}

		element.kineticUtil_dragStartedAt 	= undefined;
		element.kineticUtil_dragStatus 		= 0;
	};

	if(options == undefined)
	{
		options = {};
	}

	element.on('mousedown', function(e){
		if(e.button == (options.button || 0))
		{
			if(element.kineticUtil_dragStartedAt && element.kineticUtil_dragStatus == 1)
			{
				dragEnd(e);
			}
			else
			{
				element.kineticUtil_dragStartedAt 	= {x: e.layerX, y: e.layerY};
				element.kineticUtil_dragStatus 		= 0;
			}
			e.cancelBubble = true;
		}
	});

	element.on('mousemove', function(e){
		if(element.kineticUtil_dragStartedAt)
		{
			if(element.kineticUtil_dragStatus == 0)
			{
				element.kineticUtil_dragStatus = 1;
				dragStart(e);
			}
			else
			{
				element.kineticUtil_lastPos = {x: e.layerX, y: e.layerY};
				dragMove(e);
			}
		}
	});

	element.on('mouseup', function(e){
		if(element.kineticUtil_dragStartedAt && element.kineticUtil_dragStatus == 1)
		{
			dragEnd(e);
		}
		else
		{
			element.kineticUtil_dragStartedAt 	= undefined;
			element.kineticUtil_dragStatus 		= 0;
		}
	});
};