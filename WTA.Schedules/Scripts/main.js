// locals
var currentRouteID, currentRouteNumber, currentStopID, routeList, map,
    trip_headsign, servedByRoutes, servedByRoutesMap, finalStops, finalStopsMap, specialServiceDate,
    map, busLayer, mapOptions, currentLocation, mapStyles, geocoder, kmlStopCode, kmlStopName, kmlStopId,
    stopIdVariable, bounds, panorama, stopNameVariable, stopVariable, stopQuery;
var currentDirectionID = 0;
var currentServiceID = 1; // Weekdays
var entryPanoId = null;
var searchURL = "http://branding.marquamgroup.local/sites/search/pages/results.aspx?k=";
var markers = [];

$(document).ready(function () {    
    window.onpopstate = onPopState;
    $(window).on('hashchange', function () {
        loadPageContent();
    });
    loadMain();
});

function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
function loadQueryParams() {
    //RouteId
    var r = getQueryParameterByName("routeId");
    if (r && (r == parseInt(r))) {
        currentRouteID = r;
    }
    else {
        currentRouteID = null;
    }
    //StopId
    var s = getQueryParameterByName("stopId");
    if (s && (s == parseInt(s))) {
        currentStopID = s;
    }
    else {
        currentStopID = null;
    }
    // Stop query - used if searching for either a stop id or an address
    var q = getQueryParameterByName("search");
    if (q) {
        stopQuery = q;
    }
    else {
        stopQuery = null;
    }
}
function loadMain() {
    hideLoading();
    loadQueryParams();
    $("#headerMain").load("/common/header.html", function () { initializeHeader(); });
    $("#sidebar").load("/common/sidebar.html", function () { initializeSidebar(); });
    $("#footer").load("/common/footer.html");
    $("#leftNav").load("/common/left-nav.html");

    loadPageContent();
}
function loadPageContent() {
    // Clear Google map stuff. This isn't 100% working yet
    google.maps.event.clearListeners(window, 'resize');
    $('#map-canvas').remove();

    loadQueryParams();

    // If we have a hash then load that section otherwise load Routes
    var hash = window.location.hash.split("?")[0].replace("#","");
    switch (hash) {
        case "route-details":
            loadRouteDetails(currentRouteID);
            break;
        case "map":
            loadMap();
            break;
        case "stops":
            loadStops(currentStopID);
            break;
        case "routes":
        default:
            hash = "routes";
            loadRoutes();
            break;
    }
    setHistory(hash);
}

// ----------- History -------------------
function setHistory(appPage) {
    console.log("setHistory: " + appPage);
    var params = "";
    switch (appPage) {
        case "routes":
            history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage);
            break;
        case "route-details":
            if (currentRouteID) { params = "?routeId=" + currentRouteID }
            history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage + params);
            break;
        case "map":
            if (stopQuery) { params = "?search=" + encodeURIComponent(stopQuery) }
            history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage + params);
            break;
        case "stops":
            if (currentStopID) { params = "?stopId=" + currentStopID }
            history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage + params);
            break;
        default:
            history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage);
            break;
    }

}
function onPopState(event) {
    if (event.state) {        
        switch (event.state.page) {
            case "routes":
                loadRoutes();
                break;
            case "route-details":
                if (event.state.currentRouteID) { currentRouteID = event.state.currentRouteID; }
                loadRouteDetails(currentRouteID);
                break;
            case "map":
                loadMap();
                break;
            case "stops":
                if (event.state.currentStopID) { currentStopID = event.state.currentStopID; }
                loadStops();
                break;
        }
    }
};

// Route search to SharePoint
function searchSite() {
    var searchText = $("#searchInput").val().trim();
    if (searchText) {
        window.location = searchURL + encodeURIComponent(searchText);
    }
}

// --------- Common sections load/initialize ------------
function initializeHeader() {
    BindTopNav();
    // search on enter
    $("#searchInput").keypress(function (event) {
        if (event.keyCode == 13) {
            searchSite();
        }
    });
}
function initializeSidebar() {
    getLocation();
    $("#fdate").datepicker({ dateFormat: "mm/dd/y" }).datepicker("setDate", new Date());
    // Route dropdown
    if (!routeList) {
        routeList = getRoutes();
    }  
    var selRoutes = $("#selRoutes");
    for (i = 0; i < routeList.length; i += 2) {
        selRoutes.append("<option value='" + routeList[i].route_id + "'>" + routeList[i].route_short_name + "</option>");
    }
    $("#findRoute").click(findRouteClick);
    $('#tbStop').keypress(function (e) {
        if (e.which == 13) {
            onFindStopClick();
        }
    });
    $('#findStop').click(onFindStopClick);

    // Notices
    var noticeList = $("#noticeList");
    for (i = 0; i < notices.length; i ++) {
        noticeList.append("<li>" + notices[i].title + "</li>");
    }
}
function showLoading() {
    $("#loader").show();
}
function hideLoading() {
    $("#loader").hide();
}

// -------- Routes ----------
function loadRoutes() {
    $("#appPage").load("/common/routes.html", function () { initializeRoutes(); });
}
function initializeRoutes() {
    //setHistory("routes");
    if (!routeList) {
        routeList = getRoutes();
    }
    var ulRoutes = $("#routeList");
    for (i = 0; i < routeList.length; i ++) {
        //ulRoutes.append("<li><span class='route-num'>" + routeList[i].route_short_name + "</span><a href='javascript:loadRouteDetails(" + routeList[i].route_id + ")'>" + routeList[i].trip_headsign + '<i class=\"fa fa-arrows-h\"></i>' + routeList[i + 1].trip_headsign + "</a></li>");
        //ulRoutes.append("<li><span class='route-num'>" + routeList[i].route_short_name + "</span><a href='javascript:loadRouteDetails(" + routeList[i].route_id + ")'>" + routeList[i].route_long_name + "</a></li>");
        ulRoutes.append("<li><span class='route-num'>" + routeList[i].route_short_name + "</span><a href='schedules.html#route-details?routeId=" + routeList[i].route_id + "'>" + routeList[i].route_long_name + "</a></li>");
    }
}

