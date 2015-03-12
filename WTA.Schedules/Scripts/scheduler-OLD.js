var selectedDirection = 0;
var selectedRoute, selectedRouteId, trip_headsign, service_id;

function flipRoute() {
	if (selectedDirection == 0) {
		selectedDirection = 1;
	} else {
		selectedDirection = 0;
	}
	$('#busTable').empty();
	$('.routeNumber').empty();
	displaySelectedRoute(selectedRouteId, service_id, selectedDirection);
	if (trip_headsign === -1) {
		$('.routeNumber').append('There is no service for the specified route and time.');
	} else {
		$('.routeNumber').append('Route ' + selectedRoute + ' to ' + trip_headsign);
	}
	customizeStopListStart();
}
function thisDay(day) {
	$('#dayTabs div').removeClass('selectedDay');
	if (day == 'Weekday' || day=='Monday' || day=='Tuesday' || day=='Wednesday' || day=='Thursday' || day=='Friday') {
		service_id = 1;
		$('#Weekday').addClass('selectedDay');
	} else if (day == 'Saturday') {
		service_id = 2;
		$('#Saturday').addClass('selectedDay');
	} else if (day == 'Sunday') {
		service_id = 3;
		$('#Sunday').addClass('selectedDay');
	}
	$('#busTable').empty();
	$('.routeNumber').empty();
	displaySelectedRoute(selectedRouteId, service_id, selectedDirection);
	if (trip_headsign === -1) {
		$('.routeNumber').append('There is no service for the specified route and time.');
	} else {
		$('.routeNumber').append('Route ' + selectedRoute + ' to ' + trip_headsign);
	}
	customizeStopListStart();
}
function displaySelectedRoute(selectedRouteId, service_id, selectedDirection) {
	//define options:
		//	Make a tripsInRoute array using the following arguments:
		//1) Route- selected by route_id, passed to func via selectedRoute -- 
		//2) Direction- 0 selected by default, flip route button fires flipRoute function changing between 0,1. Filter by trips.direction_id.
		//3) Service_id- comes from the trips file. trips.service_id. Grab this from the tripsInRoute array.
		// Is there a way to sort the tripsInRoute array? Sort the tr's after the table has been made based on the time in td cell 1? <--
		
		// Use this tripsInRoute array to extrapolate the rest of what we need to fill the table.
		//4) trip headsign- Select first tripsInRoute[0].trip_headsign.
		//***5) unique list of all of the stop names in a route. this will be used to determine how many columns the table has and the names that go in the header row.
			//5a) To do this, we will need an array of all of the stop_times in the route
			//5b) Then we will need an array of the unique stops from the array from step 5a.
		//6) stop times in each trip, sorted by stop_times.stop_sequence. Use this to populate td cells in the trip's row. Also append an id = to the stop_id to each td cell.
			//6a) To do this, we use the array from step 5a, filter it by trip_id, and sort it by stop_sequence
			//6b) Compare the stop_id from the respective td cell in the header with the current stop_id to determine if the stop is skipped or written. *Use two counter vars.
    //7) Sort the tr's by checking the first td's value of each row to ensure they are in chronological order.

    // -- Test of linq.js --

    // Get Trips
    var myTrips = Enumerable.From(trips)
        .Where(function (x) { return x.route_id == selectedRouteId && x.direction_id == selectedDirection && x.service_id == service_id })
        .ToArray();

    var stopTimes2 = Enumerable.From(stop_times)
    .Join(myTrips, "$.trip_id", "$.trip_id", function (a, a_b) { return a })
    //.Distinct(function (x) { return x.stop_id; })
    .ToArray();


    // Get Stop Times
    var stopTimes = Enumerable.From(trips)
        .Where(function (x) { return x.route_id == selectedRouteId && x.direction_id == selectedDirection && x.service_id == service_id })
        .Join(stop_times, "$.trip_id", "$.trip_id", function (a, a_b) { return a_b })
        .Distinct(function (x) { return x.stop_id; })
        .ToArray();

    // Get Stop Names
    var stopNames = Enumerable.From(stopTimes)
        .Join(stops, "$.stop_id", "$.stop_id", function (a, a_b) { return a_b })
        .Distinct(function (x) { return x.stop_id; })
        .Select(function (a_b) { return a_b; })
        .ToArray();








    // Get Trips
	var tripsInRoute = [];
	for (i=0;i<trips.length;i++) {
		if (trips[i].route_id == selectedRouteId && trips[i].direction_id == selectedDirection && trips[i].service_id == service_id) {
			tripsInRoute.push(trips[i]);
		}
	}
	if (tripsInRoute == 0) {
		trip_headsign = -1;
	} else {
		trip_headsign = tripsInRoute[0].trip_headsign;
	}

    // Get Stop Times
	var stopTimesInRoute = [];
	for (i=0;i<tripsInRoute.length;i++) {
		tripStopArray = $.grep(stop_times, function(d) {
			return d.trip_id == tripsInRoute[i].trip_id;
		});
		for (j=0;j<tripStopArray.length;j++) {
			stopTimesInRoute.push(tripStopArray[j]);
		}
	}
	var flags = {};
	var uniqueStopTimesInRoute = stopTimesInRoute.filter(function(entry) {
		if (flags[entry.stop_id]) {
			return false;
		}
		flags[entry.stop_id] = true;
		return true;
	});
	uniqueStopTimesInRoute.sort(function compare(a,b) {
	  if (a.stop_sequence < b.stop_sequence)
	     return -1;
	  if (a.stop_sequence > b.stop_sequence)
	    return 1;
	  return 0;
	});

    // Get unique Stop Names
	var uniqueStopNamesInRoute = [];
	for (i=0;i<uniqueStopTimesInRoute.length;i++) {
		var grepArray = $.grep(stops, function(a) {
			return a.stop_id == uniqueStopTimesInRoute[i].stop_id;
		});
		for (j=0;j<grepArray.length;j++) {
			uniqueStopNamesInRoute.push(grepArray[j]);
		}
	}
    // Testing linq
	var test = 0;
	uniqueStopNamesInRoute = stopNames;
	stopTimesInRoute = stopTimes;


	$('#busTable').append('<tr id="stopNames"></tr>');
	for (i=0;i<uniqueStopNamesInRoute.length;i++) {
		$('#stopNames').append('<td id="'+uniqueStopNamesInRoute[i].stop_id+'">'+uniqueStopNamesInRoute[i].stop_name+'</td>');
	}
	for (i=0;i<tripsInRoute.length;i++) {
		$('#busTable').append('<tr class="tripTimes" id="trip' + tripsInRoute[i].trip_id + '"></tr>');
		var tripId = document.getElementById('trip'+tripsInRoute[i].trip_id);
		var stopTimesInTrip = $.grep(stopTimesInRoute, function(a) {
			return a.trip_id == tripsInRoute[i].trip_id;
		});
		stopTimesInTrip.sort(function (a, b) {
		  return new Date('1970/01/01 ' + a.departure_time) - new Date('1970/01/01 ' + b.departure_time);
		});
		var j=0;
		for (k=0;k<uniqueStopNamesInRoute.length;k++) {
			var columnId = parseInt($('#stopNames td:nth-child('+(k+1)+')').attr('id'));
			if (stopTimesInTrip[j] == undefined) {
				$(tripId).append('<td>--</td>');
			} else if (stopTimesInTrip[j].stop_id == parseInt($('#stopNames td:nth-child('+(k)+')').attr('id'))) {
				j++;
				k--;
			} else if (columnId != stopTimesInTrip[j].stop_id) {
				$(tripId).append('<td>--</td>');
			} else {
				if (stopTimesInTrip[j].departure_time.length == 7) {
					$(tripId).append('<td id="'+stopTimesInTrip[j].stop_id+'">0'+stopTimesInTrip[j].departure_time.slice(0,-3)+'</td>');
				} else {
					$(tripId).append('<td id="'+stopTimesInTrip[j].stop_id+'">'+stopTimesInTrip[j].departure_time.slice(0,-3)+'</td>');
				}
				j++;
			}
		}
	}

	//Remove columns with no data (small bit of built in fault tolerance for the data)
	for (i=0;i<uniqueStopNamesInRoute.length;i++) {
		var colArray = $('#busTable td:nth-child('+(i+1)+')').map(function(){
	       return $(this).text();
	   }).get();
		var counter = 0;
		for (j=1;j<colArray.length;j++) {
			if(colArray[j]=='--') {
				counter++;
			}
		}
		if (counter==(colArray.length-1)) {
			$('#busTable tr').find('td:eq('+i+')').addClass('markedForDeletion');
		}
	}
	$('.markedForDeletion').remove();
	//sort the table rows by the earliest time in each row	
	var tableRows = $('#busTable tr');
	for (i=1;i<tableRows.length;i++) {
		var howMany = $(tableRows[i]).children().length;
		var rowArray = [];
		for(j=0;j<howMany;j++) {
			rowArray.push($('#busTable tr:eq('+i+') td:eq('+j+')').text());
		}
		rowArray = rowArray.filter(function(n){ return n != '--' });
		rowArray.sort();
		$('#busTable tr:eq('+i+')').attr('value', rowArray[0]);
	}
	var $table = $('#busTable');
	var rows = $('#busTable > tbody > tr').not(':first');
	rows.sort(function(a, b) {
	    var keyA = $(a).attr('value');
	    var keyB = $(b).attr('value');
	    if (keyA > keyB) return 1;
	    if (keyA < keyB) return -1;
	    return 0;
	});
	$.each(rows, function(index, row) {
	    $table.children('tbody').append(row);
	});
	customizeStopListStart();
}


