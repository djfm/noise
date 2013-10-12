app.controller('SongController', function($scope, $http, loginInfo)
{
	$scope.loggedIn = loginInfo.loggedIn;

	$scope.songs 	= [];

	loginInfo.onLogin('fetch my songs', function(){
			$http.get('/my-songs').then(function(reply){
			$scope.songs = reply.data;
		});
	});

	$scope.saveAs 	= function()
	{
		if($scope.saveAsName)
		{
			sequencerView.model.name = $scope.saveAsName;
			var data = sequencerView.model.serialize();
			$http.post('/songs/', {name: $scope.saveAsName, data: data})
			.then(function(reply){
				if(reply.data.success === false)
				{
					loginInfo.logout();
				}
				else
				{
					if($scope.songs.indexOf($scope.saveAsName) === -1)
					{
						$scope.songs.push($scope.saveAsName);
					}
				}
			});
		}
	};

	$scope.load = function()
	{
		$http.get('/my-songs/'+encodeURIComponent($scope.songToLoad)).then(function(reply){
			var song = Song.deserialize(reply.data.jsonData);

			sequencerView.setModel(song);
		});

		$scope.saveAsName = $scope.songToLoad;
	};
});