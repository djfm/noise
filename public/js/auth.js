app.controller('Auth', function($scope, $http, loginInfo)
{
	$scope.formHidden 	= 'hidden';

	$scope.usernameAvailable = true;
	$scope.emailAvailable 	 = true;
	
	$scope.loggedIn = loginInfo.loggedIn;
	$scope.getUsername = loginInfo.getUsername;

	$scope.showRegisterFields = function()
	{
		$scope.showForm();
		$scope.registering = true;
	};

	$scope.hideRegisterFields = function()
	{
		$scope.showForm();
		$scope.registering = false;
	};

	$scope.showForm = function()
	{
		$scope.formHidden = 'not-hidden';
	};

	$scope.checkUserName = function()
	{
		if($scope.registering && $scope.username)
		{
			$http
				.get('/username/available/'+$scope.username)
				.then(function(reply){
					$scope.usernameAvailable = reply.data.available;
				});
		}
	};

	$scope.checkEmail = function()
	{
		if($scope.registering && $scope.email)
		{
			$http
				.get('/email/available/'+$scope.email)
				.then(function(reply){
					$scope.emailAvailable = reply.data.available;
				});
		}
	};

	$scope.confirmIsValid = function()
	{
		if(!$scope.password || !$scope.confirm)
		{
			return 0;
		}
		else
		{
			return $scope.password === $scope.confirm ? 1 : -1;
		}
	};

	$scope.submit = function()
	{
		if($scope.registering && $scope.confirmIsValid() !== 1)
		{
			return;
		}

		var params = {
			username: $scope.username,
			email: $scope.email,
			password: $scope.password
		};

		
		var url = $scope.registering ? '/register' : '/login';
		
		$http.post(url, params).then(function(reply){
			if(reply.data.success)
			{
				loginInfo.login($scope.username);
			}
		});
		
	};

	$scope.logout = function()
	{
		$http.get('/logout').then(function(){
			loginInfo.logout();
		});
	};

});