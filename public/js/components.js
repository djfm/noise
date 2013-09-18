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

var getADSR = function(audioContext)
{
	var gain = audioContext.createGain();
	gain.gain.value = 0;

	var vmax  	= 1;
	var vplat 	= 0.9;
	var a  		= 0.1;
	var d 		= 0.1;
	var r 		= 0.2;

	gain.prepare = function(freq, duration)
	{
		var s = Math.max(0, duration / 1000 - a - d - r);

		var t = audioContext.currentTime;
		gain.gain.setValueAtTime(gain.gain.value, t);

		gain.gain.linearRampToValueAtTime(vmax	, t+=a);
		gain.gain.linearRampToValueAtTime(vplat	, t+=d);
		gain.gain.linearRampToValueAtTime(vplat , t+=s);
		gain.gain.linearRampToValueAtTime(0   	, t+=r);
	};

	return gain;
};

var SimpleSine = function(audioContext)
{
	var osc  = audioContext.createOscillator();

	var gain = audioContext.createGain();
	gain.gain.value = 0.2;

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
		
	};

	this.clean = function()
	{
		osc.stop(0);
	};

};

var TestStrument = function(audioContext)
{
	var osc  = audioContext.createOscillator();
	osc.type = 1;

	var gain = audioContext.createGain();
	gain.gain.value = 0.2;

	var filter = audioContext.createBiquadFilter();

	filter.gain.value 		= 1;
	filter.detune.value 	= 0;
	filter.type 			= 'lowpass';

	var envelope = getADSR(audioContext);
	
	osc.connect(gain);
	gain.connect(filter);
	filter.connect(envelope);

	this.getOutput = function()
	{
		return envelope;
	};

	this.play = function(freq, duration)
	{
		filter.frequency.value 	= 2*freq;
		envelope.prepare(freq, duration);
		osc.frequency.value = freq;

		osc.start(0);
	};

	this.stop = function()
	{
		
	};

	this.clean = function()
	{
		osc.stop(0);
	};

};