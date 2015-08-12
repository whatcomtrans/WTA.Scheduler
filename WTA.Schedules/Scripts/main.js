// locals
var currentRouteID, currentRouteNumber, currentStopID, routeList, map,
    trip_headsign, servedByRoutes, servedByRoutesMap, finalStops, finalStopsMap, specialServiceDate,
    map, busLayer, mapOptions, currentLocation, mapStyles, geocoder, kmlStopCode, kmlStopName, kmlStopId, chosenRoute, chosenRouteId,
    stopIdVariable, bounds, panorama, stopNameVariable, stopVariable, stopQuery, pagerTimeout, $tableHeader, $tableHeaderClone, tableHeaderTop, $tableContainer, $table;
var currentDirectionID = 0;
var currentServiceID = 1; // Weekdays
var currentDate = new Date();
var entryPanoId = null;
var scrollToTop = false;
var searchURL = "http://test.ridewta.com/search/pages/results.aspx?k=";
var markers = [];

$(document).ready(function () {
    //window.onpopstate = onPopState;
    $(window).on('hashchange', function () {
        loadPageContent();
    });
    loadMain();
});

function lookupRouteID(routeNum) {
  if (!routeList) { routeList = getRoutes(); }
  var route = $.grep(routeList, function (a) {
      return a.route_short_name == routeNum;
  });
  if (route) { return route[0].route_id; }
  else { return null}
}

function getQueryParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function loadQueryParams() {
    //RouteId
    var routeId = getQueryParameterByName("routeId");
    if (routeId && (routeId == parseInt(routeId))) {
        //currentRouteID = routeId;
        validateRouteId(routeId);
    }
    else {
        currentRouteID = null;
    }
    //routeNum
    var routeNum = getQueryParameterByName("routeNum");
    if (routeNum) {
      var foundRouteId = lookupRouteID(routeNum);
      if (foundRouteId) {
        validateRouteId(foundRouteId);
      }
    } else {
      routeNum = null;
    }

    //StopId
    var stopId = getQueryParameterByName("stopId");
    if (stopId && (stopId == parseInt(stopId))) {
        //currentStopID = stopId;
        validateStopId(stopId);
    } else {
        currentStopID = null;
    }
    //DirectionId
    var dirId = getQueryParameterByName("directionId");
    if (dirId) {
        validateDirId(dirId);
    } else {
        currentDirectionID = 0;
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
    window.setTimeout(loadTripData, 500)
    loadPageContent();
}

function loadTripData(callback) {
    if (typeof trips != 'undefined') {
        callback;
    } else {
        var oScript = document.createElement("script");
        oScript.type = "text\/javascript";
        oScript.onload = callback;
        (document.head || document.getElementsByTagName("head")[0]).appendChild(oScript);
        oScript.src = "http://data.ridewta.com/gtfs/website/data_trips.js";
    }
}

function loadPageContent() {
    // Clear Google map stuff. This isn't 100% working yet
    try{
        google.maps.event.clearListeners(window, 'resize');
        $('#map-canvas').remove();
    }
    catch(e){}

    loadQueryParams();

    // If we have a hash then load that section otherwise load Routes
    var hash = window.location.hash.split("?")[0].replace("#","");
    switch (hash) {
        case "route-details":
            loadTripData(loadRouteDetails(currentRouteID));
            break;
        case "map":
            loadTripData(loadMap());
            break;
        case "stops":
            loadTripData(loadStops(currentStopID));
            break;
        case "routes":
        default:
            hash = "routes";
            loadRoutes();
            break;
    }
    setHistory(hash);
}
function setLeftnav(item) {
    $("#leftNav ul li").removeClass("selected");
    $(item).addClass("selected");
}
// ----------- History -------------------
function setHistory(appPage) {

    //var params = "";
    //switch (appPage) {
    //    case "routes":
    //        history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage);
    //        console.log("setHistory: " + appPage);
    //        break;
    //    case "route-details":
    //        if (currentRouteID) { params = "?routeId=" + currentRouteID }
    //        history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage + params);
    //        console.log("setHistory: " + appPage);
    //        break;
    //    case "map":
    //        if (stopQuery) { params = "?search=" + encodeURIComponent(stopQuery) }
    //        history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage + params);
    //        console.log("setHistory: " + appPage);
    //        break;
    //    case "stops":
    //        if (currentStopID) { params = "?stopId=" + currentStopID }
    //        history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage + params);
    //        console.log("setHistory: " + appPage);
    //        break;
    //    default:
    //        history.pushState({ page: appPage, currentRouteID: currentRouteID, currentStopID: currentStopID }, appPage, "#" + appPage);
    //        console.log("setHistory: " + appPage);
    //        break;
    //}
}
function onPopState(event) {
    //console.log("popState: " + event.state)
    //if (event.state) {
    //    switch (event.state.page) {
    //        case "routes":
    //            loadRoutes();
    //            break;
    //        case "route-details":
    //            if (event.state.currentRouteID) { currentRouteID = event.state.currentRouteID; }
    //            loadRouteDetails(currentRouteID);
    //            break;
    //        case "map":
    //            loadMap();
    //            break;
    //        case "stops":
    //            if (event.state.currentStopID) { currentStopID = event.state.currentStopID; }
    //            loadStops();
    //            break;
    //    }
    //}
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
    //getLocation();
    $("#fdate").datepicker({ dateFormat: "mm/dd/y" }).datepicker("setDate", new Date());
    // Route dropdown
    if (!routeList) {
        routeList = getRoutes();
    }
    var selRoutes = $("#selRoutes");
    for (i = 0; i < routeList.length; i ++) {
        selRoutes.append("<option value='" + routeList[i].route_id + "'>" + routeList[i].route_short_name + "</option>");
    }
    $("#findRoute").click(findRouteClick);
    $('#findStop').click(onFindStopClick);
    $('#tbStop').keypress(function (e) {
        if (e.which == 13) {
            //onFindStopClick();
            $('#findStop').trigger('click');
        }
    });


    // Notices
    var noticeList = $("#noticeList");
    for (i = 0; i < notices.length; i ++) {
        noticeList.append("<li>" + notices[i].title + "</li>");
    }
}

function showLoading() {
    $("#appPage").hide();
    $(".spinner-cont").show();
    //$("#appPage").load("/common/loading.html");
}
function hideLoading() {
    $(".spinner-cont").hide();
    $("#appPage").show();
}
function scrollContentTop() {
    if(isElementInViewport($("#appPage")) == false){
        $('html,body').animate({
            scrollTop: $("#appPage").offset().top
        }, 'fast');
    }
}
function isElementInViewport(content) {
    if (typeof jQuery === "function" && content instanceof jQuery) {
        content = content[0];
    }
    var rect = content.getBoundingClientRect();
    return ( rect.top >= 0 );
}

// -------- Routes ----------
function loadRoutes() {
    $("#appPage").load("/common/routes.html", function () { initializeRoutes(); });
    setLeftnav("#lnavRoutes");
}
function initializeRoutes() {
    //setHistory("routes");
    if (!routeList) {
        routeList = getRoutes();
    }
    var ulRoutes = $("#routeList");
    for (i = 0; i < routeList.length; i++) {
        var longName = routeList[i].route_long_name;        
        longName = longName.replace('&harr;', '<i class="fa fa-arrows-h"></i>');
        ulRoutes.append("<li><span class='route-num'><a href='#route-details?routeId=" + routeList[i].route_id + "' class='route-num'>" + routeList[i].route_short_name + "</a></span><a href='#route-details?routeId=" + routeList[i].route_id + "'>" + longName + "</a></li>");
    }
}

// -------- Route Details ----------
function loadRouteDetails(route_id) {
    currentRouteID = route_id;
    $("#appPage").load("/common/route-details.html", function () { initializeRouteDetails(); });
    setLeftnav("#lnavRouteDetails");
}
function initializeRouteDetails() {
    //setHistory("route-details")
    // Get main route info
    // If no route number selected go back to routes
    if (currentRouteID){

        //$("#dayTabs").tabs({
        //    activate: function (event, ui) {
        //        var active = $('#dayTabs').tabs('option', 'active');
        //        thisDay($("#dayTabs ul>li a").eq(active).html());
        //    }
        //});
        $("#dayTabs").tabs({ activate: onRouteTabChanged });

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
        var todaysDate = new Date();
        $(function () {
            $('#datepicker').datepicker({
                dateFormat: 'DD, MM d, yy',
                minDate: todaysDate,
                showOn: "both",
                buttonText: "<i class='fa fa-calendar'></i>"
            });
        });

        //Fill the drop-down with existing route options from the routes.json file on load
        var option = '';
        for (i = 0; i < routes.length; i++) {
            option += '<option value="' + routes[i].route_short_name + '" id="' + routes[i].route_id + '">' + routes[i].route_short_name + '</option>';
        }
        $('#routeList').append(option);
        if (currentRouteID) {
            $('#routeList option[id="' + currentRouteID + '"]').attr('selected', 'selected');
        }
        //Change the header of the page based on the selected route from the drop down
        //hash change here
        $('#routeList').on('change', function () {
            currentRouteNumber = this.value;
            currentRouteID = $(this).children(":selected").attr("id");
            window.location.href = "#route-details?routeId=" + currentRouteID;
            //displaySelectedRouteAsync();
        });
        $('#routeList').on('click', function () {
            $(this).removeClass('highlight');
        });

        //Set paging button events
        $(".page-button.left").mousedown(function(){
            pagerTimeout = setInterval(function(){
                pageLeft();
            }, 100)
        });
        $(".page-button.right").mousedown(function () {
            pagerTimeout = setInterval(function () {
                pageRight();
            }, 100)
        });
        $(document).mouseup(function(){
            clearInterval(pagerTimeout);
            return false;
        });

        $('#datepicker').on('change', onRouteDatepickerChanged);

        $('#stopListStart').on('change', function () {
            $('#stopListEnd').empty();
            var selectedIndex = $('#stopListStart option:selected').index();
            var selectedStop = this.value;
            var selectedStopId = $(this).children(":selected").attr("id");
            var availableStopsEnd = $('#busTable tr:eq(' + 0 + ') td span.top');
            var endingOptions = '';
            for (i = selectedIndex; i < availableStopsEnd.length; i++) {
                //endingOptions += '<option value="' + availableStopsEnd[i].innerHTML + '" id="' + availableStopsEnd[i].id + '">' + availableStopsEnd[i].innerHTML + '</option>';
                endingOptions += '<option value="' + $(availableStopsEnd[i]).text() + '" id="' + $(availableStopsEnd[i]).attr("data-stopid") + '">' + $(availableStopsEnd[i]).text() + '</option>';
            }
            $('#stopListEnd').append(endingOptions);
        });

        displaySelectedRouteAsync();
        scrollContentTop();
    }
    else {
        loadRoutes();
    }
}
function onRouteDatepickerChanged(e) {
    currentDate = e.target.value;
    currentDate = currentDate.split(',')[0];
    thisDay(currentDate);
}
function onRouteTabChanged(event, ui) {
    var day = ui.newTab[0].textContent;
    thisDay(day);
}

var sync = function(){
    $tableHeaderClone.scrollLeft(this.scrollLeft);
}
function setStickyHeader() {
    // Set sticky table header
    $tableHeader = $("#stopNames");
    $tableHeaderClone = $("#stopNames").clone();
    // Need to set each table header cells' width or they don't line up correctly
    var tds = $('TD div', $tableHeader);
    var tdsClone = $('TD div', $tableHeaderClone);
    for (var i = 0; i < tds.length; i++) {
        var w = $(tds[i]).width()
        $(tdsClone[i]).width(w);
    }

    tableHeaderTop = $tableHeader.offset().top;
    $tableContainer = $("#schedule");
    $table = $('table', $tableContainer);
    // Resize clone when user resizes window.
    $(window).resize(function () {
        if ($tableHeader) {
            $tableHeaderClone.width($tableContainer.width() );
        }
    });

    $tableHeaderClone.css("width", $("#dayTabs").width()).css("overflow", "hidden");
    $(window).scroll(function () {
        if ($tableHeader) {
            if ($(window).scrollTop() > $tableHeader.offset().top
                && $(window).scrollTop() < ($table.offset().top + $table.height())) {
                if ($tableHeader.hasClass("hiddenHeader") == false) {
                    $tableHeader.addClass("hiddenHeader");
                    $("#busTable").prepend($tableHeaderClone);
                    $tableHeaderClone.addClass('fixedHeader');
                    var scrollPos = $tableContainer.scrollLeft();
                    $tableHeaderClone.scrollLeft(scrollPos);
                }
            }
            else {
                $tableHeader.removeClass("hiddenHeader");
                $tableHeaderClone.remove();
                $tableHeaderClone.removeClass('fixedHeader');
            }
        }
    });
    // Sync horizontal scrolling
    $tableContainer.on("scroll", sync)
}

function swapMapSize() {
    var rMap = $("#routeMap");
    if (rMap.hasClass("normal")) {
        rMap.animate({ width: "100%" }, "slow");
        rMap.removeClass("normal");
        $("i", rMap).removeClass("fa-search-plus");
        $("i", rMap).addClass("fa-search-minus");
        rMap.addClass("full");
        //$(".map-image a").html("Shrink >>");
    } else {
        var offset = rMap.offset();
        rMap.removeClass("full");
        rMap.addClass("normal");
        $("i", rMap).removeClass("fa-search-minus");
        $("i", rMap).addClass("fa-search-plus");
        rMap.animate({ width: "25%" }, "slow");
        //$(".map-image a").html("Expand >>");
        //$('html, body').animate({
        //    scrollTop: offset.top
        //});
    }
}
function findRouteClick() {
    var selRoute = $("#selRoutes").val();
    if (selRoute != 'selectRoute') {
        //hash change here
        window.location.href = "#route-details?routeId=" + selRoute;
        // loadRouteDetails(selRoute);
    }
}
function flipRoute() {
    if (currentDirectionID == 0) {
        currentDirectionID = 1;
    } else {
        currentDirectionID = 0;
    }
    displaySelectedRouteAsync();
    // Flip trip head signs
    var dir1 = $("#routeDir1").html();
    var dir2 = $("#routeDir2").html();
    $("#routeDir1").html(dir2);
    $("#routeDir2").html(dir1);
}
function thisDay(day) {
    $("#dayTabs").tabs({ activate: null });
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
    $("#dayTabs").tabs({ activate: onRouteTabChanged });
    throwTheDate();
    displaySelectedRouteAsync();
}
function displaySelectedRouteAsync() {
    //$('#datePicker').after('<div class="spinner"></div>');
    showLoading();
    if (typeof trips != "undefined") {
        setTimeout(function () { displaySelectedRoute();}, 1000);
    } else {
        loadTripData(currentRouteID);
    }
}
function displaySelectedRoute() {
    $('#noService').empty();
    try{
        $('#busTable').empty();
        $('.routeNumber').empty();
        //$('#datePicker').after('<div class="spinner"></div>');

        // populate heading
        var route = getRoute(currentRouteID);
        if (route) {
            $("#routeNumber").html("Route " + route.route_short_name);
            var directions = route.route_long_name.split("&harr;");
            routeDir0 = directions[0];
            routeDir1 = directions[1];
            if (routeDir1 === undefined) {
                $('#flipRoute').hide();
            } else {
                $('#flipRoute').show();
            }
            if (currentDirectionID == 0) {
                $("#routeDir1").html(routeDir0);
                $("#routeDir2").html(routeDir1);
            }
            else {
                $("#routeDir1").html(routeDir1);
                $("#routeDir2").html(routeDir0);
            }
            // Set map image if we have one.

            var imgMap = document.createElement('img');
            imgMap.onload = function () {
                $("#routeMap img").remove();
                $("#routeMap").prepend(imgMap);
            }
            imgMap.onerror = function () {
                $("#routeMap").hide();
            }
            imgMap.src = "/Images/maps/" + route.route_short_name + ".png";
        }
        
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
           // $('#stopNames').append('<td id="' + uniqueStopNamesInRoute[i].stop_id + '">' + uniqueStopNamesInRoute[i].stop_name + '</td>');
            //$('#stopNames').append('<td id="' + uniqueStopNamesInRoute[i].stop_id + '"><div><a data-stopid=' + uniqueStopNamesInRoute[i].stop_id + ' href="#stops?stopId=' + uniqueStopNamesInRoute[i].stop_code + '">' + uniqueStopNamesInRoute[i].stop_name + ' (' + uniqueStopNamesInRoute[i].stop_code + ')</a></div</td>');
            //$('#stopNames').append('<td id="' + uniqueStopNamesInRoute[i].stop_id + '"><div><a data-stopid=' + uniqueStopNamesInRoute[i].stop_id + ' href="#stops?stopId=' + uniqueStopNamesInRoute[i].stop_code + '">' + uniqueStopNamesInRoute[i].stop_name + ' <span>(' + uniqueStopNamesInRoute[i].stop_code + ')</span></a></div</td>');
            $('#stopNames').append('<td id="' + uniqueStopNamesInRoute[i].stop_id + '"><a href="#stops?stopId=' + uniqueStopNamesInRoute[i].stop_code + '"><div><span data-stopid=' + uniqueStopNamesInRoute[i].stop_id + ' class="top">' + uniqueStopNamesInRoute[i].stop_name + '</span><br/><span class="bottom">(' + uniqueStopNamesInRoute[i].stop_code + ')</span></div></a></td>');
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
                var columnId = parseInt($('#stopNames td:eq(' + (k) + ')').attr('id')); // This line is failing on iPad: Mike 3-24
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
                    firstStopTime.sort(function (a, b) {
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
                    //$(this).append('<td class="continuing" id="' + continuesOnAsRoute + ' ' + continuesOnAsDirection + '" onClick="continuingRoute(' + continuesOnAsRouteId + ', ' + currentServiceID + ', ' + continuesOnAsDirection + ', ' + continuesOnAsHeadsignVar + ');">' + continuesOnAs + '</td>');
                    $(this).append('<td class="continuing"><a href="#route-details?routeId=' + continuesOnAsRouteId + '&?directionId=' + continuesOnAsDirection + '">' + continuesOnAs + '</a></td>');
                }
            });
            // Reset vars for sticky table header
            setStickyHeader();
        }
        //Convert from military time right here
        //Step1- select all the td cells that's parent hasClass of tripTimes
        var cells = $('#busTable tr.tripTimes td');
        convertToStandard(cells);
        setTimeout(processContinuing, 100);
        selectedRoute = $('#routeList option[id="' + currentRouteID + '"]').attr('value');
        if (trip_headsign === -1) {
            if (isHoliday.length > 0) {
                $('#noService').append('There is no service during the holiday.');
            } else {
                $('#noService').append('There is no service for the specified route and time.');
            }
        } else {
            //$('#routeNumber').append('Route ' + selectedRoute + ' to ' + trip_headsign);
            $('#stopNames').append('<td><div class="continuesOnAs">Continues On As</div></td>');
        }
    } catch (e) { alert(e.message);}
    finally {
        //$('.spinner').remove();
        hideLoading();
    }
}