function customizeStopListStart() {
	$('#stopListStart').empty();
	$('#stopListStart').append('<option value="selectStopListStart" disabled>Starting Bus Stop</option>');
	var availableStops = $('#busTable tr:eq('+0+') td');
	var startingOptions = '';
	for (i=0;i<availableStops.length;i++){
		startingOptions += '<option value="'+ availableStops[i].innerHTML + '" id="' + availableStops[i].id + '">' + availableStops[i].innerHTML + '</option>';
	}
	$('#stopListStart').append(startingOptions)
						.trigger('change');

	var firstTime = $('#busTable tr:eq('+1+') td:first')[0].innerHTML;
	var lastTime = $('#busTable tr:last td:last')[0].innerHTML;
	$('#startTime').attr('value',firstTime);
	$('#endTime').attr('value',lastTime);
}
function applyFilter() {
	clearFilter();
	var filterStart = '#'+$('#stopListStart').children(":selected").attr("id");
	var filterEnd = '#'+$('#stopListEnd').children(":selected").attr("id");
	var startCells = $('#busTable td').not(filterStart+', '+filterEnd);
	startCells.hide();
	var timeStart = $('#startTime').val();
	var timeEnd = $('#endTime').val();
	//select all cells where innerHTML < timeStart && innerHTML > timeEnd and hide them
	var cellsRemaining = $('#busTable td').filter(function() {
		
	});
	
	//timeCells.hide();
}
function clearFilter() {
	$('#busTable td:hidden').show();
}
function printDiv(divName) {
     var printContents = document.getElementById(divName).innerHTML;
     var originalContents = document.body.innerHTML;
     document.body.innerHTML = printContents;
     window.print();
     document.body.innerHTML = originalContents;
}