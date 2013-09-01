var audioContext = new (window.AudioContext || window.webkitAudioContext)();

var soundNode = function(options)
{
	this.inputs 	= {};
	this.outputs 	= {};

	this.id 		= options.id;
	this.node_type  = options.node_type;

	

	this.getNode = function()
	{
		if(this.node_type == 'oscillator')
		{
			var node 		= audioContext.createOscillator();
			node.type		= 0;
			return node;
		}
		else if(this.node_type == 'output')
		{
			var g = audioContext.createGain();
			g.gain.value = 0.1;
			g.connect(audioContext.destination);
			return g;
		}
		else
		{
			return null;
		}
	};

	this.prepareForSerialize = function()
	{
		var dupe = {};
		for(var i in this)
		{
			if(i != 'view')
			{
				dupe[i] = this[i];
			}
			else
			{
				dupe['viewPosition'] = this.view.shape.getAbsolutePosition();
			}
		}
		return dupe;
	};

	this.loadFromObject = function(obj)
	{
		for(var i in obj)
		{
			this[i] = obj[i];
		}
	};

}