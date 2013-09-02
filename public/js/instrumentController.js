var instrumentController = function($scope)
{
	var stage = new Kinetic.Stage({
	  container: 'instrument',
	  width: $('#instrument').innerWidth(),
	  height: 300
	});

	// Hold various info needed by the controller but not angularJS related
	var state = {focusedAnchor: null, nodes: {}, nodesCreated: 0, selectedSource: null};

	var nodesLayer = new Kinetic.Layer();
	stage.add(nodesLayer);

	$scope.infoText = "hi!";

	var Controller = function()
	{
		this.createNode = function(options)
		{
			var node = new soundNode({
				id: state.nodesCreated,
				node_type: options.node_type || 'oscillator'
			});
			state.nodesCreated += 1;
			state.nodes[node.id] = node;

			options.controller 	= this;
			options.model 		= node;
			var view  = new nodeView(options);
			view.model = node;
			node.view  = view;

			return node;
		};

		this.drawConnection = function(x1, y1, x2, y2)
		{
			var grad = nodesLayer.getContext().createLinearGradient(x1, y1, x2, y2);
			grad.addColorStop(0, 'black');
			grad.addColorStop(1, 'green');

			var line = new Kinetic.Line({
	              points: [x1, y1, x2, y2],
	              width: 4,
	              strokeWidth: 3,
	              stroke: grad
	            });
			return line;
		}

		this.redrawConnection = function(line, x1, y1, x2, y2)
		{
			var grad = nodesLayer.getContext().createLinearGradient(x1, y1, x2, y2);
			grad.addColorStop(0, 'black');
			grad.addColorStop(1, 'green');
			line.setPoints([x1, y1, x2, y2]);
			line.setStroke(grad);
			return line;
		};

		this.connect = function(options)
		{
			//Connect the underlying audio nodes

			if(options.fromId != undefined && options.toId != undefined)
			{
				var from = state.nodes[options.fromId];
				var to 	 = state.nodes[options.toId];

				from.outputs[to.id] = options.fromAnchor ? options.fromAnchor.anchor_id : null;
				to.inputs[from.id]  = options.toAnchor ? options.toAnchor.anchor_id : null;

			}

			// Connect the views
			if(options.fromAnchor && options.toAnchor)
			{
				var fromPos = options.fromAnchor.getAbsolutePosition();
				var toPos   = options.toAnchor.getAbsolutePosition();

	            var line = this.drawConnection(fromPos.x, fromPos.y, toPos.x, toPos.y);

	            var connection = {line: line, from: state.nodes[options.fromId].view, to: state.nodes[options.toId].view};
	            options.fromAnchor.connection = connection;
	            options.toAnchor.connection = connection;
	            options.fromAnchor.setFill(connection.from.anchorDefaultColor);

	            nodesLayer.add(line);
	            line.moveToBottom();

	            connection.from.outputs[options.toId] = {line: line, from: options.fromAnchor, to: options.toAnchor};
	            connection.to.inputs[options.fromId]  = connection.from.outputs[options.toId];
	            
	            nodesLayer.draw();

	            state.focusedAnchor 	= null;
	            state.selectedSource 	= null;
			}
		};

		this.disconnect = function(options)
		{
			var from 	= state.nodes[options.fromId];
			var to 		= state.nodes[options.toId];

			delete from.outputs[to.id];
			delete to.inputs[from.id];

			if(from.view)
			{
				var connection = from.view.outputs[to.id];
				connection.line.remove();
				delete connection.from.connection;
				delete connection.to.connection;
				delete from.view.outputs[to.id];
				delete to.view.inputs[from.id];
				nodesLayer.draw();
			}
		};

		this.makeAndConnect = function(i, cache)
		{
			
			// Only generate implementations once per node per instrument
			var impl 		= cache.nodes[i] || state.nodes[i].getNode();
			cache.nodes[i] 	= impl;

			for(var o in state.nodes[i].outputs)
			{
				if(!cache.connections[[i,o]])
				{
					cache.connections[[i,o]] = true;
					impl.connect(this.makeAndConnect(o, cache));
				}
			}

			return impl;
			
		};

		this.makeInstrument = function()
		{
			var oscillators = [];
			var cache  		= {nodes: {}, connections: {}};

			for(var i in state.nodes)
			{
				if(state.nodes[i].node_type == 'oscillator')
				{
					oscillators.push(this.makeAndConnect(i, cache));
				}
			}

			return oscillators;
		};

		this.serializeInstrument = function()
		{
			var nodes = {};
			for(var i in state.nodes)
			{
				nodes[i] = state.nodes[i].prepareForSerialize();
			}
			return JSON.stringify(nodes);
		};

		this.loadInstrument = function(json)
		{
			nodesLayer.destroyChildren();
			var tmp_nodes = JSON.parse(json);
			var nodes = {};
			for(var i in tmp_nodes)
			{
				var node = new soundNode({});
				node.loadFromObject(tmp_nodes[i]);
				nodes[i] = node;
			}
			state = {focusedAnchor: null, nodes: nodes, nodesCreated: 0, selectedSource: null};

			for(var i in state.nodes)
			{
				var options 		= {
					scope: $scope,
					controller: this,
					model: state.nodes[i],
					layer: nodesLayer,
					global_state: state
				};
				var view  			= new nodeView(options);
				view.model 			= state.nodes[i];
				state.nodes[i].view = view;

				if(state.nodes[i].id >= state.nodesCreated)
				{
					state.nodesCreated = state.nodes[i].id + 1;
				}

				
			}

			for(var i in state.nodes)
			{
				for(var j in state.nodes[i].outputs)
				{
					var fromAnchor = state.nodes[i].view.anchors[state.nodes[i].outputs[j]];
					var toAnchor   = state.nodes[j].view.anchors[state.nodes[j].inputs[i]];
					this.connect({fromId: i, toId: j, fromAnchor: fromAnchor, toAnchor: toAnchor});
				}
			}

			nodesLayer.draw();
		};

	};

	var controller = new Controller();
	dbg_controller = controller;
	dbg_state 	   = state;

	$scope.presets = JSON.parse(localStorage.getItem('presets')) || {};

	$scope.score = localStorage.getItem('score') || "";

	$scope.addNode = function(node_type)
	{
		controller.createNode({
			node_type		: node_type,
			scope			: $scope,
			layer 			: nodesLayer,
			global_state	: state
		})		
	};

	function playNote(oscillators, freq, duration)
	{
		for(var i in oscillators)
		{
			var osc = oscillators[i];
			osc.frequency.value = freq;
			osc.start(0);
			setTimeout(function(){
				osc.stop(0);
			}, duration);
		}
	};

	$scope.bleep = function()
	{
		var oscillators = controller.makeInstrument();
		playNote(oscillators, 440, 1000);
	};

	$scope.dt   = 500;
	$scope.play = function(score)
	{
		localStorage.setItem('score', score);

		var exp = /(?:\[\w+\])|(?:\(\w+\))|\w|\s/g;

		var beats = score.match(exp);
		var n = 0;

		console.log("Playing:", beats);

		function start()
		{
			if(n < beats.length)
			{
				var what = beats[n];
				n += 1;

				if(what != "\n")
				{
					var notes = [];

					if(m = /^\w$/.exec(what))
					{
						notes.push(what);
					}
					else if(m = /^\((\w+)\)$/.exec(what))
					{
						for(var i=0; i < m[1].length; i+=1)
						{
							notes.push(m[1][i]);
						}
					}
					else if(what == " ")
					{
						// Silence is sexy
					}
					else
					{
						console.log("Not playable:", what);
					}

					for(var note in notes)
					{
						var oscillators = controller.makeInstrument();
						playNote(oscillators, getFreq(notes[note]), $scope.dt);
					}
					
					setTimeout(function(){start()}, $scope.dt);
				}
				else
				{
					start();
				}
			}
		};
		start();
	}

	$scope.savePreset = function(name)
	{
		$scope.presets[name] = controller.serializeInstrument();
		localStorage.setItem('presets', JSON.stringify($scope.presets));
	};

	$scope.loadPreset = function(name)
	{
		controller.loadInstrument($scope.presets[name]);
	};

	if($scope.presets['default'])
	{
		controller.loadInstrument($scope.presets['default']);
	}

};