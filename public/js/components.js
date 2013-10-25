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
	var r 		= options.r    || 100;

	gain.prepare = function(freq, duration, msOffset)
	{
		if(msOffset === undefined)
		{
			msOffset = 0;
		}

		var s = Math.max(0, duration - a - d - r);

		var t = audioContext.currentTime + msOffset/1000;
		gain.gain.setValueAtTime(gain.gain.value, t);

		gain.gain.linearRampToValueAtTime(vmax	, t+=a/1000);
		gain.gain.linearRampToValueAtTime(vplat	, t+=d/1000);
		gain.gain.linearRampToValueAtTime(vplat , t+=s/1000);
		gain.gain.linearRampToValueAtTime(0   	, t+(duration+r)/1000);
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
	gain.connect(envelope, {a: 50, d: 15, r:15});

	this.getOutput = function()
	{
		return envelope;
	};

	this.play = function(freq, msDuration, msWhen)
	{
		if(msWhen === undefined)
		{
			msWhen = 0;
		}
		envelope.prepare(freq, msDuration, msWhen);
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

var WaveShape = {};

WaveShape.sine = function(fraction)
{
	return Math.sin(2*Math.PI*fraction);
}

WaveShape.moogSaw = function(fraction)
{
	if(fraction < 0.5)
	{
		return -1 + fraction * 4;
	}
	else
	{
		return 1 - 2 * fraction;
	}
};

WaveShape.sawtooth = function(fraction)
{
	return -1 + 2*fraction;
};

WaveShape.triangle = function(fraction)
{
	if(fraction <= 0.25)
	{
		return fraction * 4;
	}
	else if(fraction <= 0.75)
	{
		return 2 - fraction * 4;
	}
	else
	{
		return fraction * 4 - 4;
	}
};

WaveShape.square = function(fraction)
{
	return fraction > 0.5 ? -1 : 1;
};

WaveShape.exponential = function(fraction)
{
	return fraction > 0.5 ? 1 - fraction : -1+8*fraction*fraction;
};

WaveShape.white = function(fraction)
{
	return Math.random();
}

var TripleOscillator = function(audioContext)
{
	var source = audioContext.createBufferSource();
	

	var gain = audioContext.createGain();
	gain.gain.value = 0.2;

	source.connect(gain);

	this.play = function(freq, duration)
	{
		source.buffer = TripleOscillator.buffers[freq][duration];
		source.start(0);
	};

	this.getOutput = function()
	{
		return gain;
	};

	this.stop = function()
	{

	};
};

TripleOscillator.buffers = {};

TripleOscillator.prepare = function(audioContext, freq, msDuration, msWhen)
{
	if(!TripleOscillator.buffers[freq])TripleOscillator.buffers[freq] = {};
	if(TripleOscillator.buffers[freq][msDuration])return;

	var buffer = audioContext.createBuffer(2, (msDuration)/1000*audioContext.sampleRate ,audioContext.sampleRate);

	var oscs = [
		{
			waveShape: 'moogSaw',
			Vol: 0.33,
			Crs: 0,
			FL: -4,
			FR: 10
		},
		{
			waveShape: 'triangle',
			Vol: 0.33,
			Crs: 0,
			FL: 2,
			FR: 4,
		},
		{
			waveShape: 'sawtooth',
			Vol: 0.33,
			Crs: 0,
			FL: 2,
			FR: 4,
		}
	];

	function detune(freq, coarse, fine)
	{
		return freq * Math.pow(2, (coarse*100+fine)/1200);
	};

	var data = [buffer.getChannelData(0), buffer.getChannelData(1)];
	for(var i=0; i<buffer.length; i++)
	{
		function fraction(freq)
		{
			var f = (i * freq) / audioContext.sampleRate;
			return f - Math.floor(f);
		};

		var vols  = [];
		var fracs = [];

		for(var o in oscs)
		{
			var fl = fraction(detune(freq, oscs[o].Crs, oscs[o].FL));
			var fr = fraction(detune(freq, oscs[o].Crs, oscs[o].FR));

			vols[o] = [
				WaveShape[oscs[o].waveShape](fl),
				WaveShape[oscs[o].waveShape](fr)
			];

			fracs[o] = [
				fl,
				fr
			];
		}

		var osc01 = [
			oscs[1].Vol * WaveShape[oscs[1].waveShape](fracs[0][0] + fracs[1][0]),
			oscs[1].Vol * WaveShape[oscs[1].waveShape](fracs[0][1] + fracs[1][1]),	
		];

		var osc12 = [
			oscs[1].Vol * vols[1][0] + oscs[2].Vol * vols[2][0],
			oscs[1].Vol * vols[1][1] + oscs[2].Vol * vols[2][1]
		]

		data[0][i] =  osc01[0] + osc12[0];
		data[1][i] =  osc01[1] + osc12[1]; 

		/*data[0][i] = WaveShape.moogSaw(fraction);
		data[1][i] = WaveShape.moogSaw(fraction);*/
	}

	TripleOscillator.buffers[freq][msDuration] = buffer;

};



var TOSC = function()
{

};

TOSC.getPreset = function(name)
{
	var preset = TOSC.presets[name];
	
	var instrument = function()
	{
		var source = audioContext.createBufferSource();

		var gain = audioContext.createGain();
		gain.gain.value = 0.2;

		source.connect(gain);

		this.play = function(freq, duration)
		{
			source.buffer = TOSC.buffers[preset][freq][duration];
			source.start(0);
		};

		this.getOutput = function()
		{
			return gain;
		};

		this.stop = function()
		{

		};
	};

	instrument.prepare = function(audioContext, freq, msDuration, msWhen)
	{
		TOSC.prepare(audioContext, preset, freq, msDuration, msWhen);
	};

	return instrument;
};

TOSC.buffers = {};

TOSC.prepare = function(audioContext, preset, freq, msDuration, msWhen)
{
	if(!TOSC.buffers[preset])TOSC.buffers[preset] = {};
	if(!TOSC.buffers[preset][freq])TOSC.buffers[preset][freq] = {};
	if(TOSC.buffers[preset][freq][msDuration])return;

	var buffer = audioContext.createBuffer(2, (msDuration)/1000*audioContext.sampleRate ,audioContext.sampleRate);

	function detune(freq, coarse, fine)
	{
		return freq * Math.pow(2, (coarse*100+fine)/1200);
	};

	function fraction(phi)
	{
		return phi - Math.floor(phi);
	};

	function absFraction(phi)
	{
		return (phi - (phi >= 0 ? Math.floor(phi) : Math.floor(phi) - 1));
	};

	var oscs = [];

	function pan(channel, panning, volume)
	{
		if(channel === 0)
		{
			return volume * (1-panning);
		}
		else
		{
			return volume * (1+panning);
		}
	};

	for(var o in preset.oscs)
	{
		oscs[o] 	= [];

		oscs[o][0] 	= {
			coeff: detune(freq, preset.oscs[o].Crs, preset.oscs[o].FL) / audioContext.sampleRate,
			vol: pan(0, (preset.oscs[o].Pan || 0), preset.oscs[o].Vol),
			getSample: function(phase){
				return WaveShape[preset.oscs[o].waveShape](fraction(phase));
			}
		};
		oscs[o][1] 	= {
			coeff: detune(freq, preset.oscs[o].Crs, preset.oscs[o].FR) / audioContext.sampleRate,
			vol: pan(1, (preset.oscs[o].Pan || 0), preset.oscs[o].Vol),
			getSample: function(phase){
				return WaveShape[preset.oscs[o].waveShape](fraction(phase));
			}
		};

		var PO  = preset.oscs[o].PO  || 0;
		var SPD = preset.oscs[o].SPD || 0;

		oscs[o][0].phase_offset = (PO + SPD)/360;
		oscs[o][1].phase_offset = PO/360;

		oscs[o][0].phase = oscs[o][0].phase_offset;
		oscs[o][1].phase = oscs[o][1].phase_offset;
	}

	var data = [buffer.getChannelData(0), buffer.getChannelData(1)];

	for(var i=0; i<buffer.length; i++)
	{
		var sample = [0,0];


		for(o=oscs.length-1; o>=0; o--)
		{
			if(o === oscs.length - 1)
			{
				for(var c in sample)
				{
					sample[c] = oscs[o][c].vol * oscs[o][c].getSample(oscs[o][c].phase);
					oscs[o][c].phase += oscs[o][c].coeff;
				}
			}
			else if(preset.oscs[o].mod === 'Mix')
			{
				for(var c in sample)
				{
					sample[c] += oscs[o][c].vol * oscs[o][c].getSample(oscs[o][c].phase);
					oscs[o][c].phase += oscs[o][c].coeff;
				}
			}
			else if(preset.oscs[o].mod === 'AM')
			{
				for(var c in sample)
				{
					sample[c] *= oscs[o][c].vol * oscs[o][c].getSample(oscs[o][c].phase);
					oscs[o][c].phase += oscs[o][c].coeff;
				}
			}
			else if(preset.oscs[o].mod === 'PM')
			{
				for(var c in sample)
				{
					sample[c] = oscs[o][c].vol * oscs[o][c].getSample(absFraction(sample[c] + oscs[o][c].phase));
					oscs[o][c].phase += oscs[o][c].coeff;
				}
			}
			else if(preset.oscs[o].mod === 'FM')
			{
				for(var c in sample)
				{
					oscs[o][c].phase += sample[c];
					sample[c] = oscs[o][c].vol * oscs[o][c].getSample(oscs[o][c].phase);
					oscs[o][c].phase += oscs[o][c].coeff;
				}
			}
			else if(preset.oscs[o].mod === 'Sync')
			{
				for(var c in sample)
				{
					var sub_osc_coeff = oscs[o+1][c].coeff;
					var coeff 		  = oscs[o][c].coeff;

					var sync_ok = Math.floor(oscs[o+1][c].phase + oscs[o+1][c].coeff) > Math.floor(oscs[o+1][c].phase);

					if(sync_ok)
					{
						oscs[o][c].phase = oscs[o][c].phase_offset;
					}

					sample[c] = oscs[o][c].vol * oscs[o][c].getSample(oscs[o][c].phase);
					oscs[o][c].phase += coeff;
				}
			}
		}

		for(var c in sample)
		{
			data[c][i] = 4*sample[c];
		}
	}

	TOSC.buffers[preset][freq][msDuration] = buffer;

};

TOSC.presets = {
	Test:{
		oscs: [
			{
				waveShape: 'moogSaw',
				Vol: 0.33,
				Crs: 0,
				FL: -4,
				FR: 10,
				mod: 'PM'
			},
			{
				waveShape: 'triangle',
				Vol: 0.33,
				Crs: 0,
				FL: 2,
				FR: 4,
				mod: 'Mix'
			},
			{
				waveShape: 'sawtooth',
				Vol: 0.33,
				Crs: 0,
				FL: 2,
				FR: 4,
			}
		]
	}
};

function getInstrument(name)
{
	var path = name.split("::");
	var klass = window[path[0]];

	if(path.length === 2)
	{
		return klass.getPreset(path[1]);
	}
	else return klass;
};