if(this.audioContext === undefined)
{
	this.audioContext = new (this.audioContext || this.webkitAudioContext)();
}

var getKillNode = function(audioContext, onKill)
{
	var bufferSize = 2048;
	var node 	   = audioContext.createScriptProcessor(bufferSize, 1, 1);


	var hasPlayed  		= false;
	var thresHold  		= 20;
	var maxAmplitude 	= 0;
	var killed 			= false;

	node.onaudioprocess = function(e)
	{
		var input 	= e.inputBuffer.getChannelData(0);
        var output 	= e.outputBuffer.getChannelData(0);
        
        var kill 	= hasPlayed;

        for(var i = 0; i < input.length; i++)
        {
        	var s 	  = input[i];

        	if(s != 0)
        	{
        		hasPlayed = true;
        	}

        	if(s > maxAmplitude)
        	{
        		maxAmplitude = s;
        	}

        	if(s > maxAmplitude / thresHold)
        	{
        		kill = false;
        	}

            output[i] = s;
        }

        if(kill && !killed)
        {
        	onKill(node);
        	killed = true;
        }

	};

	return node;
};

var getADSR = function(audioContext, options)
{
	options = options || {};

	var gain = audioContext.createGain();
	gain.gain.value = 0;

	var vmax  	= options.vmax || 1;
	var vplat 	= options.plat || 0.7;
	var a  		= options.a    || 20;
	var d 		= options.d    || 100;
	var r 		= options.s    || 100;

	gain.prepare = function(freq, duration)
	{
		var s = Math.max(0, duration - a - d - r);

		var t = audioContext.currentTime;
		gain.gain.setValueAtTime(gain.gain.value, t);

		gain.gain.linearRampToValueAtTime(vmax	, t+=a/1000);
		gain.gain.linearRampToValueAtTime(vplat	, t+=d/1000);
		gain.gain.linearRampToValueAtTime(vplat , t+=s/1000);
		gain.gain.linearRampToValueAtTime(0   	, t+=r/1000);
	};

	return gain;
};

var SimpleSine = function(audioContext)
{
	var osc  = audioContext.createOscillator();

	var gain = audioContext.createGain();
	gain.gain.value = 0.6;

	var envelope = getADSR(audioContext);
	
	osc.connect(gain);
	gain.connect(envelope);

	this.getOutput = function()
	{
		return envelope;
	};

	this.play = function(freq, duration)
	{
		envelope.prepare(freq, duration);
		osc.frequency.value = freq;
		osc.start(0);
	};

	this.stop = function()
	{
		this.clean();
	};

	this.clean = function()
	{
		osc.stop(0);
	};

};

var TestStrument = function(audioContext)
{
	var oscs = [];

	var gain = audioContext.createGain();
	gain.gain.value = 0.1;

	for(var i in [0, 1, 2])
	{
		var osc = audioContext.createOscillator();
		osc.connect(gain);
		osc.type = OscillatorNode.SAWTOOTH;

		oscs.push(osc);
	}


	var envelope = getADSR(audioContext);
	gain.connect(envelope);

	this.getOutput = function()
	{
		return envelope;
	};

	this.play = function(freq, duration)
	{
		envelope.prepare(freq, duration);
		
		oscs[0].frequency.value = freq  - (freq / 24)*0.01;
		oscs[1].frequency.value = freq;
		oscs[2].frequency.value = freq  + (freq / 24)*0.13;
		

		for(var i in [0, 1, 2])
		{
			oscs[i].start(0);
		}
	};

	this.stop = function()
	{
		this.clean();
	};

	this.clean = function()
	{
		for(var i in [0, 1, 2])
		{
			oscs[i].stop(0);
		}
	};

};