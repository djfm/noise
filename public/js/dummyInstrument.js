var DummyInstrument = function()
{
	/*
	* Play a note at the given frequency for the given duration
	*/
	function sing(frequency, duration)
	{
		console.log("Note on at", frequency+"Hz for", duration+"ms");
	}
};