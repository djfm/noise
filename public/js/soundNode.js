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
		else if(this.node_type == 'gain')
		{
			var node = audioContext.createGain();
			node.gain.value = 0.5;
			return node;
		}
		else if(this.node_type == 'delay')
		{
			var node = audioContext.createDelay();
			node.delayTime.value = 0.25;
			return node;
		}
		else if(this.node_type == 'envelope')
		{
			var gain = audioContext.createGain();
			gain.gain.value = 0;
			var now = audioContext.currentTime;
			gain.gain.setValueAtTime(gain.gain.value, now);
			gain.gain.linearRampToValueAtTime(1   , now + 0.1);
			gain.gain.linearRampToValueAtTime(0   , now + 0.5);
			return gain;
		}
		else if(this.node_type == 'output')
		{

			var gain = audioContext.createGain();
			gain.gain.value = 0.4;
			gain.connect(audioContext.destination);
			return gain;
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