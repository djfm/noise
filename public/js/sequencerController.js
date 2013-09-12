var SequencerController = function($scope)
{
	for(var i in songs)
	{
		$scope.load_name = i;
		break;
	}

	$scope.songs = songs;
	$scope.save_as_name = $scope.load_name;

	$scope.addTrack = function(){
		sequencerView.addTrack(new Track({name: "hi"}));
	};

	$scope.saveSongAs = function(name)
	{
		$scope.songs[name] = sequencerView.song.serialize();
		localStorage.setItem('songs', JSON.stringify($scope.songs));
	};

	$scope.loadSong = function(name)
	{
		sequencerView.setSong(Song.deserialize($scope.songs[name]));
		$scope.save_as_name = name;
	};
};