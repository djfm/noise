var audioContext = new (window.AudioContext || window.webkitAudioContext)();

var soundNode = function(options)
{
	this.inputs 	= {};
	this.outputs 	= {};

	this.id 		= options.id;
	this.node_type  = options.node_type;

	if(this.node_type == 'gain')
	{
		this.gain = 0.5;
	}
	else if(this.node_type == 'oscillator')
	{
		this.type = 0;
		this.mult = 1;
	}
	else if(this.node_type == 'delay')
	{
		this.delay = 0.25;
	}
	else if(this.node_type == 'envelope')
	{
		this.vmax  = 1.0;
		this.vplat = 0.9;
		this.a 	   = 0.05;
		this.d     = 0.07;
		this.s 	   = 0.3;
		this.r     = 0.1;
	}

	this.getNode = function()
	{
		if(this.node_type == 'oscillator')
		{
			var node 		= audioContext.createOscillator();
			node.type		= parseInt(this.type);
			node.frequency_multiplier = this.mult;
			return node;
		}
		else if(this.node_type == 'gain')
		{
			var node = audioContext.createGain();
			node.gain.value = this.gain;
			return node;
		}
		else if(this.node_type == 'delay')
		{
			var node = audioContext.createDelay();
			node.delayTime.value = parseFloat(this.delay);
			return node;
		}
		else if(this.node_type == 'envelope')
		{
			var gain = audioContext.createGain();
			gain.gain.value = 0;
			var now = audioContext.currentTime;
			gain.gain.setValueAtTime(gain.gain.value, now);
			var t = now + parseFloat(this.a);
			gain.gain.linearRampToValueAtTime(parseFloat(this.vmax)    , t);
			t += parseFloat(this.d);
			gain.gain.linearRampToValueAtTime(parseFloat(this.vplat)   , t);
			t += parseFloat(this.s);
			gain.gain.linearRampToValueAtTime(parseFloat(this.vplat)   , t);
			t += parseFloat(this.r);
			gain.gain.linearRampToValueAtTime(0   		   , t);
			return gain;
		}
		else if(this.node_type == 'filter')
		{
			var filter = audioContext.createBiquadFilter();

			filter.gain.value = this.gain;
			filter.frequency.value = this.frequency;
			filter.detune.value = this.detune;
			filter.type = this.type;

			return filter;
		}
		else if(this.node_type == 'output')
		{
			return audioContext.destination;
		}
		else
		{
			return null;
		}
	};

	this.getControls = function()
	{
		if(this.node_type == 'gain')
		{
			return {inputs: [{name: 'gain', type: 'number', value: this.gain}]};
		}
		else if(this.node_type == 'delay')
		{
			return {inputs: [{name: 'delay', type: 'number', value: this.delay}]};
		}
		else if(this.node_type == 'oscillator')
		{
			return {inputs: [{name: 'mult', type: 'number', value: this.mult}], selects: [{name: 'type', options: {'0': 'Sine', '1': 'Square', '2': 'Sawtooth', '3': 'Triangle'}, value: this.type}]};
		}
		else if(this.node_type == 'envelope')
		{
			return {inputs: [
				{name: 'vmax'	, type: 'number', value: this.vmax},
				{name: 'vplat'	, type: 'number', value: this.vplat},
				{name: 'a'		, type: 'number', value: this.a},
				{name: 'd'		, type: 'number', value: this.d},
				{name: 's'		, type: 'number', value: this.s},
				{name: 'r'		, type: 'number', value: this.r}
			]};
		}
		else if(this.node_type == 'filter')
		{
			return {inputs: [
				{name: 'gain'		, type: 'number', value: this.gain},
				{name: 'detune'		, type: 'number', value: this.detune},
				{name: 'frequency'	, type: 'number', value: this.frequency}
				],
				selects: [{name: 'type', options: {
							'lowpass' : 'Lowpass'
						},
						value:this.type
					}
				]
			};
		}

		return {};
	};

	this.updateSetting = function(key, value)
	{
		this[key] = value;
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