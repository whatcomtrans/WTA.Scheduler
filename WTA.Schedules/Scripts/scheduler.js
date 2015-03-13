var selectedDirection = 0;
var selectedRoute, selectedRouteId, trip_headsign, service_id, selectedStopId, servedByRoutes, servedByRoutesMap, finalStops, finalStopsMap, specialServiceDate;

function flipRoute() {
    if (selectedDirection == 0) {
        selectedDirection = 1;
    } else {
        selectedDirection = 0;
    }
    displaySelectedRoute(selectedRouteId, service_id, selectedDirection);
}
function thisDay(day) {
    $('#dayTabs div').removeClass('selectedDay');
    if (day == Weekday || day == 'Monday' || day == 'Tuesday' || day == 'Wednesday' || day == 'Thursday' || day == 'Friday') {
        service_id = 1;
        $('#Weekday').addClass('selectedDay');
    } else if (day == Saturday || day == 'Saturday') {
        service_id = 2;
        $('#Saturday').addClass('selectedDay');
    } else if (day == Sunday || day == 'Sunday') {
        service_id = 3;
        $('#Sunday').addClass('selectedDay');
    }
    throwTheDate();
    displaySelectedRoute(selectedRouteId, service_id, selectedDirection);
}
function displaySelectedRoute(selectedRouteId, service_id, selectedDirection) {
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
                if (trips[i].route_id == selectedRouteId && trips[i].direction_id == selectedDirection && (trips[i].service_id == service_id || trips[i].service_id == specialServiceDate_id)) {
                    tripsInRoute.push(trips[i]);
                }
            }
        }
    } else {
        for (i = 0; i < trips.length; i++) {
            if (trips[i].route_id == selectedRouteId && trips[i].direction_id == selectedDirection && trips[i].service_id == service_id) {
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
                return originTrip.block_id == a.block_id && (a.service_id == service_id || a.service_id == specialServiceDate_id);
            });
            var firstStopTimes = [];
            for (i = 0; i < continuingTrips.length; i++) {
                var firstStopTime = $.grep(stop_times, function (a) {
                    return continuingTrips[i].trip_id == a.trip_id && a.stop_sequence == 1;
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
                $(this).append('<td class="continuing" id="' + continuesOnAsRoute + ' ' + continuesOnAsDirection + '" onClick="continuingRoute(' + continuesOnAsRouteId + ', ' + service_id + ', ' + continuesOnAsDirection + ', ' + continuesOnAsHeadsignVar + ');">' + continuesOnAs + '</td>');
            }
        });
    }
    setTimeout(processContinuing, 0);
    selectedRoute = $('#routeList option[id="' + selectedRouteId + '"]').attr('value');
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
    selectedRouteId = continuesOnAsRouteId;
    selectedDirection = continuesOnAsDirection;
    trip_headsign = continuesOnAsHeadsignVar;
    $('#routeList option[id="' + selectedRouteId + '"]').attr('selected', 'selected');
    selectedRoute = $('#routeList option[id="' + selectedRouteId + '"]').attr('value');
    displaySelectedRoute(selectedRouteId, service_id, selectedDirection);
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
//////////////////////////////////////////////////////////////////////////////////////////////////////
//THIS SECTION IS FOR THE SCHEDULES BY ROUTE PAGE FUNCTIONS///////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
function directSearch() {
    var searchTerm = document.getElementById('searchStops').value;
    if (searchTerm.length == 0) {
    } else if (searchTerm.length == 4) {
        var stopCodeResult = $.grep(stops, function (a) {
            return a.stop_code == searchTerm;
        });
        if (stopCodeResult.length == 1) {
            selectedStopId = searchTerm;
            stopIdVariable = stopCodeResult[0].stop_id;
            stopNameVariable = stopCodeResult[0].stop_name;
            displaySelectedStop(selectedStopId, service_id);
        } else {
            window.location.href = "map.html?" + searchTerm;
        }
    } else {
        window.location.href = "map.html?" + searchTerm;
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
    if (day == Weekday || day == 'Monday' || day == 'Tuesday' || day == 'Wednesday' || day == 'Thursday' || day == 'Friday') {
        service_id = 1;
        $('#Weekday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
    } else if (day == Saturday || day == 'Saturday') {
        service_id = 2;
        $('#Saturday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
    } else if (day == Sunday || day == 'Sunday') {
        service_id = 3;
        $('#Sunday').addClass('selectedDay');
        $('#printThis').show();
        $('#map-canvas').hide();
    } else if (day == StreetView || day == 'StreetView') {
        $('#StreetView').addClass('selectedDay');
        $('#printThis').hide();
        $('#map-canvas').show();
        panorama.setVisible(true);
    }
    throwTheDate();
    displaySelectedStop(selectedStopId, service_id);
}
function displaySelectedStop(selectedStopId, service_id) {
    $('#stopTable').empty();
    $('#stopTable').append('<tr><th>Time</th><th>Route</th></tr>');
    $('#stopNameHeader')[0].innerHTML = stopNameVariable;
    $('#selectedStopId')[0].innerHTML = selectedStopId;
    servingRoutes();
    $('#servedByRoutes')[0].innerHTML = servedByRoutes;
    var option = '';
    for (i = 0; i < finalStops.length; i++) {
        option += '<option value="' + finalStops[i].route_short_name + '" id="' + finalStops[i].route_id + '">' + finalStops[i].route_short_name + '</option>';
    }
    $('#scheduleFor option:not(:first-child)').remove();
    $('#scheduleFor').append(option);
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
            return (a.trip_id == servingStops[i].trip_id && (a.service_id == service_id || a.service_id == specialServiceDate_id));
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
            servedByRoutes += ', <a href="index.html?' + finalStops[i].route_id + '">' + finalStops[i].route_short_name + '</a>';
        } else {
            servedByRoutes += '<a href="index.html?' + finalStops[i].route_id + '">' + finalStops[i].route_short_name; +'</a>';
        }
    }
    for (i = 0; i < servingStops.length; i++) {
        var currentStop = $.grep(trips, function (a) {
            return (servingStops[i].trip_id == a.trip_id && (a.service_id == service_id || a.service_id == specialServiceDate_id));
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
            servedByRoutesMap += ', <a href="index.html?' + finalStopsMap[i].route_id + '">' + finalStopsMap[i].route_short_name + '</a>';
        } else {
            servedByRoutesMap += '<a href="index.html?' + finalStopsMap[i].route_id + '">' + finalStopsMap[i].route_short_name; +'</a>';
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
    if (service_id == 1) {
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
    } else if (service_id == 2) {
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
    } else if (service_id == 3) {
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