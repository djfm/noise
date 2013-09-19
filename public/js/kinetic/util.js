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
				x: event.layerX - element.kineticUtil_lastPos.x,
				y: event.layerY - element.kineticUtil_lastPos.y
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
		if(options.relayFrom)
		{
			options.relayFrom.kineticUtil_dragRelayTo = element;
		}

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


	var relay = function(e)
	{
		if(element.kineticUtil_dragRelayTo)
		{
			element.kineticUtil_dragRelayTo.fire(e.type, e);
		}
	};

	var dragEnd = function(e)
	{
		if(options.relayFrom)
		{
			options.relayFrom.kineticUtil_dragRelayTo = undefined;
		}

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

		relay(e);
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
				dragMove(e);
				element.kineticUtil_lastPos = {x: e.layerX, y: e.layerY};
			}
		}
		relay(e);
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

		relay(e);
	});


};