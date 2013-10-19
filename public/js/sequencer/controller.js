function SequencerController($scope, sequencer)
{
	$scope.history 		= sequencer.sequencerHistory;
	$scope.cellHeight 	= sequencer.sequencerCellHeight;
	$scope.handles 		= sequencer.getTrackHandles;

	sequencer.updateSequencerScope = function()
	{
		$scope.$apply();
	};

	$scope.loadHistoryItem = sequencer.loadSequencerHistoryItem;

	$scope.activateTrack = sequencer.activateTrack;

	$scope.handleDropped = function(on, what)
	{
		what = parseInt(what);

		sequencer.swapTracks(on, what);
	};

	$scope.activeTrack = sequencer.activeTrack;

	$scope.removeTrack = sequencer.removeTrack;

	$scope.addTrack = sequencer.addTrack;

	$scope.instruments = sequencer.instruments;

	$scope.trackConfigChanged = sequencer.trackConfigChanged;

	$scope.renameTrack = function()
	{
		if($scope.renamingTrack === true)
		{
			$scope.renamingTrack = false;
			sequencer.trackConfigChanged();
		}
		else
		{
			$scope.renamingTrack = true;
		}
	};

	$scope.play = sequencer.play;
	$scope.stop = sequencer.stop;

	if(listenTo)
	{
		sequencer.play();
	}
};

$('#sequencer-view-container').scroll(function(e){
	$('#sequencer-track-handles-container').scrollTo({
		top: $(e.target).scrollTop(),
		left: 0
	}, 0);
});

app.service('sequencer', function(){
	// This looks stupid, but it actually lets me see immediately when
	// I break the Song serialization functions :)
	var song 	= Song.deserialize(listenTo || (new Song()).serialize());

	var service = {};
	var playStatus = 0;

	var patternView = new PatternView({
				container: 'pattern-view-container',
				sequencerService: service,
			});

	var sequencerView = new SequencerView({
		container: 'sequencer-view-container',
		patternView: patternView,
		cellWidth: 50,
		cellHeight: 38,
		markColor: '#333',
		sequencerService: service,
	});

	sequencerView.setModel(song);

	service.patternHistory = function()
	{
		if(patternView.model)
		{
			return patternView.model.history;
		}
		else
		{
			return [];
		}
	};

	service.sequencerHistory = function()
	{
		if(sequencerView.model)
		{
			return sequencerView.model.history;
		}
		else
		{
			return [];
		}
	};

	service.getTrackHandles = function()
	{
		if(sequencerView.model)
		{
			return sequencerView.model.getTrackConfigs();
		}
		else
		{
			return [];
		}
	};

	service.loadPatternHistoryItem = function(h, event)
	{
		$('div.pattern-history.selected').removeClass('selected');
		$(event.target).closest('div.pattern-history').addClass('selected');
		patternView.loadSnapshot(h);
	};

	service.loadSequencerHistoryItem = function(index, h, event)
	{
		sequencerView.model.history.at = index;
		$('div.sequencer-history.selected').removeClass('selected');
		$(event.target).closest('div.sequencer-history').addClass('selected');
		sequencerView.loadSnapshot(h);
	};

	service.activateTrack = function(index)
	{
		sequencerView.activateTrack(index);
	};

	service.activeTrack = function()
	{
		if(sequencerView.model)
		{
			return sequencerView.model.tracks[sequencerView.model.activeTrack].config;
		}
		else return undefined;
	};

	service.removeTrack = function(id)
	{
		sequencerView.removeTrack(id);
	};

	service.addTrack = function()
	{
		sequencerView.addTrack();
	};

	service.loadSong = function(song)
	{
		sequencerView.setModel(song);
	};

	service.getSong = function()
	{
		return sequencerView.model;
	};

	service.patternChanged = function(h, options)
	{
		sequencerView.patternChanged(h, options);
	};

	service.trackConfigChanged = function()
	{
		sequencerView.trackConfigChanged();
	};

	service.instruments = function()
	{
		return ["SimpleSine", "TestStrument", "TripleOscillator"];
	};

	service.play = function(){

		sequencerView.play(function(){
			playStatus = 2;
			var startedAt = (new Date()).getTime();
			var animate   = function(){
				if(playStatus === 0)return;
				var at = (new Date()).getTime() - startedAt;
				sequencerView.updateBar(at);
				requestAnimFrame(animate);
			}
			requestAnimFrame(function(){
				animate();
			});
		});
	};

	service.stop = function(){
		playStatus = 0;
		sequencerView.stop();
		sequencerView.updateBar(0);
	};

	service.swapTracks = sequencerView.swapTracks;
	
	service.sequencerCellHeight = sequencerView.cellHeight
	
	return service;
});