// -------- Route Details ----------
function loadRouteDetails(route_id) {    
    currentRouteID = route_id;
    $("#appPage").load("/common/route-details.html", function () {
         initializeRouteDetails();
    });    
}
function initializeRouteDetails() {
    //setHistory("route-details")
    // Get main route info
    // If no route number selected go back to routes
    if (currentRouteID){
        var route = getRoute(currentRouteID);
        if (route) {
            // populate heading
            $("#routeNumber").html("Route " + route.route_short_name);
            var directions = route.route_long_name.split("&harr;");
            routeDir0 = directions[0];
            routeDir1 = directions[1];
            if (currentDirectionID == 0) {
                $("#routeDir1").html(routeDir0);
                $("#routeDir2").html(routeDir1);
            }
            else {
                $("#routeDir1").html(routeDir1);
                $("#routeDir2").html(routeDir0);
            }
        }

        $("#dayTabs").tabs({
            activate: function (event, ui) {
                var active = $('#dayTabs').tabs('option', 'active');
                thisDay($("#dayTabs ul>li a").eq(active).html());
            }
        });
        //Select the current day tab on load
        var day = new Date().getDay();
        var presentDate = new Date();
        var newDate = (presentDate.getDate()).toString();
        if (newDate.length < 2) { newDate = '0' + newDate; }
        var newMonth = (presentDate.getMonth() + 1).toString();
        if (newMonth.length < 2) { newMonth = '0' + newMonth; }
        var newYear = (presentDate.getFullYear()).toString();
        specialServiceDate = newYear + newMonth + newDate;

        if (day > 0 && day < 6) {
            $('#Weekday').addClass('selectedDay');
            currentServiceID = 1;
        }
        else if (day == 6) {
            $('#Saturday').addClass('selectedDay');
            currentServiceID = 2;
        }
        else if (day == 0) {
            $('#Sunday').addClass('selectedDay');
            currentServiceID = 3;
        }
        var dateConfig = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        var d = new Date().toLocaleDateString('en-US', dateConfig);
        $('#datepicker').attr('value', d);
        $(function () {
            $('#datepicker').datepicker({
                dateFormat: 'DD, MM d, yy',
                showOn: "both",
                buttonText: "<i class='fa fa-calendar'></i>"
            });
        });
        //Fill the drop-down with existing route options from the routes.json file on load
        //var option = '';

        //for (i = 0; i < routes.length; i++) {
        //    option += '<option value="' + routes[i].route_short_name + '" id="' + routes[i].route_id + '">' + routes[i].route_short_name + '</option>';
        //}
        //$('#routeList').append(option);
        //if (routeVariable) {
        //    $('#routeList option[id="' + routeVariable + '"]').attr('selected', 'selected');
        //    displaySelectedRoute();
        //    selectedRouteId = routeVariable;
        //    currentRouteNumber = $('#routeList option[id="' + routeVariable + '"').attr('value');
        //    // $('.routeNumber').empty();
        //    // $('.routeNumber').append('Route ' + currentRouteNumber + ' to ' + trip_headsign);
        //}
        //Change the header of the page based on the selected route from the drop down
        //$('#routeList').on('change', function () {
        //    currentRouteNumber = this.value;
        //    selectedRouteId = $(this).children(":selected").attr("id");
        //    displaySelectedRoute();
        //});
        //$('#routeList').on('click', function () {
        //    $(this).removeClass('highlight');
        //});

        $('#datepicker').on('change', function () {
            //figure out what the day is and call thisDay(day)
            var selectedDay = $(this)[0].value;
            selectedDay = selectedDay.split(',')[0];
            thisDay(selectedDay);
        });
        $('#stopListStart').on('change', function () {
            $('#stopListEnd').empty();
            var selectedIndex = $('#stopListStart option:selected').index();
            var selectedStop = this.value;
            var selectedStopId = $(this).children(":selected").attr("id");
            var availableStopsEnd = $('#busTable tr:eq(' + 0 + ') td');
            var endingOptions = '';
            for (i = selectedIndex; i < availableStopsEnd.length; i++) {
                endingOptions += '<option value="' + availableStopsEnd[i].innerHTML + '" id="' + availableStopsEnd[i].id + '">' + availableStopsEnd[i].innerHTML + '</option>';
            }
            $('#stopListEnd').append(endingOptions);
        });
        displaySelectedRoute();
    }
    else {
        loadRoutes();
    }
}
function swapMapSize() {
    var rMap = $("#routeMap");
    if (rMap.hasClass("normal")) {
        rMap.animate({ width: "100%" }, "slow");
        rMap.removeClass("normal");
        rMap.addClass("full");        
        $(".map-image a").html("Shrink >>");
    } else {
        var offset = rMap.offset();
        rMap.removeClass("full");
        rMap.addClass("normal");
        rMap.animate({ width: "25%" }, "slow");
        $(".map-image a").html("Expand >>");
        $('html, body').animate({
            scrollTop: offset.top
        });
    }
}
function findRouteClick() {
    var selRoute = $("#selRoutes").val();
    if (selRoute != 'selectRoute') {
        loadRouteDetails(selRoute);
    }
}
function flipRoute() {
    if (currentDirectionID == 0) {
        currentDirectionID = 1;
    } else {
        currentDirectionID = 0;
    }
    displaySelectedRoute();
    // Flip trip head signs
    var dir1 = $("#routeDir1").html();
    var dir2 = $("#routeDir2").html();
    $("#routeDir1").html(dir2);
    $("#routeDir2").html(dir1);
}
function thisDay(day) {
    if (day == 'Weekday' || day == 'Monday' || day == 'Tuesday' || day == 'Wednesday' || day == 'Thursday' || day == 'Friday') {        
        currentServiceID = 1;
        $("#dayTabs").tabs("option", "active", 0);
    } else if (day == 'Saturday') {
        currentServiceID = 2;
        $("#dayTabs").tabs("option", "active", 1);
    } else if (day == 'Sunday') {
        currentServiceID = 3;
        $("#dayTabs").tabs("option", "active", 2);
    }
    //throwTheDate();
    displaySelectedRoute();
}
function displaySelectedRoute() {
    $('#busTable').empty();
    $('.routeNumber').empty();
    $('#datePicker').after('<div class="spinner"></div>');
    var tripsInRoute = [];
    var specialService = $.grep(calendar_dates, function (a) {
        return a.date == specialServiceDate;
    });
    var isHoliday = $.grep(specialService, function (a) {
        return a.exception_type == 2;//magic number based on data for now
    });
    if (isHoliday.length > 0) {
    } else if (specialService.length > 0) {
        var specialServiceDate_id = specialService[0].service_id;
        if (specialServiceDate == specialService[0].date) {
            for (i = 0; i < trips.length; i++) {
                if (trips[i].route_id == currentRouteID && trips[i].direction_id == currentDirectionID && (trips[i].service_id == currentServiceID || trips[i].service_id == specialServiceDate_id)) {
                    tripsInRoute.push(trips[i]);
                }
            }
        }
    } else {
        for (i = 0; i < trips.length; i++) {
            if (trips[i].route_id == currentRouteID && trips[i].direction_id == currentDirectionID && trips[i].service_id == currentServiceID) {
                tripsInRoute.push(trips[i]);
            }
        }
    }
    if (tripsInRoute == 0) {
        trip_headsign = -1;
    } else {
        trip_headsign = tripsInRoute[0].trip_headsign; //currently using the first trip's trip_headsign for the entire route
    }
    var stopTimesInRoute = [];
    for (i = 0; i < tripsInRoute.length; i++) {
        tripStopArray = $.grep(stop_times, function (d) {
            return d.trip_id == tripsInRoute[i].trip_id;
        });
        for (j = 0; j < tripStopArray.length; j++) {
            stopTimesInRoute.push(tripStopArray[j]);
        }
    }
    var flags = {};
    var uniqueStopTimesInRoute = stopTimesInRoute.filter(function (entry) {
        if (flags[entry.stop_id]) {
            return false;
        }
        flags[entry.stop_id] = true;
        return true;
    });
    uniqueStopTimesInRoute.sort(function compare(a, b) {
        if (a.stop_sequence < b.stop_sequence)
            return -1;
        if (a.stop_sequence > b.stop_sequence)
            return 1;
        return 0;
    });
    var uniqueStopNamesInRoute = [];
    for (i = 0; i < uniqueStopTimesInRoute.length; i++) {
        var grepArray = $.grep(stops, function (a) {
            return a.stop_id == uniqueStopTimesInRoute[i].stop_id;
        });
        for (j = 0; j < grepArray.length; j++) {
            uniqueStopNamesInRoute.push(grepArray[j]);
        }
    }
    $('#busTable').append('<tr id="stopNames"></tr>');
    for (i = 0; i < uniqueStopNamesInRoute.length; i++) {
        $('#stopNames').append('<td id="' + uniqueStopNamesInRoute[i].stop_id + '">' + uniqueStopNamesInRoute[i].stop_name + '</td>');
    }
    for (i = 0; i < tripsInRoute.length; i++) {
        $('#busTable').append('<tr class="tripTimes" id="trip' + tripsInRoute[i].trip_id + '"></tr>');
        var tripId = document.getElementById('trip' + tripsInRoute[i].trip_id);
        var stopTimesInTrip = $.grep(stopTimesInRoute, function (a) {
            return a.trip_id == tripsInRoute[i].trip_id;
        });
        stopTimesInTrip.sort(function (a, b) {
            return new Date('1970/01/01 ' + a.departure_time) - new Date('1970/01/01 ' + b.departure_time);
        });
        var j = 0;
        for (k = 0; k < uniqueStopNamesInRoute.length; k++) {
            var columnId = parseInt($('#stopNames td:nth-child(' + (k + 1) + ')').attr('id'));
            if (stopTimesInTrip[j] == undefined) {
                $(tripId).append('<td id="' + uniqueStopNamesInRoute[k].stop_id + '">--</td>');
            } else if (stopTimesInTrip[j].stop_id == parseInt($('#stopNames td:nth-child(' + (k) + ')').attr('id'))) {
                j++;
                k--;
            } else if (columnId != stopTimesInTrip[j].stop_id) {
                $(tripId).append('<td id="' + uniqueStopNamesInRoute[k].stop_id + '">--</td>');
            } else {
                if (stopTimesInTrip[j].departure_time.length == 7) {
                    $(tripId).append('<td id="' + stopTimesInTrip[j].stop_id + '">0' + stopTimesInTrip[j].departure_time.slice(0, -3) + '</td>');
                } else {
                    $(tripId).append('<td id="' + stopTimesInTrip[j].stop_id + '">' + stopTimesInTrip[j].departure_time.slice(0, -3) + '</td>');
                }
                j++;
            }
        }
    }
    for (i = 0; i < uniqueStopNamesInRoute.length; i++) {
        var colArray = $('#busTable td:nth-child(' + (i + 1) + ')').map(function () {
            return $(this).text();
        }).get();
        var counter = 0;
        for (j = 1; j < colArray.length; j++) {
            if (colArray[j] == '--') {
                counter++;
            }
        }
        if (counter == (colArray.length - 1)) {
            $('#busTable tr').find('td:eq(' + i + ')').addClass('markedForDeletion');
        }
    }
    $('.markedForDeletion').remove();
    var tableRows = $('#busTable tr');
    for (i = 1; i < tableRows.length; i++) {
        var howMany = $(tableRows[i]).children().length;
        var rowArray = [];
        for (j = 0; j < howMany; j++) {
            rowArray.push($('#busTable tr:eq(' + i + ') td:eq(' + j + ')').text());
        }
        rowArray = rowArray.filter(function (n) { return n != '--' });
        rowArray.sort();
        $('#busTable tr:eq(' + i + ')').attr('value', rowArray[0]);
    }
    var $table = $('#busTable');
    var rows = $('.tripTimes');
    rows.sort(function (a, b) {
        var keyA = $(a).attr('value');
        var keyB = $(b).attr('value');
        if (keyA > keyB) return 1;
        if (keyA < keyB) return -1;
        return 0;
    });
    $.each(rows, function (index, row) {
        $table.children('tbody').append(row);
    });
    customizeStopListStart();
    var processContinuing = function () {
        $('.tripTimes').each(function (x) {
            var currentRow = $(this);
            var originTrip = $.grep(tripsInRoute, function (a) {
                return currentRow.attr('id') == 'trip' + a.trip_id;
            })[0];
            var continuingTrips = $.grep(trips, function (a) {
                return originTrip.block_id == a.block_id && (a.service_id == currentServiceID || a.service_id == specialServiceDate_id);
            });
            var firstStopTimes = [];
            for (i = 0; i < continuingTrips.length; i++) {
                var firstStopTime = $.grep(stop_times, function (a) {
                    return continuingTrips[i].trip_id == a.trip_id;
                });
                firstStopTime.sort(function (a,b) {
                    if (a.stop_sequence < b.stop_sequence) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
                firstStopTimes.push(firstStopTime[0]);
            }
            firstStopTimes.sort(function (a, b) {
                var A = new Date('1970/01/01 ' + a.departure_time);
                var B = new Date('1970/01/01 ' + b.departure_time);
                if (A < B) {
                    return -1;
                } else {
                    return 1;
                }
            });
            stopTimesInRoute.sort(function (a, b) {
                var A = new Date('1970/01/01 ' + a.departure_time);
                var B = new Date('1970/01/01 ' + b.departure_time);
                if (A < B) {
                    return -1;
                } else {
                    return 1;
                }
            });
            var originFirst = $.grep(stopTimesInRoute, function (a) {
                return originTrip.trip_id == a.trip_id;
            })[0].departure_time;
            var continuesOnAs;
            for (i = 0; i < firstStopTimes.length; i++) {
                if (firstStopTimes[i].hasOwnProperty("departure_time") && firstStopTimes[i].departure_time == originFirst) {
                    if (firstStopTimes[i + 1] == undefined) {
                        continuesOnAs = 'Out of Service';
                    } else {
                        var continuingTripId = firstStopTimes[i + 1].trip_id;
                    }
                }
            }
            if (continuesOnAs == 'Out of Service') {
                $(this).append('<td class="outOfService">Out of Service</td>');
            } else {
                continuesOnAs = $.grep(trips, function (a) {
                    return continuingTripId === a.trip_id;
                });
                var continuesOnAsDirection = continuesOnAs[0].direction_id;
                var continuesOnAsRouteId = continuesOnAs[0].route_id;
                var continuesOnAsHeadsign = continuesOnAs[0].trip_headsign;
                var continuesOnAsHeadsignVar = "'" + continuesOnAs[0].trip_headsign + "'";
                var continuesOnAsRoute = $.grep(routes, function (a) {
                    return continuesOnAs[0].route_id === a.route_id
                });
                continuesOnAsRoute = continuesOnAsRoute[0].route_short_name;
                continuesOnAs = continuesOnAsRoute + ' ' + continuesOnAsHeadsign;
                $(this).append('<td class="continuing" id="' + continuesOnAsRoute + ' ' + continuesOnAsDirection + '" onClick="continuingRoute(' + continuesOnAsRouteId + ', ' + currentServiceID + ', ' + continuesOnAsDirection + ', ' + continuesOnAsHeadsignVar + ');">' + continuesOnAs + '</td>');
            }
        });
    }
    setTimeout(processContinuing, 0);
    selectedRoute = $('#routeList option[id="' + currentRouteID + '"]').attr('value');
    if (trip_headsign === -1) {
        if (isHoliday.length > 0) {
            $('.routeNumber').append('There is no service during the holiday.');
        } else {
            $('.routeNumber').append('There is no service for the specified route and time.');
        }
    } else {
        $('.routeNumber').append('Route ' + selectedRoute + ' to ' + trip_headsign);
        $('#stopNames').append('<td>Continues On As</td>');
    }
    $('.spinner').remove();
}
function continuingRoute(continuesOnAsRouteId, service_id, continuesOnAsDirection, continuesOnAsHeadsignVar) {
    currentRouteID = continuesOnAsRouteId;
    currentDirectionID = continuesOnAsDirection;
    trip_headsign = continuesOnAsHeadsignVar;
    $('#routeList option[id="' + currentRouteID + '"]').attr('selected', 'selected');
    currentRouteNumber = $('#routeList option[id="' + currentRouteID + '"]').attr('value');
    displaySelectedRoute();
}
function customizeStopListStart() {
    $('#stopListStart').empty();
    $('#stopListStart').append('<option value="selectStopListStart" disabled>Starting Bus Stop</option>');
    var availableStops = $('#busTable tr:eq(' + 0 + ') td');
    if (availableStops.length > 0) {
        var startingOptions = '';
        for (i = 0; i < availableStops.length; i++) {
            startingOptions += '<option value="' + availableStops[i].innerHTML + '" id="' + availableStops[i].id + '">' + availableStops[i].innerHTML + '</option>';
        }
        $('#stopListStart').append(startingOptions)
							.trigger('change');
        var firstTime = $('#busTable tr:eq(' + 1 + ') td:first')[0].innerHTML;
        var lastTime = $('#busTable tr:last td:last')[0].innerHTML;
        var increment = 1;
        var increment2 = 1;
        while (lastTime == '--') {
            increment++;
            lastTime = $('#busTable tr:last td:nth-last-child(' + increment + ')')[0].innerHTML;
        }
        while (firstTime == '--') {
            increment2++;
            firstTime = $('#busTable tr:nth-child(2) td:nth-child(' + increment2 + ')')[0].innerHTML;
        }
        $('#startTime').attr('value', firstTime);
        $('#endTime').attr('value', lastTime);
    }
}
function applyFilter() {
    clearFilter();
    var filterStart = '#' + $('#stopListStart').children(":selected").attr("id");
    var filterEnd = '#' + $('#stopListEnd').children(":selected").attr("id");
    var startCells = $('#busTable td').not(filterStart + ', ' + filterEnd);
    startCells.hide();
    var timeStart = $('#startTime').val();
    var timeEnd = $('#endTime').val();
    var cellsRemaining = $('#busTable td').filter(function () {
        return $(this).is(':visible');
    });
    cellsRemaining.splice(0, 1)
    cellsRemaining.splice(0, 1)
    $.each(cellsRemaining, function () {
        if ($(this)[0].innerHTML == '--') {
            $(this).parent().hide();
        } else if ($(this)[0].innerHTML >= timeStart && $(this)[0].innerHTML <= timeEnd) {
        } else {
            $(this).hide();
        }
    });
    var noRows = $('.tripTimes').is(':visible');
    if (noRows == false) {
        var startingStop = $('#stopListStart option:selected')[0].innerHTML;
        var endingStop = $('#stopListEnd option:selected')[0].innerHTML;
        $('#stopNames').hide();
        $('#busTable').append('<tr id="noStops"><td>Route ' + selectedRoute + ' to ' + trip_headsign + ' does not stop at both ' + startingStop + ' and ' + endingStop + ' between the specified times.</td></tr>')
    }
}
function clearFilter() {
    $('#noStops').remove();
    $('#busTable tr:hidden').show();
    $('#busTable td:hidden').show();
}
function printDiv(divName) {
    var printContents = document.getElementById(divName).innerHTML;
    var originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
}
//When clicking on the day tabs, date should remain in the same week
//When clicking on the date picker, just use the date they selected
function throwTheDate() {
    var previousDate = $('#datepicker').datepicker('getDate');
    var previousDay = previousDate.getDay();
    var selectedDate = previousDate.getDate();
    var prevMonth = previousDate.getMonth();
    var prevYear = previousDate.getFullYear();
    var daysInSelectedMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    var next = selectedDate;
    if (currentServiceID == 1) {
        if (!(previousDay > 0 && previousDay < 6)) {
            next = selectedDate + (8 - previousDay);
            if (next > daysInSelectedMonth) {
                next = next - daysInSelectedMonth;
                var prevMonth = prevMonth + 1;
                if (prevMonth > 11) {
                    prevMonth = 0;
                    prevYear = prevYear + 1;
                }
            }
        }
    } else if (currentServiceID == 2) {
        if (!(previousDay == 6)) {
            next = selectedDate + (6 - previousDay);
            if (next > daysInSelectedMonth) {
                next = next - daysInSelectedMonth;
                var prevMonth = prevMonth + 1;
                if (prevMonth > 11) {
                    prevMonth = 0;
                    prevYear = prevYear + 1;
                }
            }
        }
    } else if (currentServiceID == 3) {
        if (!(previousDay == 0)) {
            next = selectedDate + (7 - previousDay);
            if (next > daysInSelectedMonth) {
                next = next - daysInSelectedMonth;
                var prevMonth = prevMonth + 1;
                if (prevMonth > 11) {
                    prevMonth = 0;
                    prevYear = prevYear + 1;
                }
            }
        }
    }
    var dateConfig = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    var d = new Date(prevYear, prevMonth, next).toLocaleDateString('en-US', dateConfig);
    $('#datepicker').attr('value', d);
    $(function () {
        $('#datepicker').datepicker({ dateFormat: 'DD, MM d, yy' });
        $('#datepicker').datepicker('setDate', d);
    });
    var formattedPrevMonth = (prevMonth + 1).toString();
    if (formattedPrevMonth.length < 2) { formattedPrevMonth = '0' + formattedPrevMonth };
    var formattedNext = next.toString();
    if (formattedNext.length < 2) { formattedNext = '0' + formattedNext };
    var specDate = prevYear + '' + formattedPrevMonth + '' + formattedNext;
    specialServiceDate = specDate;
}

// -------- Stops ----------
function loadStops(stopId) {    
    currentStopID = stopId;
    $("#appPage").load("/common/stops.html", function () { initializeStops(); });
}
function initializeStops() {
    //setHistory("stops");
    //Get the Lat/Lng of the StopId 
    var LatLng; 
    var panoLatLng; 
    var cameraHeading; 
    if (currentStopID == null) { 
        LatLng = new google.maps.LatLng(48.750267, -122.476362); 
        cameraHeading = 105; 
    } else { 
        var currentStopLatLng = $.grep(stops, function(a) { 
            return a.stop_code == currentStopID; 
        }); 
        LatLng = new google.maps.LatLng(currentStopLatLng[0].stop_lat,currentStopLatLng[0].stop_lon); 
   } 
    geocode = new google.maps.Geocoder();
    var BTS = new google.maps.LatLng(48.750267, -122.476362);
    var mapOptions = {
        center: BTS,
        zoom: 16
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    panorama = map.getStreetView();
    var panoOptions = {
        position: BTS,
        pov: {
            heading: 105,
            pitch: 5
        },
        visible: true,
    };
    panorama.setOptions(panoOptions);
    // google.maps.event.addListener(panorama, 'position_changed', function() {
    //     var lat = panorama.getPosition().k;
    //     var lng = panorama.getPosition().D;
    //     var panoLocation = new google.maps.LatLng(lat, lng);
    //     var heading = google.maps.geometry.spherical.computeHeading(panoLocation,LatLng);
    //     panorama.setPov({
    //         heading: heading,
    //         pitch:5
    //     });
    // });
    var streetviewService = new google.maps.StreetViewService();
    // Following code is from the fillStops function. Don't think we want to do this on load so commenting out for now.
    //stopIdVariable = window.location.search.substring(1, 5);
    //if (stopIdVariable < 1000) {
    //    stopIdVariable = stopIdVariable.substring(1, 5);
    //}
    //stopVariable = parseInt(window.location.search.substring(5, 9));
    //stopNameVariable = (window.location.search.substring(9)).replace(/%20/g, " ");
    var day = new Date().getDay();
    var presentDate = new Date();
    var newDate = (presentDate.getDate()).toString();
    if (newDate.length < 2) { newDate = '0' + newDate; }
    var newMonth = (presentDate.getMonth() + 1).toString();
    if (newMonth.length < 2) { newMonth = '0' + newMonth; }
    var newYear = (presentDate.getFullYear()).toString();
    specialServiceDate = newYear + newMonth + newDate;
    if (day > 0 && day < 6) {
        $('#Weekday').addClass('selectedDay');
        currentServiceID = 1;
    }
    else if (day == 6) {
        $('#Saturday').addClass('selectedDay');
        currentServiceID = 2;
    }
    else if (day == 0) {
        $('#Sunday').addClass('selectedDay');
        currentServiceID = 3;
    }
    $("#dayTabs").tabs({
        activate: function (event, ui) {
            var active = $('#dayTabs').tabs('option', 'active');
            thisDayStops($("#dayTabs ul>li a").eq(active).html());
        }
    });
    $('#searchStops').keypress(function (e) {
        if (e.which == 13) {
            directSearch();
        }
    });
    $('#searchStops').on('focus', function (e) {
        $(this).removeClass('pulse');
    });
    $('#scheduleFor').on('change', function () {
        var chosenRoute = this.value;
        var chosenRouteId = $(this).children(":selected").attr("id");
        filterStops(chosenRouteId);
    });
    var dateConfig = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    var d = new Date().toLocaleDateString('en-US', dateConfig);
    $('#datepicker').attr('value', d);
    $(function () {
        $('#datepicker').datepicker({
            showOn: "both",
            buttonText: "<i class='fa fa-calendar'></i>"
        });
    });
    $('#datepicker').on('change', function () {
        var selectedDay = $(this)[0].value;
        selectedDay = selectedDay.split(',')[0];
        thisDayStops(selectedDay);
    });
    if (currentStopID) {
        $('#stopNameHeader')[0].innerHTML = stopNameVariable;
        $("#searchStops").val(currentStopID);
        displaySelectedStop(currentStopID, currentServiceID);
    } else {
        $('#searchStops').addClass('pulse');
        setTimeout(function () { $('#searchStops').removeClass('pulse') }, 6500);
    }
    if (currentStopID != null) {
        panoLatLng = new google.maps.LatLng(map.streetView.position.k, map.streetView.position.D);
        cameraHeading = google.maps.geometry.spherical.computeHeading(LatLng,panoLatLng);
        panorama.setPov({
            heading: cameraHeading,
            pitch: 5
        });
    }
}
function SVpano() {
    var distance = 50;
    var stopLatLng = $.grep(stops, function(a) {
        return a.stop_code == currentStopID;
    });
    var stopPosition = new google.maps.LatLng(stopLatLng[0].stop_lat,stopLatLng[0].stop_lon);
    var service = new google.maps.StreetViewService();
    service.getPanoramaByLocation(stopPosition, distance, function(panoData) {
        if (panoData) {
            panoramaLatLng = panoData.location.latLng;
            initStreetView(stopPosition, panoramaLatLng);
        } else {
            $('#map-canvas').children().hide();
            $('#noSV').remove();
            $('#map-canvas').append('<p id="noSV" style="text-align:center;display:block;line-height:400px;">Drat! There isn\'t a good shot of this bus stop.</p>');
        }
    });
}
function initStreetView(stopPosition, panoramaLatLng){
    var panoramaOptions = {
        position: stopPosition
    };
    var streetView = new google.maps.StreetViewPanorama(document.getElementById('map-canvas'),panoramaOptions);
    var heading = google.maps.geometry.spherical.computeHeading(panoramaLatLng, stopPosition);
    map.setStreetView(streetView);      
    streetView.setPov({heading:heading, pitch:0});
    streetView.setZoom(0);
}
function codeAddressStop() {
    var address = document.getElementById('address').value;
    geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            });
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}
function directSearch() {
    var searchTerm = document.getElementById('searchStops').value;
    if (searchTerm.length == 0) {
    } else if (searchTerm.length == 4) {
        var stopCodeResult = $.grep(stops, function (a) {
            return a.stop_code == searchTerm;
        });
        if (stopCodeResult.length == 1) {
            currentStopID = searchTerm;
            stopIdVariable = stopCodeResult[0].stop_id;
            stopNameVariable = stopCodeResult[0].stop_name;
            displaySelectedStop(currentStopID, currentServiceID);
           
        } else {
            window.location.href = "#map?search=" + searchTerm;
        }
    } else {
        window.location.href = "#map?search=" + searchTerm;
    }
}
function directMap() {
    var stopCode = document.getElementById('selectedStopId').innerHTML;
    if (stopCode.length == 4) {
        window.location.href = "map.html?" + stopCode;
    } else {
        window.location.href = "map.html";
    }
}
function thisDayStops(day) {
    $('#dayTabs div').removeClass('selectedDay');
    if (day == 'Weekday' || day == 'Monday' || day == 'Tuesday' || day == 'Wednesday' || day == 'Thursday' || day == 'Friday') {
        currentServiceID = 1;
        $('#Weekday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
    } else if (day == 'Saturday') {
        currentServiceID = 2;
        $('#Saturday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
    } else if (day == 'Sunday') {
        currentServiceID = 3;
        $('#Sunday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
    } else if (day == 'Street View') {
        $('#StreetView').addClass('selectedDay');
        $('#printThis').hide();
        $('#map-canvas').show();
        panorama.setVisible(true);
    }
    //throwTheDate();
    displaySelectedStop(selectedStopId, currentServiceID);
}
function displaySelectedStop(selectedStopId, service_id) {
    // get Stop info and populate header if found
    var stop = getStop(selectedStopId);

    if (stop) {
        $('#stopTable').empty();
        $('#stopTable').append('<tr><th>Time</th><th>Route</th></tr>');
        $('#stopNameHeader')[0].innerHTML = stop.stop_name;
        $('#selectedStopId')[0].innerHTML = selectedStopId;
        servingRoutes();
        $('#servedByRoutes')[0].innerHTML = servedByRoutes;
        var option = '';
        for (i = 0; i < finalStops.length; i++) {
            option += '<option value="' + finalStops[i].route_short_name + '" id="' + finalStops[i].route_id + '">' + finalStops[i].route_short_name + '</option>';
        }
        $('#scheduleFor option:not(:first-child)').remove();
        $('#scheduleFor').append(option);
        SVpano();
    }
    else {
        // TODO: add no stop information?
    }
}
function servingRoutes() {
    var specialService = $.grep(calendar_dates, function (a) {
        return a.date == specialServiceDate;
    });
    if (specialService.length > 0) {
        var specialServiceDate_id = specialService[0].service_id;
    }
    var isHoliday = $.grep(specialService, function (a) {
        return a.exception_type == 2;//magic number based on data for now
    });
    if (isHoliday.length > 0) {
        $('#stopTable').append('<tr><td colspan="2">There is no service on the holiday.</td></tr>');
        selectedStopId = $('#selectedStopId')[0].innerHTML;
        return;
    }
    var servingToday = [];
    var servingStops = $.grep(stop_times, function (a) {
        return a.stop_id == stopIdVariable;
    });
    finalStops = [];
    for (i = 0; i < servingStops.length; i++) {
        var gimmeThat = $.grep(trips, function (a) {
            return (a.trip_id == servingStops[i].trip_id && (a.service_id == currentServiceID || a.service_id == specialServiceDate_id));
        });
        for (j = 0; j < gimmeThat.length; j++) {
            var servingRoutes = $.grep(routes, function (a) {
                return a.route_id == gimmeThat[j].route_id;
            });
            finalStops.push(servingRoutes[0]);
        }
    }
    var stopFlags = {};
    finalStops = finalStops.filter(function (entry) {
        if (stopFlags[entry.route_id]) {
            return false;
        }
        stopFlags[entry.route_id] = true;
        return true;
    });
    servedByRoutes = '';
    for (i = 0; i < finalStops.length; i++) {
        if (i > 0) {
            //servedByRoutes += ', <a href="index.html?' + finalStops[i].route_id + '">' + finalStops[i].route_short_name + '</a>';
            //servedByRoutes += ', <a href="javascript:loadRouteDetails(' + finalStops[i].route_id + ')">' + finalStops[i].route_short_name + '</a>';
            servedByRoutes += ', <a href="#route-details?routeId=' + finalStops[i].route_id + '">' + finalStops[i].route_short_name + '</a>';
        } else {
            //servedByRoutes += '<a href="index.html?' + finalStops[i].route_id + '">' + finalStops[i].route_short_name; +'</a>';
            //servedByRoutes += '<a href="javascript:loadRouteDetails(' + finalStops[i].route_id + ')">' + finalStops[i].route_short_name; +'</a>';
            servedByRoutes += '<a href="#route-details?routeId=' + finalStops[i].route_id + '">' + finalStops[i].route_short_name; +'</a>';
        }
    }
    for (i = 0; i < servingStops.length; i++) {
        var currentStop = $.grep(trips, function (a) {
            return (servingStops[i].trip_id == a.trip_id && (a.service_id == currentServiceID || a.service_id == specialServiceDate_id));
        });
        if (currentStop.length == 1) {
            servingToday.push(servingStops[i]);
        }
    }
    servingToday.sort(function (a, b) {
        var A = new Date('1970/01/01 ' + a.departure_time);
        var B = new Date('1970/01/01 ' + b.departure_time);
        if (A < B) {
            return -1;
        } else {
            return 1;
        }
    });
    for (i = 0; i < servingToday.length; i++) {
        var finalTimeRoute;
        var currentTime = servingToday[i].departure_time.slice(0, -3);
        var currentTimeRoute = $.grep(trips, function (a) {
            return a.trip_id == servingToday[i].trip_id;
        });
        for (j = 0; j < currentTimeRoute.length; j++) {
            finalTimeRoute = $.grep(routes, function (a) {
                return a.route_id == currentTimeRoute[j].route_id;
            });
        }
        $('#stopTable').append('<tr id="' + finalTimeRoute[0].route_id + '"><td>' + currentTime + '</td><td>' + finalTimeRoute[0].route_short_name + ' ' + currentTimeRoute[0].trip_headsign + '</td></tr>');
    }
    selectedStopId = $('#selectedStopId')[0].innerHTML;
    //set the pano
    //move the map and pano
    
}
function servingRoutesMap() {
    var servingStops = $.grep(stop_times, function (a) {
        return a.stop_id == stopIdVariable;
    });
    finalStopsMap = [];
    for (i = 0; i < servingStops.length; i++) {
        var gimmeThat = $.grep(trips, function (a) {
            return (a.trip_id == servingStops[i].trip_id);
        });
        for (j = 0; j < gimmeThat.length; j++) {
            var servingRoutes = $.grep(routes, function (a) {
                return a.route_id == gimmeThat[j].route_id;
            });
            finalStopsMap.push(servingRoutes[0]);
        }
    }
    var stopFlags = {};
    finalStopsMap = finalStopsMap.filter(function (entry) {
        if (stopFlags[entry.route_id]) {
            return false;
        }
        stopFlags[entry.route_id] = true;
        return true;
    });
    servedByRoutesMap = '';
    for (i = 0; i < finalStopsMap.length; i++) {
        if (i > 0) {
            //servedByRoutesMap += ', <a href="index.html?' + finalStopsMap[i].route_id + '">' + finalStopsMap[i].route_short_name + '</a>';
            //servedByRoutesMap += ', <a href="javascript:loadRouteDetails(' + finalStopsMap[i].route_id + ')">' + finalStopsMap[i].route_short_name + '</a>';
            servedByRoutesMap += ', <a href="#route-details?routeId=' + finalStopsMap[i].route_id + '">' + finalStopsMap[i].route_short_name + '</a>';
        } else {
            //servedByRoutesMap += ', <a href="javascript:loadRouteDetails(' + finalStopsMap[i].route_id + ')">' + finalStopsMap[i].route_short_name + '</a>';
            //servedByRoutesMap += '<a href="javascript:loadRouteDetails(' + finalStopsMap[i].route_id + ')">' + finalStopsMap[i].route_short_name; +'</a>';
            servedByRoutesMap += '<a href="#route-details?routeId=' + finalStopsMap[i].route_id + ')">' + finalStopsMap[i].route_short_name; +'</a>';
        }
    }
}
function filterStops(chosenRouteId) {
    if (chosenRouteId == "all") {
        clearStopsFilter();
    } else {
        var selection = $('#stopTable tr').slice(1)
        $('#stopTable tr:hidden').show();
        for (i = 0; i < selection.length; i++) {
            if (selection[i].id != chosenRouteId) {
                $('tr[id=' + selection[i].id + ']').hide();
            }
        }
    }
}
function clearStopsFilter() {
    $('#noStops').remove();
    $('#stopTable tr:hidden').show();
}
function onFindStopClick(){
    var searchTerm = $("#tbStop").val();

    if (searchTerm){
        if (searchTerm && (searchTerm == parseInt(searchTerm))) {
            window.location.hash = "#stops?stopId=" + searchTerm;
        } else {
            window.location.hash = "#map?search=" + searchTerm;
        }
    }
    
}


// -------- Map ----------
function loadMap() {
    $("#appPage").load("/common/map.html", function () { initializeMap(); });
}
function initializeMap() {
    //setHistory("map");

    $('#searchStops').keypress(function (e) {
        if (e.which == 13) {
            codeAddressMap();
        }
    });
    bounds = new google.maps.LatLngBounds(new google.maps.LatLng(48.410863, -122.904638), new google.maps.LatLng(49.004438, -121.595991));
    geocoder = new google.maps.Geocoder();
    mapStyles = [
        {
            featureType: "transit.station.bus",
            stylers: [
                  { visibility: "off" }
            ]
        }
    ];
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
        if (mapOptions == undefined) {
            mapOptions = {
                center: { lat: 48.755893, lng: -122.520776 },
                zoom: 12,
                styles: mapStyles
            };
        }
    } else {
        mapOptions = {
            center: { lat: 48.755893, lng: -122.520776 },
            zoom: 12,
            styles: mapStyles
        };
    }
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    busLayer = new google.maps.KmlLayer({
        url: 'http://www.ridewta.com/files/file/maps/2015/Stops.kml',
        preserveViewport: true
    });
    google.maps.event.addListener(map, 'zoom_changed', function () {
        if (map.zoom < 15) {
            busLayer.setMap(null);
        } else {
            busLayer.setMap(map);
        }
    });
    if (map.zoom < 15) {
        busLayer.setMap(null)
    } else {
        busLayer.setMap(map);
    }
    google.maps.event.addListener(busLayer, 'click', function (e) {
        deleteMarkers();
        kmlStopId = (e.featureData.description).substring(9);
        stopIdVariable = kmlStopId;
        servingRoutesMap();
        var kmlStop = $.grep(stops, function (a) {
            return a.stop_id == kmlStopId;
        });
        if (kmlStopId.length == 3) {
            kmlStopId = '0' + kmlStopId
        }
        kmlStopCode = kmlStop[0].stop_code;
        kmlStopName = kmlStop[0].stop_name;
        e.featureData = {
            //'infoWindowHtml': '<h4 style="text-decoration: underline">' + kmlStopName + '</h4><table class="table table-striped table-hover table-bordered"><tr><th>Stop ID</th><th>Served By</th><tr><td><a href="javascript:loadStops(' + kmlStopCode + ')">' + kmlStopCode + '</a></td><td id="servedByRoutes">' + servedByRoutesMap + '</td></tr></table>'
            'infoWindowHtml': '<h4 style="text-decoration: underline">' + kmlStopName + '</h4><table class="table table-striped table-hover table-bordered"><tr><th>Stop ID</th><th>Served By</th><tr><td><a href="#stops?stopId=' + kmlStopCode + '">' + kmlStopCode + '</a></td><td id="servedByRoutes">' + servedByRoutesMap + '</td></tr></table>'
        }
    });

    fillStopsMap();
}
function showPosition(position) {
    mapOptions = {
        center: { lat: position.coords.latitude, lng: position.coords.longitude },
        zoom: 16,
        styles: mapStyles
    };
}
function codeAddressMap() {
    var center;
    var address = document.getElementById('searchStops').value;
    if (address.length == 3 || address.length == 4) {
        //search the stop_codes for the matching
        var stopCodeResult = $.grep(stops, function (a) {
            return a.stop_code == address;
        });
        //if match is found
        if (stopCodeResult.length == 0 || stopCodeResult.length > 1) {
            //Geocode normally, what they input isn't a valid stop_code
            geocoder.geocode({ 'address': address, 'bounds': bounds }, function (results, status) {
                center = results[0].geometry.location;
                if (status == google.maps.GeocoderStatus.OK) {
                    if (center.k < 49.004438 && center.k > 48.410863 && center.D < -121.595991 && center.D > -122.904638) {
                        map.setCenter(results[0].geometry.location);
                        map.setZoom(17);
                    } else {
                        alert('There were no results within our service area. Please check the stop number you entered and try again.');
                    }
                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });
        } else {
            //grab the latlng from this stop and use it to center and zoom the map
            stopIdVariable = stopCodeResult[0].stop_id;
            kmlStopName = stopCodeResult[0].stop_name;
            kmlStopCode = stopCodeResult[0].stop_code;
            servingRoutesMap();
            var x = stopCodeResult[0].stop_lat;
            var y = stopCodeResult[0].stop_lon;
            var stopPos = new google.maps.LatLng(x, y);
            map.setCenter(stopPos);
            map.setZoom(17);
            var infoWindow = new google.maps.InfoWindow({
                content: '<h4 style="text-decoration: underline">' + kmlStopName + '</h4><table class="table table-striped table-hover table-bordered"><tr><th>Stop ID</th><th>Served By</th><tr><td><a href="#stops?stopId=' + kmlStopCode + '">' + kmlStopCode + '</a></td><td id="servedByRoutes">' + servedByRoutesMap + '</td></tr></table>'
            });
            var marker = new google.maps.Marker({
                position: stopPos,
                map: map,
                visible: false
            });
            infoWindow.open(map, marker);
            markers.push(marker);
        }
    } else {
        geocoder.geocode({ 'address': address, 'bounds': bounds }, function (results, status) {
            center = results[0].geometry.location;
            if (status == google.maps.GeocoderStatus.OK) {
                if (center.k < 49.004438 && center.k > 48.410863 && center.D < -121.595991 && center.D > -122.904638) {
                    //we are within the bounds, go ahead and display
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(17);
                } else {
                    //we are outside bounds, do something to let user know their search didn't yield any relevant results
                    alert('There were no results within our service area. Please check the address you entered and try again.');
                }
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
}
function setAllMap(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}
function clearMarkers() {
  setAllMap(null);
}
function deleteMarkers() {
  clearMarkers();
  markers = [];
}
function fillStopsMap() {
    if (stopQuery) {
        $('#searchStops')[0].value = stopQuery;
        codeAddressMap();
    }
}

// -------- GEO functions ---------
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(saveLocation, showError);
        $(".usecurrent").show();
    }
    else {
        $(".usecurrent").hide();
    }
}
function saveLocation(position) {
    currentLocation = position.coords.latitude + ' ' + position.coords.longitude;
}
function useCurrentStart() {
    if (currentLocation) {
        $("#tbStartLocation").val(currentLocation);
    }    
}
function useCurrentEnd() {
    if (currentLocation) {
        $("#tbEndLocation").val(currentLocation);
    }
}
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            //x.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            //x.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            //x.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            //x.innerHTML = "An unknown error occurred."
            break;
    }
}


// ------------------ Data functions -----------------
// Gets array of route and sorts by route_short_name
function getRoutes() {
    //var myRoutes = Enumerable.From(trips)
    //    .Join(routes, "$.route_id", "$.route_id", "{service_id:$.service_id, route_id:$.route_id, route_short_name:$$.route_short_name, trip_headsign:$.trip_headsign, direction_id:$.direction_id}")
    //    .Where("$.service_id == 1")
    //    .Distinct("$.route_id + $.trip_headsign + $.direction_id")
    //    .OrderBy("$.route_short_name")
    //    .ToArray();    

    var myRoutes = routes;

    // Need to convert to number and sort.
    myRoutes.sort(function (a, b) {
        a = Number(String(a.route_short_name).replace(/\D/g, ''));
        b = Number(String(b.route_short_name).replace(/\D/g, ''));
        var a1 = typeof a, b1 = typeof b;
        return a1 < b1 ? -1 : a1 > b1 ? 1 : a < b ? -1 : a > b ? 1 : 0;
    });
    return myRoutes;
}
// Gets the route for given routeID
function getRoute(routeID) {
    if (!routeList) { routeList = getRoutes(); }
    var route = $.grep(routeList, function (a) {
        return a.route_id == routeID;
    });
    if (route) { return route[0]; }
    else { return null}
}

function getStop(stopID) {
    var stop = Enumerable.From(stops)
        .Where("$.stop_code == " + stopID)
        .ToArray();
    if (stop) {
        stop = stop[0]
    }
    return stop;
}


// ---- Global Navigation functions ----------
function BindTopNav() {
    /*grab top nav SP generated list*/
    var u = $('#topnavbar ul.root');
    if (u.length > 0) {
        /*loop through every nav item that has dynamic children*/
        u.find('li.dynamic-children').each(function () {
            /*get li's menu item, either a or span*/
            var a = $(this).children('.menu-item');
            var s = a.children('span').eq(0);
            var t = s.children('span.menu-item-text').eq(0);
            /*override parent li hover event to show dropdown*/
            $(this).hover(
				function () { HoverTopNav($, $(this), ''); },
				function () { HoverTopNav($, $(this), 'o'); }
			);
            if (a.is('span')) {
                a.bind('click', function (e) {
                    DropTopNav($, $(this));
                    return false;
                });
                s.bind('click', function (e) {
                    DropTopNav($, $(this).parent());
                    return false;
                });
            }
            else {
                a.bind('click', function (e) {
                    //if click occured inside of a text span, then redirect
                    if (((e.pageX >= t.offset().left) && (e.pageX <= (t.offset().left + t.outerWidth(true)))) &&
						((e.pageY >= t.offset().top) && (e.pageY <= (t.offset().top + t.outerHeight(true))))) {
                        return true;
                    }
                    else
                        DropTopNav($, $(this).eq(0));
                    return false;
                });
                /*need to trap link span too for some browsers*/
                s.bind('click', function (e) {
                    //if click occured inside of a text span, then redirect
                    if (((e.pageX >= t.offset().left) && (e.pageX <= (t.offset().left + t.outerWidth(true)))) &&
						((e.pageY >= t.offset().top) && (e.pageY <= (t.offset().top + t.outerHeight(true))))) {
                        window.location.href = $(this).parent('a').eq(0).attr('href');
                    }
                    else
                        DropTopNav($, $(this).parent('a').eq(0));
                    return false;
                });

            }
        });
    }
}
function HoverTopNav($, l, a) {
    if (l.length > 0) {
        var m = $('.navbar-toggle');
        if (m.length > 0) {
            /*only down dropdown on hover if not mobile nav view*/
            if (m.css('display') == 'none')
                DropTopNav($, l.children('.menu-item').eq(0), a);
        }
    }
}
function DropTopNav($, l, a) {
    if (l.length > 0) {
        var u = l.siblings('ul').eq(0);
        var p = l.parent();
        if (u.length > 0) {
            /*if the sub menu is hidden, then show or visa-versa*/
            if (p.hasClass('shown') || (a == 'o')) {
                p.removeClass('shown');
                u.attr('style', '');
            }
            else {
                p.addClass('shown');
            }
            // Following code attempts to keep mega menu dropdown on screen by positioning left or right depending on width of dropdown.
            if ($(window).width() > 767) {
                var ddRightEdge = u.offset().left + u.width();
                if (ddRightEdge > ($(window).width() - 20)) {
                    u.attr('style', 'left: -' + (ddRightEdge - ($(window).width() - 20)) + 'px !important;  position:absolute !important;');
                }
            }
        }
    }
}