function uniqueStops(currentRouteID) {
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
    return uniqueStopNamesInRoute;
}

function customizeStopListStart() {
    $('#stopListStart').empty();
    $('#stopListStart').append('<option value="selectStopListStart" disabled>Starting Bus Stop</option>');
    var availableStops = $('#busTable tr:eq(' + 0 + ') td span.top');
    if (availableStops.length > 0) {
        var startingOptions = '';
        for (i = 0; i < availableStops.length; i++) {
            //startingOptions += '<option value="' + availableStops[i].innerHTML + '" id="' + availableStops[i].id + '">' + availableStops[i].innerHTML + '</option>';
            startingOptions += '<option value="' + $(availableStops[i]).text() + '" id="' + $(availableStops[i]).attr("data-stopid") + '">' + $(availableStops[i]).text() + '</option>';
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
    cellsRemaining.splice(0, 1);
    cellsRemaining.splice(0, 1);
    var cells = $('#busTable tr.tripTimes td');
    convertToMilitary(cells);
    $.each(cellsRemaining, function () {
        if ($(this)[0].innerHTML == '--') {
            $(this).parent().hide();
        } else if ($(this)[0].innerHTML >= timeStart && $(this)[0].innerHTML <= timeEnd) {
        } else {
            $(this).hide();
        }
    });
    var cells = $('#busTable tr.tripTimes td');
    convertToStandard(cells);
    var noRows = $('.tripTimes').is(':visible');
    if (noRows == false) {
        var startingStop = $('#stopListStart option:selected')[0].innerHTML;
        var endingStop = $('#stopListEnd option:selected')[0].innerHTML;
        $('#stopNames').hide();
        $('#busTable').append('<tr id="noStops"><td>Route ' + selectedRoute + ' to ' + trip_headsign + ' does not stop at both ' + startingStop + ' and ' + endingStop + ' between the specified times.</td></tr>');
    }
    setStickyHeader();
}
function convertToMilitary(cells) {
    $.each(cells, function() {
        if (($(this)[0].innerHTML.substr(-2) == 'am') && ($(this)[0].innerHTML.length == 7)) {
            //AM values between 1 and 9 don't change except for adding a leading 0 and removing the ' am'
            var time = $(this)[0].innerHTML.slice(0,4);
            $(this)[0].innerHTML = '0'+time;
        } else if (($(this)[0].innerHTML.substr(-2) == 'am') && ($(this)[0].innerHTML.length == 8) && ($(this)[0].innerHTML.slice(0,2) == '12')) {
            //12AM values, needs '00:'+minutes
            var minutes = $(this)[0].innerHTML.slice(3,5);
            $(this)[0].innerHTML = '00:'+minutes;
        } else if (($(this)[0].innerHTML.substr(-2) == 'am') && ($(this)[0].innerHTML.length == 8)) {
            //AM values between 10 and 11 don't change except for remove the ' am'
            $(this)[0].innerHTML = $(this)[0].innerHTML.slice(0,5);
        } else if (($(this)[0].innerHTML.substr(-2) == 'pm') && ($(this)[0].innerHTML.length == 7)) {
            //PM values between 1 and 9 remove the ' pm', convert the first character to an int and add 12
            var minutes = $(this)[0].innerHTML.slice(2,4);
            var hourPlus12 = parseInt($(this)[0].innerHTML.slice(0,1))+12;
            $(this)[0].innerHTML = hourPlus12+':'+minutes;
        } else if (($(this)[0].innerHTML.substr(-2) == 'pm') && ($(this)[0].innerHTML.length == 8) && ($(this)[0].innerHTML.slice(0,2) == '12')) {
            //12PM values, just remove the PM
            $(this)[0].innerHTML = $(this)[0].innerHTML.slice(0,5);
        } else if (($(this)[0].innerHTML.substr(-2) == 'pm') && ($(this)[0].innerHTML.length == 8)) {
            //PM values between 10 and 12 remove the ' pm', convert the first 2 characters to an int and add 12
            var minutes = $(this)[0].innerHTML.slice(3,5);
            var hourPlus12 = parseInt($(this)[0].innerHTML.slice(0,2))+12;
            $(this)[0].innerHTML = hourPlus12+':'+minutes;
        }
    });
}
function convertToStandard(cells) {
    //Step2- for each of them, check if they begin with a 0--if so, remove the 0 and append am to the end

    $.each(cells, function() {
        if (($(this)[0].innerHTML) == '--') {
        //do nothing
        } else if ($(this)[0].innerHTML.slice(0,2) == '00') {
        //0:00 through 0:59
            var minutes = $(this)[0].innerHTML.slice(3,5);
            $(this)[0].innerHTML = '12:'+minutes+' am';
        } else if ($(this)[0].innerHTML.slice(0,1) == '0') {
        //1:00AM through 9:59AM
            $(this)[0].innerHTML = $(this)[0].innerHTML.slice(1,5)+' am';
        } else if ($(this)[0].innerHTML.slice(0,2) == '10' || $(this)[0].innerHTML.slice(0,2) == '11') {
        //10:00 through 11:59
            $(this)[0].innerHTML = $(this)[0].innerHTML+' am';
        } else if ($(this)[0].innerHTML.slice(0,2) == '12') {
        //12:00 through 12:59
            var minutes = $(this)[0].innerHTML.slice(3,5);
            $(this)[0].innerHTML = '12:'+minutes+' pm';
        } else {
        //13:00 through 23:59 -- need to set a variable equal to the first two characters in the string, converted to an int and subtract 12
            var hourMinus12 = parseInt($(this)[0].innerHTML.slice(0,2))-12;
            var minutes = $(this)[0].innerHTML.slice(3,5);
            $(this)[0].innerHTML = hourMinus12 + ':' + minutes + ' pm';
        }
    });
}
function clearFilter() {
    $('#noStops').remove();
    $('#busTable tr:hidden').show();
    $('#busTable td:hidden').show();
    setStickyHeader();
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
            //next = selectedDate + (8 - previousDay);
            next = selectedDate - (8 - previousDay);
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
    //var d = new Date(prevYear, prevMonth, next).toLocaleDateString('en-US', dateConfig);
    var d = new Date(prevYear, prevMonth, next);
    $('#datepicker').attr('value', d);
    $(function () {
        $('#datepicker').datepicker('setDate', d);
        $('#datepicker').datepicker("option", "dateFormat", "DD, MM d, yy" );
    });
    var formattedPrevMonth = (prevMonth + 1).toString();
    if (formattedPrevMonth.length < 2) { formattedPrevMonth = '0' + formattedPrevMonth };
    var formattedNext = next.toString();
    if (formattedNext.length < 2) { formattedNext = '0' + formattedNext };
    var specDate = prevYear + '' + formattedPrevMonth + '' + formattedNext;
    specialServiceDate = specDate;
}
function pageLeft() {
    var pos = $("#schedule").scrollLeft();
    $("#schedule").scrollLeft(pos - 100);
}
function pageRight() {
    var pos = $("#schedule").scrollLeft();
    $("#schedule").scrollLeft(pos + 100);
}



// -------- Stops ----------
function loadStops(stopId) {
    currentStopID = stopId;
    $("#appPage").load("/common/stops.html", function () { initializeStops(); });
    setLeftnav("#lnavStops");
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
    $("#dayTabs").tabs({ activate: onStopTabChanged });


    $('#searchStops').keypress(function (e) {
        if (e.which == 13) {
            directSearch();
        }
    });
    $('#searchStops').on('focus', function (e) {
        $(this).removeClass('pulse');
    });
    $('#scheduleFor').on('change', function () {
        chosenRoute = this.value;
        chosenRouteId = $(this).children(":selected").attr("id");
        //filterStops(chosenRouteId);
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

    $('#datepicker').on('change', onStopDatepickerChanged);

    if (currentStopID) {
        $('#stopNameHeader')[0].innerHTML = stopNameVariable;
        $("#searchStops").val(currentStopID);
        displaySelectedStop();
    } else {
        $('#searchStops').addClass('pulse');
        setTimeout(function () { $('#searchStops').removeClass('pulse') }, 6500);
    }
}
function onStopDatepickerChanged(e) {
    currentDate = e.target.value;
    currentDate = currentDate.split(',')[0];
    thisDayStops(currentDate);
}
function onStopTabChanged(event, ui) {
    var day = ui.newTab[0].textContent;
    thisDayStops(day);
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
    if (searchTerm.length > 0) {
        if (searchTerm.length == 4 && (searchTerm == parseInt(searchTerm))) {
            if (validateStopId(searchTerm)) {
                //hash change here
                window.location.href = "#stops?stopId=" + searchTerm;
                //displaySelectedStop();
            }
            else {
                window.location.href = "#map?search=" + searchTerm;
            }
        }
        else {
            window.location.href = "#map?search=" + searchTerm;
        }
    }
}
function directMap() {
    var stopCode = document.getElementById('selectedStopId').innerHTML;
    if (stopCode.length == 4) {
        window.location.href = "#map?search=" + stopCode;
    } else {
        window.location.href = "#map";
    }
}
function thisDayStops(day) {
    $("#dayTabs").tabs({ activate: null });
    $('#dayTabs div').removeClass('selectedDay');
    if (day == 'Weekday' || day == 'Monday' || day == 'Tuesday' || day == 'Wednesday' || day == 'Thursday' || day == 'Friday') {
        currentServiceID = 1;
        $('#Weekday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
        $("#dayTabs").tabs("option", "active", 0);
    } else if (day == 'Saturday') {
        currentServiceID = 2;
        $('#Saturday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
        $("#dayTabs").tabs("option", "active", 1);
    } else if (day == 'Sunday') {
        currentServiceID = 3;
        $('#Sunday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
        $("#dayTabs").tabs("option", "active", 2);
    } else if (day == 'Street View') {
        $('#StreetView').addClass('selectedDay');
        $('#printThis').hide();
        $('#map-canvas').show();
        $("#dayTabs").tabs("option", "active", 3);
        panorama.setVisible(true);
    }
    $("#dayTabs").tabs({ activate: onStopTabChanged });
    throwTheDate();
    displaySelectedStop();
}
function displaySelectedStop() {
    // get Stop info and populate header if found
    var stop = getStop(currentStopID);

    if (stop) {
        stopIdVariable = stop.stop_id;
        stopNameVariable = stop.stop_name;

        //Add the city/zip info below the stop name
        var currentStopLatLng = $.grep(stops, function(a) {
            return a.stop_code == currentStopID;
        });
        var LatLng = new google.maps.LatLng(currentStopLatLng[0].stop_lat,currentStopLatLng[0].stop_lon);

        geocode.geocode({ 'latLng': LatLng  }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var city, zip;

                for (h=0;h<results.length;h++) {
                    for (i=0;i<results[0].address_components.length;i++) {
                        for (j=0;j<results[0].address_components[i].types.length;j++) {
                            if (results[0].address_components[i].types[j] == "locality") {
                                city = results[0].address_components[i].long_name;
                            }
                            if (results[0].address_components[i].types[j] == "postal_code") {
                                zip = results[0].address_components[i].long_name;
                            }
                        }
                    }
                }

                $('#cityZip').text(city + ', ' + zip);
                //$('#cityZip').text(results[0].formatted_address);
            }
        });

        $('#stopTable').empty();
        $('#stopTable').append('<tr><th>Time</th><th>Route</th></tr>');
        $('#stopNameHeader')[0].innerHTML = stop.stop_name;
        $('#selectedStopId')[0].innerHTML = currentStopID;
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
        return (a.stop_id == stopIdVariable && a.pickup_type != 1);
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

    // Sort
    finalStops.sort(function (a, b) {
        a = Number(String(a.route_short_name).replace(/\D/g, ''));
        b = Number(String(b.route_short_name).replace(/\D/g, ''));
        var a1 = typeof a, b1 = typeof b;
        return a1 < b1 ? -1 : a1 > b1 ? 1 : a < b ? -1 : a > b ? 1 : 0;
    });

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
        //Add leading 0 to 4 digit times
        if (currentTime.length == 4) {
            currentTime = '0' + currentTime;
        }
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
    //convert the times to standard format here
    var cells = $('#stopTable tr td:nth-child(1)');
    convertToStandard(cells);

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
    // Sort
    finalStopsMap.sort(function (a, b) {
        a = Number(String(a.route_short_name).replace(/\D/g, ''));
        b = Number(String(b.route_short_name).replace(/\D/g, ''));
        var a1 = typeof a, b1 = typeof b;
        return a1 < b1 ? -1 : a1 > b1 ? 1 : a < b ? -1 : a > b ? 1 : 0;
    });
    for (i = 0; i < finalStopsMap.length; i++) {
        if (i > 0) {
            //servedByRoutesMap += ', <a href="index.html?' + finalStopsMap[i].route_id + '">' + finalStopsMap[i].route_short_name + '</a>';
            //servedByRoutesMap += ', <a href="javascript:loadRouteDetails(' + finalStopsMap[i].route_id + ')">' + finalStopsMap[i].route_short_name + '</a>';
            servedByRoutesMap += ', <a href="#route-details?routeId=' + finalStopsMap[i].route_id + '">' + finalStopsMap[i].route_short_name + '</a>';
        } else {
            //servedByRoutesMap += ', <a href="javascript:loadRouteDetails(' + finalStopsMap[i].route_id + ')">' + finalStopsMap[i].route_short_name + '</a>';
            //servedByRoutesMap += '<a href="javascript:loadRouteDetails(' + finalStopsMap[i].route_id + ')">' + finalStopsMap[i].route_short_name; +'</a>';
            servedByRoutesMap += '<a href="#route-details?routeId=' + finalStopsMap[i].route_id + '">' + finalStopsMap[i].route_short_name; +'</a>';
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
function onFindStopClick(e){
    var searchTerm = $("#tbStop").val();
    if (searchTerm.length > 0) {
        if (searchTerm.length == 4 && (searchTerm == parseInt(searchTerm))) {
            if (validateStopId(searchTerm)) {
                window.location.href = "#stops?stopId=" + currentStopID;
            }
            else {
                window.location.href = "#map?search=" + searchTerm;
            }
        }
        else {
            window.location.href = "#map?search=" + searchTerm;
        }
    }

}


// -------- Map ----------
function loadMap() {
    $("#appPage").load("/common/map.html", function () { initializeMap(); });
    setLeftnav("#lnavMap");
}
function initializeMap() {
    //setHistory("map");
    directionsDisplay = new google.maps.DirectionsRenderer();
    $('#searchStops').keypress(function (e) {
        if (e.which == 13) {
            codeAddressMap();
        }
    });
    bounds = new google.maps.LatLngBounds(new google.maps.LatLng(48.410863, -122.904638), new google.maps.LatLng(49.004438, -121.595991));
    geocoder = new google.maps.Geocoder();
    mapStyles = [
        {
            "featureType": "transit.station.bus",
            "stylers": [
                  { "visibility": "off" }
            ]
        },
        {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#A8A8A8"
            }
        ]
    }
    ];
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            mapOptions = {
                center: { lat: position.coords.latitude, lng: position.coords.longitude },
                zoom: 16,
                styles: mapStyles,
                zoomControl: false,
                scrollwheel: true,
                draggable: true,
                keyboardShortcuts: true
            };
            finishInit();
        });
    } else {
        mapOptions = {
            center: { lat: 48.750057, lng: -122.476085 },
            zoom: 12,
            styles: mapStyles,
            zoomControl: false,
            scrollwheel: true,
            draggable: true,
            keyboardShortcuts: true
        };
        finishInit();
    }
}
function finishInit() {
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('directionsPanel'));
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
    google.maps.event.addListenerOnce(map, 'idle', function(){
    // do something only the first time the map is loaded
    //@mapCopyright - gets the google copyright tags
        var mapCopyright=document.getElementById('map-canvas').getElementsByTagName("a");
        $(mapCopyright).click(function(){
            return false;
        });
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
    scrollContentTop();
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
                    if (center.lat() < 49.004438 && center.lat() > 48.410863 && center.lng() < -121.595991 && center.lng() > -122.904638) {
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
            if (status == google.maps.GeocoderStatus.OK) {
                center = results[0].geometry.location;
                if (center.lat() < 49.004438 && center.lat() > 48.410863 && center.lng() < -121.595991 && center.lng() > -122.904638) {
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
    else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            currentLocation = position.coords.latitude + ' ' + position.coords.longitude;
            $("#tbStartLocation").val(currentLocation);
        });
    }
}
function useCurrentEnd() {
    if (currentLocation) {
        $("#tbEndLocation").val(currentLocation);
    }
    else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            currentLocation = position.coords.latitude + ' ' + position.coords.longitude;
            $("#tbEndLocation").val(currentLocation);
        });
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

function getStop(stopId) {
    var stop = null;
    if (stopId) {
        var stop = Enumerable.From(stops)
            .Where("$.stop_code == " + stopId)
            .ToArray();
        if (stop) {
            stop = stop[0]
        }
    }
    return stop;
}
function validateStopId(stopId) {
    // Technically we're validating stop_code since that's what we're passing around.
    // If stopId is found set local vars.
    var valid = false;
    if (stopId) {
        var stop = getStop(stopId);
        if (stop) {
            currentStopID = stop.stop_code;
            stopIdVariable = stop.stop_id;
            stopNameVariable = stop.stop_name;
            valid = true;
        } else {
            currentStopID = null;
            stopIdVariable = null;
            stopNameVariable = null;
            valid = false;
        }
    }
    return valid;
}
function validateDirId(dirId) {
    if (dirId == 0) {
        currentDirectionID = 0;
    } else if (dirId == 1) {
        currentDirectionID = 1;
    } else {
        currentDirectionID = 0;
    }
}
function validateRouteId(routeId) {
    // If routeId is found set local vars.
    var route = getRoute(routeId);
    if (route) {
        currentRouteID = route.route_id;
        //currentRouteNumber = route.route_short_name;
        return true;
    } else {
        currentRouteID = null;
        currentRouteNumber = null;
        return false;
    }
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
            if ($(window).width() > 840) {
                var ddRightEdge = u.offset().left + u.width();
                if (ddRightEdge > ($(window).width() - 20)) {

                    u.attr('style', 'left: -' + (ddRightEdge - ($(window).width() - 20)) + 'px !important;  position:absolute !important;');
                }
            }
        }
    }
}
