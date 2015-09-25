// locals
var currentRouteID, currentRouteNumber, currentStopID, routeList, map,
    trip_headsign, servedByRoutes, servedByRoutesMap, finalStops, finalStopsMap, specialServiceDate,
    map, busLayer, mapOptions, currentLocation, mapStyles, geocoder, kmlStopCode, kmlStopName, kmlStopId, chosenRoute, chosenRouteId,
    stopIdVariable, bounds, panorama, stopNameVariable, stopVariable, stopQuery, pagerTimeout, $tableHeader, $tableHeaderClone, tableHeaderTop, $tableContainer, $table;
var currentDirectionID = 0;
var currentServiceID = 1;
var currentDate = new Date();
var entryPanoId = null;
var scrollToTop = false;
if (language == "es") {
  var searchURL = "http://www.ridewta.com/search/pages/results.aspx?k=";
} else {
  var searchURL = "http://www.ridewta.com/search/pages/results.aspx?k=";
}
var markers = [];
var serviceChangeDate, serviceLastDate, currentDayNum;
currentDate = new Date();
currentDayNum = Date.parse(currentDate);
currentDayNum = new Date(currentDayNum);
currentDayNum = parseInt((currentDayNum.getFullYear().toString()) + (("0" + ((currentDayNum.getMonth()+1).toString())).slice(-2)) + (("0" + ((currentDayNum.getDate()).toString())).slice(-2)));
var weekday = new Array(7);
weekday[0]=  "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";
currentDate = weekday[d.getDay()];
$(document).ready(function () {
    $(window).on('hashchange', function () {
        loadPageContent();
        $('html, body').animate({
            scrollTop: 0
        }, 'medium');
        var page = "/" + window.location.hash;
        ga('set','page',page);
        ga('send','pageview',page);
    });
    loadMain();
});
//Function to convert any element(s) to another element(s) and retain its attributes. Call it like: $("h3").changeElementType("h1");
(function($) {
    $.fn.changeElementType = function(newType) {
        var attrs = {};
        $.each(this[0].attributes, function(idx, attr) {
            attrs[attr.nodeName] = attr.nodeValue;
        });
        this.replaceWith(function() {
            return $("<" + newType + "/>", attrs).append($(this).contents());
        });
    }
})(jQuery);
function lookupRouteID(routeNum) {
  routeNum = routeNum.toUpperCase();
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
    var routeId = getQueryParameterByName("routeId");
    if (routeId && (routeId == parseInt(routeId))) {
        validateRouteId(routeId);
    }
    else {
        currentRouteID = null;
    }
    var routeNum = getQueryParameterByName("routeNum");
    if (routeNum) {
      var foundRouteId = lookupRouteID(routeNum);
      if (foundRouteId) {
        validateRouteId(foundRouteId);
      }
    } else {
      routeNum = null;
    }
    var stopId = getQueryParameterByName("stopId");
    if (stopId && (stopId == parseInt(stopId))) {
        validateStopId(stopId);
    } else {
        currentStopID = null;
    }
    var dirId = getQueryParameterByName("directionId");
    if (dirId) {
        validateDirId(dirId);
    } else {
        currentDirectionID = 0;
    }
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
    $("#headerMain").load("/common/" + language + "/header.html", function () { initializeHeader(); });
    $("#sidebar").load("/common/" + language + "/sidebar.html", function () { initializeSidebar(); });
    $("#footer").load("/common/" + language + "/footer.html");
    $("#leftNav").load("/common/" + language + "/left-nav.html");
    window.setTimeout(function () { loadTripData }, 500)
    loadPageContent();
}
function loadTripData(callback) {
    if (typeof trips != 'undefined') {
        if (callback) { callback() };
    } else {
        var oScript = document.createElement("script");
        oScript.type = "text\/javascript";
        oScript.onload = function () { callback() };
        if (gzipEnabled) {
          oScript.src = "http://data.ridewta.com/gtfs/website/data_trips.js.gz";
        } else {
          oScript.src = "http://data.ridewta.com/gtfs/website/data_trips.js";
        }
        (document.head || document.getElementsByTagName("head")[0]).appendChild(oScript);
    }
}
function loadPageContent() {
    try{
        google.maps.event.clearListeners(window, 'resize');
        $('#map-canvas').remove();
    }
    catch(e){}
    loadQueryParams();
    var hash = window.location.hash.split("?")[0].replace("#","");
    switch (hash) {
        case "route-details":
            loadTripData(function () { loadRouteDetails(currentRouteID) });
            break;
        case "map":
            loadTripData(function () { loadMap() });
            break;
        case "stops":
            loadTripData(function () { loadStops(currentStopID) });
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
function searchSite() {
    var searchText = $("#searchInput").val().trim();
    if (searchText) {
        window.location = searchURL + encodeURIComponent(searchText);
    }
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
function initializeHeader() {
    BindTopNav();
    $("#searchInput").keypress(function (event) {
        if (event.keyCode == 13) {
            searchSite();
        }
    });
}
function initializeSidebar() {
    $("#fdate").datepicker({ dateFormat: "mm/dd/y" }).datepicker("setDate", new Date());
    var currentTime = new Date();
    currentTime = currentTime.getHours() + ":" + currentTime.getMinutes();
    $('#ftime').val(currentTime);
    if (!routeList) {
        routeList = getRoutes();
    }
    var selRoutes = $("#selRoutes");
    for (i = 0; i < routeList.length; i ++) {
        selRoutes.append("<option value='" + routeList[i].route_short_name + "'>" + routeList[i].route_short_name + "</option>");
    }
    $("#findRoute").click(findRouteClick);
    $('#findStop').click(onFindStopClick);
    $('#tbStop').keypress(function (e) {
        if (e.which == 13) {
            $('#findStop').trigger('click');
        }
    });
    var noticeList = $("#noticeList");
    for (i = 0; i < notices.length; i ++) {
        noticeList.append("<li><a href='" + notices[i].url + "'>" + notices[i].title + "</a></li>");
    }
}
function showLoading(element) {
    var items = $(element).children(':visible');
    items.hide();
    $(element).addClass('spinner');
    items.addClass('spinnerMark');
}
function hideLoading() {
    $('.spinner-cont').hide();
    $('.spinner').removeClass('spinner');
    $('.spinnerMark').show();
    $('.spinnerMark').removeClass('spinnerMark');
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
function loadRoutes() {
    $("#appPage").load("/common/" + language + "/routes.html", function () { initializeRoutes(); });
    setLeftnav("#lnavRoutes");
}
function initializeRoutes() {
    if (!routeList) {
        routeList = getRoutes();
    }
    var ulRoutes = $("#routeList");
    for (i = 0; i < routeList.length; i++) {
        var longName = routeList[i].route_long_name;
        longName = longName.replace('&harr;', '<i class="fa fa-arrows-h"></i>');
        ulRoutes.append("<li><span class='route-num'><a href='#route-details?routeNum=" + routeList[i].route_short_name + "' class='route-num'>" + routeList[i].route_short_name + "</a></span><a href='#route-details?routeNum=" + routeList[i].route_short_name + "'>" + longName + "</a></li>");
    }
}
function loadRouteDetails(route_id) {
    currentRouteID = route_id;
    $("#appPage").load("/common/" + language + "/route-details.html", function () { initializeRouteDetails(); });
    setLeftnav("#lnavRouteDetails");
}
function initializeRouteDetails() {
    if (currentRouteID){
        $('.routeNumber').empty();
        var route = getRoute(currentRouteID);
        if (route) {
            var directions = route.route_long_name.split("&harr;");
            routeDir0 = directions[0];
            routeDir1 = directions[1];
            var routeDirNum = 2;
            if (routeDir1 === undefined) {
                routeDirNum = 1;
            } else {
                routeDirNum = 2;
            }
            var routeDirOptions = '';
            for (i = 0; i < routeDirNum; i++) {
                routeDirOptions += '<option value="' + [i] + '" id="dir' + [i] + '">' + "to " + directions[i] + '</option>';
            }
            $('#selRouteDir').append(routeDirOptions);
            $("#routeNumber").html(lang("Route") + " " + route.route_short_name + " - <br />" + lang("to") + " " + directions[currentDirectionID]);
            if (route.route_color == "blue" ||
                route.route_color == "gold" ||
                route.route_color == "green" ||
                route.route_color == "red") {
                $(".go-line").attr("src", "../Images/go-" + route.route_color + ".jpg");
                $(".go-line").show();
            } else {
                $(".go-line").hide();
            }
            var imgMap = document.createElement('img');
            imgMap.onload = function () {
                $("#routeMap img").remove();
                $("#routeMap").prepend(imgMap);
                $('#routeMap img').attr('onClick', 'showMapDialog();');
            }
            imgMap.onerror = function () {
                $("#routeMap").hide();
            }
            imgMap.src = "http://data.ridewta.com/routemaps/" + route.route_short_name + ".png";
            $("#mapDialog img").attr("src", "http://data.ridewta.com/routemaps/" + route.route_short_name + ".png");
        }
        $('#selRouteDir').on('change', function () {
            if (currentDirectionID == $(this).children(":selected").attr("value")) {
                //don't re-run.
            } else {
                currentDirectionID = $(this).children(":selected").attr("value");
                $("#routeNumber").html(lang("Route") + " " + route.route_short_name + " - <br />" + lang("to") + " " + directions[currentDirectionID]);
                displaySelectedRouteAsync();
            }
        });
        $("#dayTabs").tabs({ activate: onRouteTabChanged });
        var day = new Date().getDay();
        var presentDate = new Date();
        var newDate = (presentDate.getDate()).toString();
        if (newDate.length < 2) { newDate = '0' + newDate; }
        var newMonth = (presentDate.getMonth() + 1).toString();
        if (newMonth.length < 2) { newMonth = '0' + newMonth; }
        var newYear = (presentDate.getFullYear()).toString();
        specialServiceDate = newYear + newMonth + newDate;
        var SSDint = parseInt(specialServiceDate);
        serviceChangeDate = parseInt(calendar[0].end_date);
        serviceLastDate = parseInt(calendar[4].end_date);
        if (day > 0 && day < 6) {
            if (SSDint <= serviceChangeDate) {
                $('#Weekday').addClass('selectedDay');
                currentServiceID = 1;
            } else if (SSDint > serviceLastDate) {
                $('#Weekday').addClass('selectedDay');
                currentServiceID = 999;
            } else {
                $('#Weekday').addClass('selectedDay');
                currentServiceID = 11;
            }
        }
        else if (day == 6) {
            if (SSDint <= serviceChangeDate) {
                $('#Saturday').addClass('selectedDay');
                currentServiceID = 2;
            } else if (SSDint > serviceLastDate) {
                $('#Saturday').addClass('selectedDay');
                currentServiceID = 999;
            } else {
                $('#Saturday').addClass('selectedDay');
                currentServiceID = 12;
            }
        }
        else if (day == 0) {
            if (SSDint <= serviceChangeDate) {
                $('#Sunday').addClass('selectedDay');
                currentServiceID = 3;
            } else if (SSDint > serviceLastDate) {
                $('#Sunday').addClass('selectedDay');
                currentServiceID = 999;
            } else {
                $('#Sunday').addClass('selectedDay');
                currentServiceID = 13;
            }
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
        var option = '';
        for (i = 0; i < routes.length; i++) {
            option += '<option value="' + routes[i].route_short_name + '" id="' + routes[i].route_id + '">' + routes[i].route_short_name + '</option>';
        }
        $('#routeList').append(option);
        if (currentRouteID) {
            $('#routeList option[id="' + currentRouteID + '"]').attr('selected', 'selected');
        }
        $('#routeList').on('change', function () {
            currentRouteNumber = this.value;
            currentRouteID = $(this).children(":selected").attr("id");
            window.location.href = "#route-details?routeNum=" + currentRouteNumber;
        });
        $('#routeList').on('click', function () {
            $(this).removeClass('highlight');
        });
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
            $('#stopListEnd option:disabled').not('.first').removeAttr('disabled');
            var selectedIndex = $('#stopListStart option:selected').index();
            var selectedStop = this.value;
            var selectedStopId = $(this).children(":selected").attr("id");
            var availableStopsEnd = $('#busTable tr:eq(' + 0 + ') td span.top');
            for (i = 0; i < selectedIndex; i++) {
                $('#stopListEnd option:nth-child('+i+')').prop('disabled', true);
            }
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
    currentDayNum = Date.parse(currentDate);
    currentDayNum = new Date(currentDayNum);
    currentDayNum = parseInt((currentDayNum.getFullYear().toString()) + (("0" + ((currentDayNum.getMonth()+1).toString())).slice(-2)) + (("0" + ((currentDayNum.getDate()).toString())).slice(-2)));
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
    $tableHeader = $("#stopNames");
    $tableHeaderClone = $("#stopNames").clone();
    $tableHeaderClone.attr("id", "stopNamesFixed");
    var tds = $('TD div', $tableHeader);
    var tdsClone = $('TD div', $tableHeaderClone);
    for (var i = 0; i < tds.length; i++) {
        var w = $(tds[i]).width()
        $(tdsClone[i]).width(w);
    }
    tableHeaderTop = $tableHeader.offset().top;
    $tableContainer = $("#schedule");
    $table = $('table', $tableContainer);
    $(window).resize(function () {
        if ($tableHeader) {
            $tableHeaderClone.width($tableContainer.width() );
        }
    });
    $tableHeaderClone.css("width", $("#dayTabs").width()).css("overflow", "hidden");
    $("#top-scrollbar .fake-content").css("width", $("#busTable").width() + "px");

    $("#top-scrollbar").scroll(function () {
        $("#schedule")
            .scrollLeft($("#top-scrollbar").scrollLeft());
            });
    $("#schedule").scroll(function () {
        $("#top-scrollbar")
            .scrollLeft($("#schedule").scrollLeft());
            });
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
    $tableContainer.on("scroll", sync)
}
function showMapDialog() {
    if ($(window).width() >= 520) {
        jQuery('#mapDialog').dialog({
            modal : true,
            responsive: true,
            width: 'auto',
            height: 'auto',
                dialogClass: "map-dialog",
            close: function(event, ui) {
                $("#mapDialog").dialog("destroy");
            },
        });
    }
}
function swapMapSize() {
    var rMap = $("#routeMap");
    if (rMap.hasClass("normal")) {
        rMap.animate({ width: "100%" }, "slow");
        rMap.removeClass("normal");
        $("i", rMap).removeClass("fa-search-plus");
        $("i", rMap).addClass("fa-search-minus");
        rMap.addClass("full");
    } else {
        var offset = rMap.offset();
        rMap.removeClass("full");
        rMap.addClass("normal");
        $("i", rMap).removeClass("fa-search-minus");
        $("i", rMap).addClass("fa-search-plus");
        rMap.animate({ width: "25%" }, "slow");
    }
}
function findRouteClick() {
    var selRoute = $("#selRoutes").val();
    if (selRoute != 'selectRoute') {
        window.location.href = "#route-details?routeNum=" + selRoute;
    }
}
function flipRoute() {
    $tableHeader.removeClass("hiddenHeader");
    $tableHeaderClone.remove();
    $tableHeaderClone.removeClass('fixedHeader');
    $tableHeaderClone = null;
    if (currentDirectionID == 0) {
        currentDirectionID = 1;
    } else {
        currentDirectionID = 0;
    }
    displaySelectedRouteAsync();
    var dir1 = $("#routeDir1").html();
    var dir2 = $("#routeDir2").html();
    $("#routeDir1").html(dir2);
    $("#routeDir2").html(dir1);
}
function thisDay(day) {
    $("#dayTabs").tabs({ activate: null });
    if (day == 'Weekday' || day == 'Monday' || day == 'Tuesday' || day == 'Wednesday' || day == 'Thursday' || day == 'Friday') {
        if (currentDayNum <= serviceChangeDate) {
            currentServiceID = 1;
        } else if (currentDayNum > serviceLastDate) {
            currentServiceID = 999;
        } else {
            currentServiceID = 11;
        }
        $('#routeMap').hide();
        $('#busTable').show();
        $('#controls').show();
        $('#top-scrollbar').show();
        $("#dayTabs").tabs("option", "active", 0);
    } else if (day == 'Saturday') {
        if (currentDayNum <= serviceChangeDate) {
            currentServiceID = 2;
        } else if (currentDayNum > serviceLastDate) {
            currentServiceID = 999;
        } else {
            currentServiceID = 12;
        }
        $('#routeMap').hide();
        $('#busTable').show();
        $('#controls').show();
        $('#top-scrollbar').show();
        $("#dayTabs").tabs("option", "active", 1);
    } else if (day == 'Sunday') {
        if (currentDayNum <= serviceChangeDate) {
            currentServiceID = 3;
        } else if (currentDayNum > serviceLastDate) {
            currentServiceID = 999;
        } else {
            currentServiceID = 13;
        }
        $('#routeMap').hide();
        $('#busTable').show();
        $('#controls').show();
        $('#top-scrollbar').show();
        $("#dayTabs").tabs("option", "active", 2);
    } else if (day == 'Route Map') {
        $('#busTable').hide();
        $('#controls').hide();
        $('#top-scrollbar').hide();
        $('#routeMap').show();
        $("#dayTabs").tabs("option", "active", 3);
    }
    $("#dayTabs").tabs({ activate: onRouteTabChanged });
    throwTheDate();
    displaySelectedRouteAsync();
}
function displaySelectedRouteAsync() {
    var element = $('#schedule');
    $('#top-scrollbar').hide();
    $('#schedule').css("overflow-x","hidden");
    showLoading(element);
    if (typeof trips != "undefined") {
        setTimeout(function () { 
            displaySelectedRoute();
            $('#schedule').css("overflow-x","scroll");
            $('#top-scrollbar').show();
        }, 1000);
    } else {
        loadTripData(function () { 
            displaySelectedRoute();
            $('#schedule').css("overflow-x","scroll");
            $('#top-scrollbar').show();
        });
    }
}
function displaySelectedRoute() {
    $('#noService').empty();
    $('#stopListEnd').empty();
    try{
        $('#busTable').empty();
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
            if (flags[entry.stop_sequence]) {
                return false;
            }
            flags[entry.stop_sequence] = true;
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
                    $(this).append('<td class="outOfService">' + lang("Out of Service") + '</td>');
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
                    if (continuesOnAsRoute[0] == undefined) {
                        $(this).append('<td class="outOfService">' + lang("Out of Service") + '</td>');
                    } else {
                        continuesOnAsRoute = continuesOnAsRoute[0].route_short_name;
                        continuesOnAs = continuesOnAsRoute + ' ' + continuesOnAsHeadsign;
                        $(this).append('<td class="continuing"><a href="#route-details?routeNum=' + continuesOnAsRoute + '&?directionId=' + continuesOnAsDirection + '">' + continuesOnAs + '</a></td>');
                    }
                }
            });
            setStickyHeader();
        }
        var cells = $('#busTable tr.tripTimes td');
        convertToStandard(cells);
        setTimeout(processContinuing, 100);
        selectedRoute = $('#routeList option[id="' + currentRouteID + '"]').attr('value');
        if (trip_headsign === -1) {
            if (isHoliday.length > 0) {
                $('#noService').append(lang('There is no service during the holiday.'));
            } else if (currentServiceID == 999) {
                $('#noService').append(lang('Please check back later for future schedule information.'));
            } else {
                $('#noService').append(lang('There is no service during the specified route and time.'));
            }
        } else {
            $('#stopNames').append('<td><div class="continuesOnAs">' + lang("Continues On As") + '</div></td>');
        }
    } catch (e) { console.log(e);}
    finally {
        hideLoading();
    }
    var selectedIndex = $('#stopListStart option:selected').index();
    var selectedStop = this.value;
    var selectedStopId = $(this).children(":selected").attr("id");
    var availableStopsEnd = $('#busTable tr:eq(' + 0 + ') td span.top');
    var endingOptions = '';
    for (i = selectedIndex; i < availableStopsEnd.length; i++) {
        endingOptions += '<option value="' + $(availableStopsEnd[i]).text() + '" id="' + $(availableStopsEnd[i]).attr("data-stopid") + '">' + $(availableStopsEnd[i]).text() + '</option>';
    }
    $('#stopListEnd').append(endingOptions);
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
    $('#stopListStart').append('<option value="selectStopListStart" disabled>' + lang("Starting Bus Stop") + '</option>');
    var availableStops = $('#busTable tr:eq(' + 0 + ') td span.top');
    if (availableStops.length > 0) {
        var startingOptions = '';
        for (i = 0; i < availableStops.length; i++) {
            startingOptions += '<option value="' + $(availableStops[i]).text() + '" id="' + $(availableStops[i]).attr("data-stopid") + '">' + $(availableStops[i]).text() + '</option>';
        }
        $('#stopListStart').append(startingOptions)
							.trigger('change');
        var firstTime = $('#busTable tr:eq(' + 1 + ') td:first')[0].innerHTML;
        var lastTime = $('#busTable tr:last td:last')[0].innerHTML;
        var increment = 1;
        var increment2 = 1;
        while ((lastTime == '--') || (lastTime.indexOf('<') != -1)) {
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
    $('#noStops').remove();
    $('#busTable tr:hidden').show();
    $('#busTable td:hidden').show();
    var filterStart = '#' + $('#stopListStart').children(":selected").attr("id");
    var filterEnd = '#' + $('#stopListEnd').children(":selected").attr("id");
    var startCells = $('#busTable td').not(filterStart + ', ' + filterEnd);
    startCells.hide();
    $('#printSchedule').show();     
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
    $('#busTable tr:hidden').show();
    $('#busTable td:hidden').show();
    $('#printSchedule').hide();
    setStickyHeader();
}
function printDiv(divName) {
    window.print();
}
function pdf() {
    var routeName = getRoute(currentRouteID).route_short_name;
    var pdfUrl = "http://ridewta.com/Documents/Route%20"+routeName+".pdf";
    window.open(pdfUrl,'_blank');
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
    if (currentServiceID == 1 || currentServiceID == 11) {
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
    } else if (currentServiceID == 2 || currentServiceID == 12) {
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
    } else if (currentServiceID == 3 || currentServiceID == 13) {
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
function loadStops(stopId) {
    if (stopId == null) {
        stopId = 2001;
    }
    currentStopID = stopId;
    $("#appPage").load("/common/" + language + "/stops.html", function () { initializeStops(); });
    setLeftnav("#lnavStops");
}
function initializeStops() {
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
    var streetviewService = new google.maps.StreetViewService();
    var day = new Date().getDay();
    var presentDate = new Date();
    var newDate = (presentDate.getDate()).toString();
    if (newDate.length < 2) { newDate = '0' + newDate; }
    var newMonth = (presentDate.getMonth() + 1).toString();
    if (newMonth.length < 2) { newMonth = '0' + newMonth; }
    var newYear = (presentDate.getFullYear()).toString();
    specialServiceDate = newYear + newMonth + newDate;
    var SSDint = parseInt(specialServiceDate);
    serviceChangeDate = parseInt(calendar[0].end_date);
    serviceLastDate = parseInt(calendar[4].end_date);
    if (day > 0 && day < 6) {
        if (SSDint <= serviceChangeDate) {
            $('#Weekday').addClass('selectedDay');
            currentServiceID = 1;
        } else if (SSDint > serviceLastDate) {
            $('#Weekday').addClass('selectedDay');
            currentServiceID = 999;
        } else {
            $('#Weekday').addClass('selectedDay');
            currentServiceID = 11;
        }
    }
    else if (day == 6) {
        if (SSDint <= serviceChangeDate) {
            $('#Saturday').addClass('selectedDay');
            currentServiceID = 2;
        } else if (SSDint > serviceLastDate) {
            $('#Saturday').addClass('selectedDay');
            currentServiceID = 999;
        } else {
            $('#Saturday').addClass('selectedDay');
            currentServiceID = 12;
        }
    }
    else if (day == 0) {
        if (SSDint <= serviceChangeDate) {
            $('#Sunday').addClass('selectedDay');
            currentServiceID = 3;
        } else if (SSDint > serviceLastDate) {
            $('#Sunday').addClass('selectedDay');
            currentServiceID = 999;
        } else {
            $('#Sunday').addClass('selectedDay');
            currentServiceID = 13;
        }
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
    });
    var dateConfig = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    var d = new Date().toLocaleDateString('en-US', dateConfig);
    $('#datepicker').attr('value', d);
    var todaysDate = new Date();
    $(function () {
        $('#datepicker').datepicker({
            showOn: "both",
            minDate: todaysDate,
            buttonText: "<i class='fa fa-calendar'></i>"
        });
    });
    $('#datepicker').on('change', onStopDatepickerChanged);
    if (currentStopID) {
        $('#stopNameHeader')[0].innerHTML = stopNameVariable;
        $("#searchStops").val(currentStopID);
        displaySelectedStop();
        $("#mainSchedule").show();
    } else {
        $("#mainSchedule").hide();
        $('#searchStops').addClass('pulse');
        setTimeout(function () { $('#searchStops').removeClass('pulse') }, 6500);
    }
}
function onStopDatepickerChanged(e) {
    currentDate = e.target.value;
    currentDayNum = Date.parse(currentDate);
    currentDayNum = new Date(currentDayNum);
    currentDayNum = parseInt((currentDayNum.getFullYear().toString()) + (("0" + ((currentDayNum.getMonth()+1).toString())).slice(-2)) + (("0" + ((currentDayNum.getDate()).toString())).slice(-2)));
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
            $('#map-canvas').append('<p id="noSV" style="text-align:center;display:block;line-height:400px;">' + lang("No available view of this bus stop.") + '</p>');
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
            alert(lang('Geocode was not successful for the following reason: ') + status);
        }
    });
}
function directSearch() {
    var searchTerm = document.getElementById('searchStops').value;
    if (searchTerm.length > 0) {
        if (searchTerm.length == 4 && (searchTerm == parseInt(searchTerm))) {
            if (validateStopId(searchTerm)) {
                window.location.href = "#stops?stopId=" + searchTerm;
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
        if (currentDayNum <= serviceChangeDate) {
            currentServiceID = 1;
        } else if (currentDayNum > serviceLastDate) {
            currentServiceID = 999;
        } else {
            currentServiceID = 11;
        }
        $('#Weekday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
        $("#dayTabs").tabs("option", "active", 0);
    } else if (day == 'Saturday') {
        if (currentDayNum <= serviceChangeDate) {
            currentServiceID = 2;
        } else if (currentDayNum > serviceLastDate) {
            currentServiceID = 999;
        } else {
            currentServiceID = 12;
        }
        $('#Saturday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
        $("#dayTabs").tabs("option", "active", 1);
    } else if (day == 'Sunday') {
        if (currentDayNum <= serviceChangeDate) {
            currentServiceID = 3;
        } else if (currentDayNum > serviceLastDate) {
            currentServiceID = 999;
        } else {
            currentServiceID = 13;
        }
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
    var stop = getStop(currentStopID);
    if (stop) {
        stopIdVariable = stop.stop_id;
        stopNameVariable = stop.stop_name;
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
            }
        });
        $('#stopTable').empty();
        $('#stopTable').append('<tr><th>' + lang("Time") + '</th><th>' + lang("Route") + '</th></tr>');
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
        $('#stopTable').append('<tr><td colspan="2">' + lang("There is no service during the holiday.") + '</td></tr>');
        selectedStopId = $('#selectedStopId')[0].innerHTML;
        return;
    }
    if (currentServiceID == 999) {
        $('#stopTable').append('<tr><td colspan="2">' + lang("Please check back later for future schedule information.") + '</td></tr>');
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
    finalStops = finalStops.filter(function(n){ return n != undefined });
    finalStops = finalStops.filter(function (entry) {
        if (stopFlags[entry.route_id]) {
            return false;
        }
        stopFlags[entry.route_id] = true;
        return true;
    });
    servedByRoutes = '';
    finalStops.sort(function (a, b) {
        a = Number(String(a.route_short_name).replace(/\D/g, ''));
        b = Number(String(b.route_short_name).replace(/\D/g, ''));
        var a1 = typeof a, b1 = typeof b;
        return a1 < b1 ? -1 : a1 > b1 ? 1 : a < b ? -1 : a > b ? 1 : 0;
    });
    for (i = 0; i < finalStops.length; i++) {
        if (i > 0) {
            servedByRoutes += ', <a href="#route-details?routeNum=' + finalStops[i].route_short_name + '">' + finalStops[i].route_short_name + '</a>';
        } else {
            servedByRoutes += '<a href="#route-details?routeNum=' + finalStops[i].route_short_name + '">' + finalStops[i].route_short_name; +'</a>';
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
    var cells = $('#stopTable tr td:nth-child(1)');
    convertToStandard(cells);
    selectedStopId = $('#selectedStopId')[0].innerHTML;
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
    finalStopsMap = finalStopsMap.filter(function(n){ return n != undefined });
    finalStopsMap = finalStopsMap.filter(function (entry) {
        if (stopFlags[entry.route_id]) {
            return false;
        }
        stopFlags[entry.route_id] = true;
        return true;
    });
    servedByRoutesMap = '';
    finalStopsMap.sort(function (a, b) {
        a = Number(String(a.route_short_name).replace(/\D/g, ''));
        b = Number(String(b.route_short_name).replace(/\D/g, ''));
        var a1 = typeof a, b1 = typeof b;
        return a1 < b1 ? -1 : a1 > b1 ? 1 : a < b ? -1 : a > b ? 1 : 0;
    });
    for (i = 0; i < finalStopsMap.length; i++) {
        if (i > 0) {
            servedByRoutesMap += ', <a href="#route-details?routeNum=' + finalStopsMap[i].route_short_name + '">' + finalStopsMap[i].route_short_name + '</a>';
        } else {
            servedByRoutesMap += '<a href="#route-details?routeNum=' + finalStopsMap[i].route_short_name + '">' + finalStopsMap[i].route_short_name; +'</a>';
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
function loadMap() {
    $("#appPage").load("/common/" + language + "/map.html", function () { initializeMap(); });
    setLeftnav("#lnavMap");
}
function initializeMap() {
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
    mapOptions = {
        center: { lat: 48.750057, lng: -122.476085 },
        zoom: 12,
        styles: mapStyles,
        zoomControl: true,
        scrollwheel: true,
        draggable: true,
        keyboardShortcuts: true
    };
    finishInit();  
    navigator.geolocation.getCurrentPosition(function(position) {
        var centerLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude); 
        map.setCenter(centerLocation);
    },
    function (error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert("Some mapping functions will not work without geolocation services enabled. For full functionality, please go to your browser's settings and enable location services.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("We were unable to get your currect location. Some mapping functions may not be available.");
                break;
            case error.TIMEOUT:
                alert("The request to use your location timed out. Some mapping functions may not be available.");
                break;
            case error.UNKNOWN_ERROR:
                alert("We were unable to get your current location. Some mapping functions may not be available.");
                break;
        }
    });
}
function finishInit() {
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById('directionsPanel'));
    busLayer = new google.maps.KmlLayer({
        url: 'http://data.ridewta.com/kml/Stops.kml',
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
            'infoWindowHtml': '<h4 style="text-decoration: underline">' + kmlStopName + '</h4><table class="table table-striped table-hover table-bordered"><tr><th>' + lang("Stop ID") + '</th><th>' + lang("Served By") + '</th><tr><td><a href="#stops?stopId=' + kmlStopCode + '">' + kmlStopCode + '</a></td><td id="servedByRoutes">' + servedByRoutesMap + '</td></tr></table>'
        }
    });
    setTimeout(function() {fillStopsMap();},500);
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
        var stopCodeResult = $.grep(stops, function (a) {
            return a.stop_code == address;
        });
        if (stopCodeResult.length == 0 || stopCodeResult.length > 1) {
            geocoder.geocode({ 'address': address, 'bounds': bounds }, function (results, status) {
                center = results[0].geometry.location;
                if (status == google.maps.GeocoderStatus.OK) {
                    if (center.lat() < 49.004438 && center.lat() > 48.410863 && center.lng() < -121.595991 && center.lng() > -122.904638) {
                        map.setCenter(results[0].geometry.location);
                        map.setZoom(17);
                    } else {
                        alert(lang('There were no results within our service area. Please check the stop number you entered and try again.'));
                    }
                } else {
                    alert(lang('Geocode was not successful for the following reason: ') + status);
                }
            });
        } else {
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
                content: '<h4 style="text-decoration: underline">' + kmlStopName + '</h4><table class="table table-striped table-hover table-bordered"><tr><th>' + lang("Stop ID") + '</th><th>' + lang("Served By") + '</th><tr><td><a href="#stops?stopId=' + kmlStopCode + '">' + kmlStopCode + '</a></td><td id="servedByRoutes">' + servedByRoutesMap + '</td></tr></table>'
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
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(17);
                } else {
                    alert(lang('There were no results within our service area. Please check the address you entered and try again.'));
                }
            } else {
                alert(lang('Geocode was not successful for the following reason: ') + status);
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
            break;
        case error.POSITION_UNAVAILABLE:
            break;
        case error.TIMEOUT:
            break;
        case error.UNKNOWN_ERROR:
            break;
    }
}
function getRoutes() {
    var myRoutes = routes;
    myRoutes.sort(function (a, b) {
        a = Number(String(a.route_short_name).replace(/\D/g, ''));
        b = Number(String(b.route_short_name).replace(/\D/g, ''));
        var a1 = typeof a, b1 = typeof b;
        return a1 < b1 ? -1 : a1 > b1 ? 1 : a < b ? -1 : a > b ? 1 : 0;
    });
    return myRoutes;
}
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
     var route = getRoute(routeId);
    if (route) {
        currentRouteID = route.route_id;
         return true;
    } else {
        currentRouteID = null;
        currentRouteNumber = null;
        return false;
    }
}
function BindTopNav() {
    var u = $('#topnavbar ul.root');
    if (u.length > 0) {
        u.find('li.dynamic-children').each(function () {
            var a = $(this).children('.menu-item');
            var s = a.children('span').eq(0);
            var t = s.children('span.menu-item-text').eq(0);
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
                    if (((e.pageX >= t.offset().left) && (e.pageX <= (t.offset().left + t.outerWidth(true)))) &&
						((e.pageY >= t.offset().top) && (e.pageY <= (t.offset().top + t.outerHeight(true))))) {
                        return true;
                    }
                    else
                        DropTopNav($, $(this).eq(0));
                    return false;
                });
                s.bind('click', function (e) {
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
            if (p.hasClass('shown') || (a == 'o')) {
                p.removeClass('shown');
                u.attr('style', '');
            }
            else {
                p.addClass('shown');
            }
            if ($(window).width() > 840) {
                var ddRightEdge = u.offset().left + u.width();
                if (ddRightEdge > ($(window).width() - 20)) {
                    u.attr('style', 'left: -' + (ddRightEdge - ($(window).width() - 20)) + 'px !important;  position:absolute !important;');
                }
            }
        }
    }
}
function lang(englishString) {
  var enPhrases = ["Route", "Out of Service", "Continues On As", "There is no bus service on this holiday.", "We’re sorry. Bus schedules for the date you selected are not available yet. Please check back closer to your intended date of travel.", "There is no service during the specified route and time.", "Starting Bus Stop", "No available view of this bus stop.", "Geocode was not successful for the following reason: ", "Time", "Stop ID", "Served By", "There were no results within our service area. Please check the stop number you entered and try again.","to"];
  var esPhrases = ["Ruta", "Fuera de servicio", "Continuar como", "No hay servicio de autobús en estas vacaciones.", "Lo sentimos. Los horarios de autobuses para la fecha que ha seleccionado aún no están disponibles . Por favor, vuelva más cerca de su fecha prevista del viaje.", "No hay servicio de la ruta y la hora especificadas.", "A partir de la parada de autobús", "No hay vistas disponibles de esta parada de autobús.", "Geocode falló por la siguiente razón: ", "Hora", "ID de parada", "Servido por", "No hubo resultados dentro de nuestra área de servicio . Por favor, compruebe el número de parada que ha introducido y vuelva a intentarlo.",""];;
  if (language == "es") {
    return esPhrases[enPhrases.indexOf(englishString)];
  } else {
    return englishString;
  }
}