function lookupRouteID(t) {
    t = t.toUpperCase(), routeList || (routeList = getRoutes())
    var e = $.grep(routeList, function(e) {
        return e.s == t
    })
    return e ? e[0].r : null
}

function getQueryParameterByName(t) {
    t = t.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]")
    var e = new RegExp("[\\?&]" + t + "=([^&#]*)"),
        i = e.exec(location.hash)
    return null === i ? "" : decodeURIComponent(i[1].replace(/\+/g, " "))
}

function loadQueryParams() {
    var t = getQueryParameterByName("routeId")
    t && t == parseInt(t) ? validateRouteId(t) : currentRouteID = null
    var e = getQueryParameterByName("routeNum")
    if (e) {
        var i = lookupRouteID(e)
        i && validateRouteId(i)
    } else e = null
    var n = getQueryParameterByName("stopId")
    n && n == parseInt(n) ? validateStopId(n) : currentStopID = null
    var s = getQueryParameterByName("directionId")
    s ? validateDirId(s) : currentDirectionID = 0
    var o = getQueryParameterByName("search")
    stopQuery = o ? o : null
}

function loadMain() {
    if (typeof calendar === "object") {
        hideLoading(), loadQueryParams(), $("#headerMain").load("/common/" + language + "/header.html.gz", function() {
            initializeHeader()
        }), $("#sidebar").load("/common/" + language + "/sidebar.html.gz", function() {
            initializeSidebar()
        }), $("#footer").load("/common/" + language + "/footer.html.gz"), $("#leftNav").load("/common/" + language + "/left-nav.html.gz"), window.setTimeout(function() {}, 500), loadPageContent()
    } else {
        setTimeout(function() {
            loadMain()
        }, 500)
    }
}

function loadTripData(t) {
    if ("undefined" != typeof trips) t && t()
    else {
        var e = document.createElement("script")
        e.type = "text/javascript", e.onload = function() {
            t()
        }, e.src = gzipEnabled ? "https://data.ridewta.com/gtfs/data_trips.js.gz" : "https://data.ridewta.com/gtfs/data_trips.js", (document.head || document.getElementsByTagName("head")[0]).appendChild(e)
    }
}

function loadPageContent() {
    try {
        google.maps.event.clearListeners(window, "resize"), $("#map-canvas").remove()
    } catch (t) {}
    loadQueryParams()
    var e = window.location.hash.split("?")[0].replace("#", "")
    switch (e) {
        case "route-details":
            if (typeof calendar != undefined) {
                loadTripData(function() {
                    loadRouteDetails(currentRouteID)
                })
            } else {
                setTimeout(function() {
                    loadPageContent()
                }, 500)
            }
            break
        case "map":
            if (typeof calendar != undefined) {
                loadTripData(function() {
                    loadMap()
                })
            } else {
                setTimeout(function() {
                    loadPageContent()
                }, 500)
            }
            break
        case "stops":
            if (typeof stops != undefined) {
                loadTripData(function() {
                    loadStops(currentStopID)
                })
            } else {
                setTimeout(function() {
                    loadPageContent()
                }, 500)
            }
            break
        case "routes":
        default:
            e = "routes", loadRoutes()
    }
    setHistory(e)
}

function setLeftnav(t) {
    $("#leftNav ul li").removeClass("selected"), $(t).addClass("selected")
}

function searchSite() {
    var t = $("#searchInput").val().trim()
    t && (window.location = searchURL + encodeURIComponent(t))
}

function setHistory() {}

function onPopState() {}

function initializeHeader() {
    BindTopNav(), $("#searchInput").keypress(function(t) {
        13 == t.keyCode && searchSite()
    })
}

function initializeSidebar() {
    if (language == "es") {
        $("#fdate").datepicker({
            dateFormat: "dd.mm.y"
        }).datepicker("setDate", new Date());
    } else {
        $("#fdate").datepicker({
            dateFormat: "mm/dd/y"
        }).datepicker("setDate", new Date());
    }
    var t = new Date
    t = t.getHours() + ":" + ('0' + t.getMinutes()).slice(-2);
    $("#ftime").val(t), routeList || (routeList = getRoutes())
    var e = $("#selRoutes")
    for (i = 0; i < routeList.length; i++) e.append("<option value='" + routeList[i].s + "'>" + routeList[i].s + "</option>")
    $("#findRoute").click(findRouteClick), $("#findStop").click(onFindStopClick)
    var inputStart = document.getElementById('tbStartLocation')
    var inputEnd = document.getElementById('tbEndLocation')
    var options = {
        bounds: bounds,
        componentRestrictions: {
            country: 'us'
        }
    }
    var autocompleteStart = new google.maps.places.Autocomplete(inputStart, options)
    var autocompleteEnd = new google.maps.places.Autocomplete(inputEnd, options)
    $("#tbStop").keypress(function(t) {
        13 == t.which && $("#findStop").trigger("click")
    })
}

function showLoading(t) {
    var e = $(t).children(":visible")
    e.hide(), $(t).addClass("spinner"), e.addClass("spinnerMark")
}

function hideLoading() {
    $(".spinner-cont").hide(), $(".spinner").removeClass("spinner"), $(".spinnerMark").show(), $(".spinnerMark").removeClass("spinnerMark")
}

function scrollContentTop() {
    0 == isElementInViewport($("#appPage")) && $("html,body").animate({
        scrollTop: $("#appPage").offset().top
    }, "fast")
}

function isElementInViewport(t) {
    "function" == typeof jQuery && t instanceof jQuery && (t = t[0])
    var e = t.getBoundingClientRect()
    return e.top >= 0
}

function loadRoutes() {
    $("#appPage").load("/common/" + language + "/routes.html.gz", function() {
        initializeRoutes(), headsUp()
    }), setLeftnav("#lnavRoutes")
}

function initializeRoutes() {
    routeList || (routeList = getRoutes())
    var t = $("#routeList")
    for (i = 0; i < routeList.length; i++) {
        var e = routeList[i].l
        e = e.replace("&harr;", '<i class="fa fa-arrows-h"></i>'), t.append("<li><span class='route-num'><a href='#route-details?routeNum=" + routeList[i].s + "' class='route-num'>" + routeList[i].s + "</a></span><a href='#route-details?routeNum=" + routeList[i].s + "'>" + e + "</a></li>")
    }
}

function loadRouteDetails(t) {
    currentRouteID = t, $("#appPage").load("/common/" + language + "/route-details.html.gz", function() {
        initializeRouteDetails(), headsUp()
    }), setLeftnav("#lnavRouteDetails")
}

function initializeRouteDetails() {
    if (currentRouteID) {
        $(".routeNumber").empty()
        var t = getRoute(currentRouteID)
        if (t) {
            var e = t.l.split("&harr;")
            routeDir0 = e[0], routeDir1 = e[1]
            var n = 2
            n = void 0 === routeDir1 ? 1 : 2
            var s = ""
            for (i = 0; i < n; i++) s += '<option value="' + [i] + '" id="dir' + [i] + '">to ' + e[i] + "</option>"
            $("#selRouteDir").append(s), $("#routeNumber").html(lang("Route") + " " + t.s + " - <br />" + lang("to") + " " + e[currentDirectionID])
            "blue" == t.c || "gold" == t.c || "plum" == t.c || "green" == t.c || "red" == t.c ? ($(".go-line").attr("src", "../Images/go-" + t.c + ".jpg"), $(".go-line").show()) : $(".go-line").hide()
            var o = document.createElement("img")
            o.onload = function() {
                $("#routeMap img").remove(), $("#routeMap").prepend(o), $("#routeMap img").attr("onClick", "showMapDialog();")
            }, o.onerror = function() {
                $("#routeMap").hide()
            }, o.src = "https://data.ridewta.com/routemaps/" + t.s + ".png", $("#mapDialog img").attr("src", "https://data.ridewta.com/routemaps/" + t.s + ".png")
        }
        $(function() {
            $("#selRouteDir").on("change", function() {
                currentDirectionID == $(this).children(":selected").attr("value") || (currentDirectionID = $(this).children(":selected").attr("value"), $("#routeNumber").html(lang("Route") + " " + t.s + " - <br />" + lang("to") + " " + e[currentDirectionID]), displaySelectedRouteAsync())
            })
        }), $("#dayTabs").tabs({
            activate: onRouteTabChanged
        })
        var r = (new Date).getDay(),
            a = new Date,
            l = a.getDate().toString()
        l.length < 2 && (l = "0" + l)
        var u = (a.getMonth() + 1).toString()
        u.length < 2 && (u = "0" + u)
        var h = a.getFullYear().toString()
        specialServiceDate = h + u + l
        var c = parseInt(specialServiceDate)
        serviceChangeDate = parseInt(calendar[0].e), serviceLastDate = parseInt(calendar[4].e), r > 0 && 6 > r ? serviceChangeDate >= c ? (day = 'Weekday', $("#Weekday").addClass("selectedDay"), currentServiceID = 1) : c > serviceLastDate ? (day = 'Weekday', $("#Weekday").addClass("selectedDay"), currentServiceID = 999) : (day = 'Weekday', $("#Weekday").addClass("selectedDay"), currentServiceID = 11) : 6 == r ? serviceChangeDate >= c ? (day = 'Saturday', $("#Saturday").addClass("selectedDay"), currentServiceID = 2) : c > serviceLastDate ? (day = 'Saturday', $("#Saturday").addClass("selectedDay"), currentServiceID = 999) : (day = 'Saturday', $("#Saturday").addClass("selectedDay"), currentServiceID = 12) : 0 == r && (serviceChangeDate >= c ? (day = 'Sunday', $("#Sunday").addClass("selectedDay"), currentServiceID = 3) : c > serviceLastDate ? (day = 'Sunday', $("#Sunday").addClass("selectedDay"), currentServiceID = 999) : (day = 'Sunday', $("#Sunday").addClass("selectedDay"), currentServiceID = 13))
        var d = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        };
        if (language == "es") {
            var p = new Date().toLocaleDateString('es', d);
        } else {
            var p = new Date().toLocaleDateString('en-US', d);
        }
        $("#datepicker").attr("value", p)
        var f = new Date();
        $(function() {
            $("#datepicker").datepicker({
                dateFormat: "DD, MM d, yy",
                minDate: f,
                showOn: "both",
                buttonText: "<i class='fa fa-calendar'></i>"
            })
        });
        var m = ""
        for (i = 0; i < routes.length; i++) m += '<option value="' + routes[i].s + '" id="' + routes[i].r + '">' + routes[i].s + "</option>"
        $("#routeList").append(m), currentRouteID && $('#routeList option[id="' + currentRouteID + '"]').attr("selected", "selected"), $("#routeList").on("change", function() {
            currentRouteNumber = this.value, currentRouteID = $(this).children(":selected").attr("id"), window.location.href = "#route-details?routeNum=" + currentRouteNumber
        }), $("#routeList").on("click", function() {
            $(this).removeClass("highlight")
        }), $(".page-button.left").mousedown(function() {
            pagerTimeout = setInterval(function() {
                pageLeft()
            }, 100)
        }), $(".page-button.right").mousedown(function() {
            pagerTimeout = setInterval(function() {
                pageRight()
            }, 100)
        }), $(document).mouseup(function() {
            return clearInterval(pagerTimeout), !1
        }), $("#datepicker").on("change", onRouteDatepickerChanged), $("#stopListStart").on("change", function() {
            $("#stopListEnd option:disabled").not(".first").removeAttr("disabled")
            var t = $("#stopListStart option:selected").index()
            for (this.value, $(this).children(":selected").attr("id"), $("#busTable tr:eq(0) td span.top"), i = 0; i < t; i++) $("#stopListEnd option:nth-child(" + i + ")").prop("disabled", !0)
        }), thisDay(day), scrollContentTop()
    } else loadRoutes()
}

function onRouteDatepickerChanged(t) {
    currentDate = t.target.value, currentDayNum = Date.parse(currentDate), currentDayNum = new Date(currentDayNum), currentDayNum = parseInt(currentDayNum.getFullYear().toString() + ("0" + (currentDayNum.getMonth() + 1).toString()).slice(-2) + ("0" + currentDayNum.getDate().toString()).slice(-2)), currentDate = currentDate.split(",")[0], thisDay(currentDate)
}

function onRouteTabChanged(t, e) {
    var i = e.newTab[0].textContent
    thisDay(i)
}

function setStickyHeader() {
    $tableHeader = $("#stopNames"), $tableHeaderClone = $("#stopNames").clone(), $tableHeaderClone.attr("id", "stopNamesFixed")
    for (var t = $("TD div", $tableHeader), e = $("TD div", $tableHeaderClone), i = 0; i < t.length; i++) {
        var n = $(t[i]).width()
        $(e[i]).width(n)
    }
    tableHeaderTop = $tableHeader.offset().top, $tableContainer = $("#schedule"), $table = $("table", $tableContainer), $(window).resize(function() {
        $tableHeader && $tableHeaderClone.width($tableContainer.width())
    }), $tableHeaderClone.css("width", $("#dayTabs").width()).css("overflow", "hidden"), $("#top-scrollbar .fake-content").css("width", $("#busTable").width() + "px"), $("#top-scrollbar").scroll(function() {
        $("#schedule").scrollLeft($("#top-scrollbar").scrollLeft())
    }), $("#schedule").scroll(function() {
        $("#top-scrollbar").scrollLeft($("#schedule").scrollLeft())
    }), $(window).scroll(function() {
        if ($tableHeader)
            if ($(window).scrollTop() > $tableHeader.offset().top && $(window).scrollTop() < $table.offset().top + $table.height()) {
                if (0 == $tableHeader.hasClass("hiddenHeader")) {
                    $tableHeader.addClass("hiddenHeader"), $("#busTable").prepend($tableHeaderClone), $tableHeaderClone.addClass("fixedHeader")
                    var t = $tableContainer.scrollLeft()
                    $tableHeaderClone.scrollLeft(t)
                }
            } else $tableHeader.removeClass("hiddenHeader"), $tableHeaderClone.remove(), $tableHeaderClone.removeClass("fixedHeader")
    }), $tableContainer.on("scroll", sync)
}

function showMapDialog() {
    $(window).width() >= 520 && jQuery("#mapDialog").dialog({
        modal: !0,
        responsive: !0,
        width: "auto",
        height: "auto",
        dialogClass: "map-dialog",
        close: function() {
            $("#mapDialog").dialog("destroy")
        }
    })
}

function swapMapSize() {
    var t = $("#routeMap")
    t.hasClass("normal") ? (t.animate({
        width: "100%"
    }, "slow"), t.removeClass("normal"), $("i", t).removeClass("fa-search-plus"), $("i", t).addClass("fa-search-minus"), t.addClass("full")) : (t.offset(), t.removeClass("full"), t.addClass("normal"), $("i", t).removeClass("fa-search-minus"), $("i", t).addClass("fa-search-plus"), t.animate({
        width: "25%"
    }, "slow"))
}

function findRouteClick() {
    var t = $("#selRoutes").val()
    "selectRoute" != t && (window.location.href = "#route-details?routeNum=" + t)
}

function flipRoute() {
    $tableHeader.removeClass("hiddenHeader"), $tableHeaderClone.remove(), $tableHeaderClone.removeClass("fixedHeader"), $tableHeaderClone = null, currentDirectionID = 0 == currentDirectionID ? 1 : 0, displaySelectedRouteAsync()
    var t = $("#routeDir1").html(),
        e = $("#routeDir2").html()
    $("#routeDir1").html(e), $("#routeDir2").html(t)
}

function thisDay(t) {
    if (t == 'Map' || t == 'Mapa') {
        t = 'Route Map'
    }
    if (t == 'domingo' || t == 'Sunday') {
        t == 'Sunday'
    }
    if (t == 'sábado' || t == 'Saturday') {
        t = Saturday
    }
    if (t == 'Día de la semana' || t == 'Weekday') {
        t = 'Weekday'
    }
    $("#dayTabs").tabs({
        activate: null
    }), "Weekday" == t || "Monday" == t || "Tuesday" == t || "Wednesday" == t || "Thursday" == t || "Friday" == t ? (currentServiceID = serviceChangeDate >= currentDayNum ? 1 : currentDayNum > serviceLastDate ? 999 : 11, $("#routeMap").hide(), $("#busTable").show(), $("#controls").show(), $("#top-scrollbar").show(), $("#dayTabs").tabs("option", "active", 0)) : "Saturday" == t ? (currentServiceID = serviceChangeDate >= currentDayNum ? 2 : currentDayNum > serviceLastDate ? 999 : 12, $("#routeMap").hide(), $("#busTable").show(), $("#controls").show(), $("#top-scrollbar").show(), $("#dayTabs").tabs("option", "active", 1)) : "Sunday" == t ? (currentServiceID = serviceChangeDate >= currentDayNum ? 3 : currentDayNum > serviceLastDate ? 999 : 13, $("#routeMap").hide(), $("#busTable").show(), $("#controls").show(), $("#top-scrollbar").show(), $("#dayTabs").tabs("option", "active", 2)) : "Route Map" == t && ($("#busTable").hide(), $("#controls").hide(), $("#top-scrollbar").hide(), $("#routeMap").show(), $("#dayTabs").tabs("option", "active", 3)), $("#dayTabs").tabs({
        activate: onRouteTabChanged
    }), throwTheDate(), displaySelectedRouteAsync()
}

function displaySelectedRouteAsync() {
    var t = $("#schedule")
    $("#top-scrollbar").hide(), $("#schedule").css("overflow-x", "hidden"), showLoading(t), "undefined" != typeof trips ? setTimeout(function() {
        displaySelectedRoute(), $("#schedule").css("overflow-x", "scroll"), $("#top-scrollbar").show()
    }, 1e3) : loadTripData(function() {
        displaySelectedRoute(), $("#schedule").css("overflow-x", "scroll"), $("#top-scrollbar").show()
    })
}

function displaySelectedRoute() {
    $("#noService").empty(), $("#stopListEnd").empty()
    try {
        $("#busTable").empty()
        var t = [],
            e = $.grep(calendar_dates, function(t) {
                return t.d == specialServiceDate
            }),
            n = $.grep(e, function(t) {
                return 2 == t.e
            })
        if (n.length > 0);
        else if (e.length > 0) {
            var s = e[0].s
            if (specialServiceDate == e[0].d)
                for (i = 0; i < trips.length; i++) trips[i].r != currentRouteID || trips[i].d != currentDirectionID || trips[i].s != currentServiceID && trips[i].s != s || t.push(trips[i])
        } else
            for (i = 0; i < trips.length; i++) trips[i].r == currentRouteID && trips[i].d == currentDirectionID && trips[i].s == currentServiceID && t.push(trips[i])
        trip_headsign = 0 == t ? -1 : t[0].h
        var o = []
        for (i = 0; i < t.length; i++)
            for (tripStopArray = $.grep(stop_times, function(e) {
                    return e.t == t[i].t
                }), d = 0; d < tripStopArray.length; d++) o.push(tripStopArray[d])
        var r = {},
            a = o.filter(function(t) {
                return r[t.c] ? !1 : (r[t.c] = !0, !0)
            })
        a.sort(function(t, e) {
            return t.c < e.c ? -1 : t.c > e.c ? 1 : 0
        })
        var l = []
        for (i = 0; i < a.length; i++) {
            var u = $.grep(stops, function(t) {
                return t.s == a[i].s
            })
            for (d = 0; d < u.length; d++) l.push(u[d])
        }
        for ($("#busTable").append('<tr id="stopNames"></tr>'), i = 0; i < l.length; i++) $("#stopNames").append('<td id="' + l[i].s + '"><a href="#stops?stopId=' + l[i].c + '"><div><span data-stopid=' + l[i].s + ' class="top">' + l[i].n + '</span><br/><span class="bottom">(' + l[i].c + ")</span></div></a></td>")
        for (i = 0; i < t.length; i++) {
            $("#busTable").append('<tr class="tripTimes" id="trip' + t[i].t + '"></tr>')
            var h = document.getElementById("trip" + t[i].t),
                c = $.grep(o, function(e) {
                    return e.t == t[i].t
                })
            c.sort(function(t, e) {
                return new Date("1970/01/01 " + t.b) - new Date("1970/01/01 " + e.b)
            })
            var d = 0
            for (k = 0; k < l.length; k++) {
                var p = parseInt($("#stopNames td:eq(" + k + ")").attr("id"))
                void 0 == c[d] ? $(h).append('<td id="' + l[k].s + '">--</td>') : c[d].s == parseInt($("#stopNames td:nth-child(" + k + ")").attr("id")) ? (d++, k--) : p != c[d].s ? $(h).append('<td id="' + l[k].s + '">--</td>') : ($(h).append(7 == c[d].b.length ? '<td id="' + c[d].s + '">0' + c[d].b.slice(0, -3) + "</td>" : '<td id="' + c[d].s + '">' + c[d].b.slice(0, -3) + "</td>"), d++)
            }
        }
        for (i = 0; i < l.length; i++) {
            var f = $("#busTable td:nth-child(" + (i + 1) + ")").map(function() {
                    return $(this).text()
                }).get(),
                m = 0
            for (d = 1; d < f.length; d++) "--" == f[d] && m++
                m == f.length - 1 && $("#busTable tr").find("td:eq(" + i + ")").addClass("markedForDeletion")
        }
        $(".markedForDeletion").remove()
        var g = $("#busTable tr")
        for (i = 1; i < g.length; i++) {
            var v = $(g[i]).children().length,
                b = []
            for (d = 0; v > d; d++) b.push($("#busTable tr:eq(" + i + ") td:eq(" + d + ")").text())
            b = b.filter(function(t) {
                return "--" != t
            }), b.sort(), $("#busTable tr:eq(" + i + ")").attr("value", b[0])
        }
        var y = $("#busTable"),
            _ = $(".tripTimes")
        _.sort(function(t, e) {
            var i = $(t).attr("value"),
                n = $(e).attr("value")
            return i > n ? 1 : n > i ? -1 : 0
        }), $.each(_, function(t, e) {
            y.children("tbody").append(e)
        }), customizeStopListStart()
        var w = function() {
                $(".tripTimes").each(function() {
                    var e = $(this),
                        n = $.grep(t, function(t) {
                            return e.attr("id") == "trip" + t.t
                        })[0],
                        r = $.grep(trips, function(t) {
                            return n.b == t.b && (t.s == currentServiceID || t.s == s)
                        }),
                        a = []
                    for (i = 0; i < r.length; i++) {
                        var l = $.grep(stop_times, function(t) {
                            return r[i].t == t.t
                        })
                        l.sort(function(t, e) {
                            return t.c < e.c ? -1 : 1
                        }), a.push(l[0])
                    }
                    a.sort(function(t, e) {
                        var i = new Date("1970/01/01 " + t.b),
                            n = new Date("1970/01/01 " + e.b)
                        return n > i ? -1 : 1
                    }), o.sort(function(t, e) {
                        var i = new Date("1970/01/01 " + t.b),
                            n = new Date("1970/01/01 " + e.b)
                        return n > i ? -1 : 1
                    })
                    var u, h = $.grep(o, function(t) {
                        return n.t == t.t
                    })[0].b
                    for (i = 0; i < a.length; i++)
                        if (a[i].hasOwnProperty("b") && a[i].b == h)
                            if (void 0 == a[i + 1]) u = "Out of Service"
                            else var c = a[i + 1].t
                    if ("Out of Service" == u) $(this).append('<td class="outOfService">' + lang("Out of Service") + "</td>")
                    else {
                        u = $.grep(trips, function(t) {
                            return c === t.t
                        })
                        var d = u[0].d,
                            p = (u[0].r, u[0].h),
                            f = ("'" + u[0].h + "'", $.grep(routes, function(t) {
                                return u[0].r === t.r
                            }))
                        void 0 == f[0] ? $(this).append('<td class="outOfService">' + lang("Out of Service") + "</td>") : (f = f[0].s, u = f + " " + p, $(this).append('<td class="continuing"><a href="#route-details?routeNum=' + f + "&?directionId=" + d + '">' + u + "</a></td>"))
                    }
                }), setStickyHeader()
            },
            C = $("#busTable tr.tripTimes td")
        convertToStandard(C), setTimeout(w, 100), selectedRoute = $('#routeList option[id="' + currentRouteID + '"]').attr("value"), -1 === trip_headsign ? $("#noService").append(lang(n.length > 0 ? "There is no service during the holiday." : 999 == currentServiceID ? "Please check back later for future schedule information." : "There is no service during the specified route and time.")) : $("#stopNames").append('<td><div class="continuesOnAs">' + lang("Continues On As") + "</div></td>")
    } catch (x) {
        console.log(x)
    } finally {
        hideLoading()
    }
    var D = $("#stopListStart option:selected").index(),
        T = (this.value, $(this).children(":selected").attr("id"), $("#busTable tr:eq(0) td span.top")),
        S = ""
    for (i = D; i < T.length; i++) S += '<option value="' + $(T[i]).text() + '" id="' + $(T[i]).attr("data-stopid") + '">' + $(T[i]).text() + "</option>"
    $("#stopListEnd").append(S)
    var route = getRoute(currentRouteID)
    if (route.s == '55' || route.s == '71X' || route.s == '72X') {
        $('#noService').append(lang('<br />Flex service is available on this route within the flex service area (see map). Click <a href="http://www.ridewta.com/types-of-service/fixed-route/flex-service">here</a> for more information on Flex Service.'));
    }
}

function uniqueStops(t) {
    var e = [],
        n = $.grep(calendar_dates, function(t) {
            return t.d == specialServiceDate
        }),
        s = $.grep(n, function(t) {
            return 2 == t.e
        })
    if (s.length > 0);
    else if (n.length > 0) {
        var o = n[0].s
        if (specialServiceDate == n[0].d)
            for (i = 0; i < trips.length; i++) trips[i].r != t || trips[i].d != currentDirectionID || trips[i].s != currentServiceID && trips[i].s != o || e.push(trips[i])
    } else
        for (i = 0; i < trips.length; i++) trips[i].r == t && trips[i].d == currentDirectionID && trips[i].s == currentServiceID && e.push(trips[i])
    trip_headsign = 0 == e ? -1 : e[0].h
    var r = []
    for (i = 0; i < e.length; i++)
        for (tripStopArray = $.grep(stop_times, function(t) {
                return t.t == e[i].t
            }), j = 0; j < tripStopArray.length; j++) r.push(tripStopArray[j])
    var a = {},
        l = r.filter(function(t) {
            return a[t.s] ? !1 : (a[t.s] = !0, !0)
        })
    l.sort(function(t, e) {
        return t.c < e.c ? -1 : t.c > e.c ? 1 : 0
    })
    var u = []
    for (i = 0; i < l.length; i++) {
        var h = $.grep(stops, function(t) {
            return t.s == l[i].s
        })
        for (j = 0; j < h.length; j++) u.push(h[j])
    }
    return u
}

function customizeStopListStart() {
    $("#stopListStart").empty(), $("#stopListStart").append('<option value="selectStopListStart" disabled>' + lang("Starting Bus Stop") + "</option>")
    var t = $("#busTable tr:eq(0) td span.top")
    if (t.length > 0) {
        var e = ""
        for (i = 0; i < t.length; i++) e += '<option value="' + $(t[i]).text() + '" id="' + $(t[i]).attr("data-stopid") + '">' + $(t[i]).text() + "</option>"
        $("#stopListStart").append(e).trigger("change")
        for (var n = $("#busTable tr:eq(1) td:first")[0].innerHTML, s = $("#busTable tr:last td:last")[0].innerHTML, o = 1, r = 1;
            "--" == s || -1 != s.indexOf("<");) o++, s = $("#busTable tr:last td:nth-last-child(" + o + ")")[0].innerHTML
        for (;
            "--" == n;) r++, n = $("#busTable tr:nth-child(2) td:nth-child(" + r + ")")[0].innerHTML
        $("#startTime").attr("value", n), $("#endTime").attr("value", s)
    }
}

function applyFilter() {
    $("#noStops").remove(), $("#busTable tr:hidden").show(), $("#busTable td:hidden").show()
    var t = "#" + $("#stopListStart").children(":selected").attr("id"),
        e = "#" + $("#stopListEnd").children(":selected").attr("id"),
        i = $("#busTable td").not(t + ", " + e)
    i.hide(), $("#printSchedule").show(), setStickyHeader()
}

function convertToMilitary(t) {
    $.each(t, function() {
        if ("am" == $(this)[0].innerHTML.substr(-2) && 7 == $(this)[0].innerHTML.length) {
            var t = $(this)[0].innerHTML.slice(0, 4)
            $(this)[0].innerHTML = "0" + t
        } else if ("am" == $(this)[0].innerHTML.substr(-2) && 8 == $(this)[0].innerHTML.length && "12" == $(this)[0].innerHTML.slice(0, 2)) {
            var e = $(this)[0].innerHTML.slice(3, 5)
            $(this)[0].innerHTML = "00:" + e
        } else if ("am" == $(this)[0].innerHTML.substr(-2) && 8 == $(this)[0].innerHTML.length) $(this)[0].innerHTML = $(this)[0].innerHTML.slice(0, 5)
        else if ("pm" == $(this)[0].innerHTML.substr(-2) && 7 == $(this)[0].innerHTML.length) {
            var e = $(this)[0].innerHTML.slice(2, 4),
                i = parseInt($(this)[0].innerHTML.slice(0, 1)) + 12
            $(this)[0].innerHTML = i + ":" + e
        } else if ("pm" == $(this)[0].innerHTML.substr(-2) && 8 == $(this)[0].innerHTML.length && "12" == $(this)[0].innerHTML.slice(0, 2)) $(this)[0].innerHTML = $(this)[0].innerHTML.slice(0, 5)
        else if ("pm" == $(this)[0].innerHTML.substr(-2) && 8 == $(this)[0].innerHTML.length) {
            var e = $(this)[0].innerHTML.slice(3, 5),
                i = parseInt($(this)[0].innerHTML.slice(0, 2)) + 12
            $(this)[0].innerHTML = i + ":" + e
        }
    })
}

function convertToStandard(t) {
    $.each(t, function() {
        if ("--" == $(this)[0].innerHTML);
        else if ("00" == $(this)[0].innerHTML.slice(0, 2)) {
            var t = $(this)[0].innerHTML.slice(3, 5)
            $(this)[0].innerHTML = "12:" + t + " am"
        } else if ("0" == $(this)[0].innerHTML.slice(0, 1)) $(this)[0].innerHTML = $(this)[0].innerHTML.slice(1, 5) + " am"
        else if ("10" == $(this)[0].innerHTML.slice(0, 2) || "11" == $(this)[0].innerHTML.slice(0, 2)) $(this)[0].innerHTML = $(this)[0].innerHTML + " am"
        else if ("12" == $(this)[0].innerHTML.slice(0, 2)) {
            var t = $(this)[0].innerHTML.slice(3, 5)
            $(this)[0].innerHTML = "12:" + t + " pm"
        } else {
            var e = parseInt($(this)[0].innerHTML.slice(0, 2)) - 12,
                t = $(this)[0].innerHTML.slice(3, 5)
            $(this)[0].innerHTML = e + ":" + t + " pm"
        }
    })
}

function clearFilter() {
    $("#busTable tr:hidden").show(), $("#busTable td:hidden").show(), $("#printSchedule").hide(), setStickyHeader()
}

function printDiv() {
    window.print()
}

function pdf() {
    if (language == "es") {
        var t = getRoute(currentRouteID).s,
            e = "http://ridewta.com/espanol/Documents/ruta" + t + ".pdf"
    } else {
        var t = getRoute(currentRouteID).s,
            e = "http://ridewta.com/Documents/Route%20" + t + ".pdf"
    }
    window.open(e, "_blank")
}

function throwTheDate() {
    var t = $("#datepicker").datepicker("getDate"),
        e = t.getDay(),
        i = t.getDate(),
        n = t.getMonth(),
        s = t.getFullYear(),
        o = new Date(s, n + 1, 0).getDate(),
        r = i
    if (1 == currentServiceID || 11 == currentServiceID) {
        if (!(e > 0 && 6 > e) && (r = i - (8 - e), r > o)) {
            r -= o
            var n = n + 1
            n > 11 && (n = 0, s += 1)
        }
    } else if (2 == currentServiceID || 12 == currentServiceID) {
        if (6 != e && (r = i + (6 - e), r > o)) {
            r -= o
            var n = n + 1
            n > 11 && (n = 0, s += 1)
        }
    } else if ((3 == currentServiceID || 13 == currentServiceID) && 0 != e && (r = i + (7 - e), r > o)) {
        r -= o
        var n = n + 1
        n > 11 && (n = 0, s += 1)
    }
    var a = new Date(s, n, r)
    $("#datepicker").attr("value", a), $(function() {
        $("#datepicker").datepicker("setDate", a), $("#datepicker").datepicker("option", "dateFormat", "DD, MM d, yy")
    })
    var l = (n + 1).toString()
    l.length < 2 && (l = "0" + l)
    var u = r.toString()
    u.length < 2 && (u = "0" + u)
    var h = s + "" + l + u
    specialServiceDate = h
}

function pageLeft() {
    var t = $("#schedule").scrollLeft()
    $("#schedule").scrollLeft(t - 100)
}

function pageRight() {
    var t = $("#schedule").scrollLeft()
    $("#schedule").scrollLeft(t + 100)
}

function loadStops(t) {
    null == t && (t = 2001), currentStopID = t, $("#appPage").load("/common/" + language + "/stops.html.gz", function() {
        initializeStops(), headsUp()
    }), setLeftnav("#lnavStops")
}

function initializeStops() {
    var t, e
    if (null == currentStopID) t = new google.maps.LatLng(48.750267, -122.476362), e = 105
    else {
        var i = $.grep(stops, function(t) {
            return t.c == currentStopID
        })
        t = new google.maps.LatLng(i[0].l, i[0].o)
    }
    geocode = new google.maps.Geocoder
    var n = new google.maps.LatLng(48.750267, -122.476362),
        s = {
            center: n,
            zoom: 16
        }
    map = new google.maps.Map(document.getElementById("map-canvas"), s), panorama = map.getStreetView()
    var o = {
        position: n,
        pov: {
            heading: 105,
            pitch: 5
        },
        visible: !0
    }
    panorama.setOptions(o)
    var r = (new google.maps.StreetViewService, (new Date).getDay()),
        a = new Date,
        l = a.getDate().toString()
    l.length < 2 && (l = "0" + l)
    var u = (a.getMonth() + 1).toString()
    u.length < 2 && (u = "0" + u)
    var h = a.getFullYear().toString()
    specialServiceDate = h + u + l
    var c = parseInt(specialServiceDate)
    serviceChangeDate = parseInt(calendar[0].e), serviceLastDate = parseInt(calendar[4].e), r > 0 && 6 > r ? serviceChangeDate >= c ? ($("#Weekday").addClass("selectedDay"), currentServiceID = 1) : c > serviceLastDate ? ($("#Weekday").addClass("selectedDay"), currentServiceID = 999) : ($("#Weekday").addClass("selectedDay"), currentServiceID = 11) : 6 == r ? serviceChangeDate >= c ? ($("#Saturday").addClass("selectedDay"), currentServiceID = 2) : c > serviceLastDate ? ($("#Saturday").addClass("selectedDay"), currentServiceID = 999) : ($("#Saturday").addClass("selectedDay"), currentServiceID = 12) : 0 == r && (serviceChangeDate >= c ? ($("#Sunday").addClass("selectedDay"), currentServiceID = 3) : c > serviceLastDate ? ($("#Sunday").addClass("selectedDay"), currentServiceID = 999) : ($("#Sunday").addClass("selectedDay"), currentServiceID = 13)), $("#dayTabs").tabs({
        activate: onStopTabChanged
    }), $("#searchStops").keypress(function(t) {
        13 == t.which && directSearch()
    }), $("#searchStops").on("focus", function() {
        $(this).removeClass("pulse")
    }), $("#scheduleFor").on("change", function() {
        chosenRoute = this.value, chosenRouteId = $(this).children(":selected").attr("id")
    })
    var d = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    if (language == "es") {
        var p = new Date().toLocaleDateString('es', d);
    } else {
        var p = new Date().toLocaleDateString('en-US', d);
    }
    $("#datepicker").attr("value", p)
    var f = new Date()
    $(function() {
        $("#datepicker").datepicker({
            showOn: "both",
            minDate: f,
            buttonText: "<i class='fa fa-calendar'></i>"
        })
    }), $("#datepicker").on("change", onStopDatepickerChanged), currentStopID ? ($("#stopNameHeader")[0].innerHTML = stopNameVariable, $("#searchStops").val(currentStopID), displaySelectedStop(), $("#mainSchedule").show()) : ($("#mainSchedule").hide(), $("#searchStops").addClass("pulse"), setTimeout(function() {
        $("#searchStops").removeClass("pulse")
    }, 6500))
}

function onStopDatepickerChanged(t) {
    currentDate = t.target.value, currentDayNum = Date.parse(currentDate), currentDayNum = new Date(currentDayNum), currentDayNum = parseInt(currentDayNum.getFullYear().toString() + ("0" + (currentDayNum.getMonth() + 1).toString()).slice(-2) + ("0" + currentDayNum.getDate().toString()).slice(-2)), currentDate = currentDate.split(",")[0], thisDayStops(currentDate)
}

function onStopTabChanged(t, e) {
    var i = e.newTab[0].textContent
    thisDayStops(i)
}

function SVpano() {
    var t = 50,
        e = $.grep(stops, function(t) {
            return t.c == currentStopID
        }),
        i = new google.maps.LatLng(e[0].l, e[0].o),
        n = new google.maps.StreetViewService
    n.getPanoramaByLocation(i, t, function(t) {
        t ? (panoramaLatLng = t.location.latLng, initStreetView(i, panoramaLatLng)) : ($("#map-canvas").children().hide(), $("#noSV").remove(), $("#map-canvas").append('<p id="noSV" style="text-align:center;display:block;line-height:400px;">' + lang("No available view of this bus stop.") + "</p>"))
    })
}

function initStreetView(t, e) {
    var i = {
            position: t
        },
        n = new google.maps.StreetViewPanorama(document.getElementById("map-canvas"), i),
        s = google.maps.geometry.spherical.computeHeading(e, t)
    map.setStreetView(n), n.setPov({
        heading: s,
        pitch: 0
    }), n.setZoom(0)
}

function codeAddressStop() {
    var t = document.getElementById("address").value
    geocoder.geocode({
        address: t
    }, function(t, e) {
        e == google.maps.GeocoderStatus.OK ? (map.setCenter(t[0].geometry.location), new google.maps.Marker({
            map: map,
            position: t[0].geometry.location
        })) : alert(lang("Geocode was not successful for the following reason: ") + e)
    })
}

function directSearch() {
    var t = document.getElementById("searchStops").value
    t.length > 0 && (window.location.href = 4 == t.length && t == parseInt(t) && validateStopId(t) ? "#stops?stopId=" + t : "#map?search=" + t)
}

function directMap() {
    var t = document.getElementById("selectedStopId").innerHTML
    window.location.href = 4 == t.length ? "#map?search=" + t : "#map"
}

function thisDayStops(t) {
    if (t == 'Vista de calle') {
        t = 'Street View'
    }
    if (t == 'Día de la semana') {
        t == 'Weekday'
    }
    if (t == 'sábado') {
        t = 'Saturday'
    }
    if (t == 'domingo') {
        t = 'Sunday'
    }
    $("#dayTabs").tabs({
        activate: null
    }), $("#dayTabs div").removeClass("selectedDay"), "Weekday" == t || "Monday" == t || "Tuesday" == t || "Wednesday" == t || "Thursday" == t || "Friday" == t ? (currentServiceID = serviceChangeDate >= currentDayNum ? 1 : currentDayNum > serviceLastDate ? 999 : 11, $("#Weekday").addClass("selectedDay"), $("#printThis").show(), $("#map-canvas").hide(), $("#dayTabs").tabs("option", "active", 0)) : "Saturday" == t ? (currentServiceID = serviceChangeDate >= currentDayNum ? 2 : currentDayNum > serviceLastDate ? 999 : 12, $("#Saturday").addClass("selectedDay"), $("#printThis").show(), $("#map-canvas").hide(), $("#dayTabs").tabs("option", "active", 1)) : "Sunday" == t ? (currentServiceID = serviceChangeDate >= currentDayNum ? 3 : currentDayNum > serviceLastDate ? 999 : 13, $("#Sunday").addClass("selectedDay"), $("#printThis").show(), $("#map-canvas").hide(), $("#dayTabs").tabs("option", "active", 2)) : "Street View" == t && ($("#StreetView").addClass("selectedDay"), $("#printThis").hide(), $("#map-canvas").show(), $("#dayTabs").tabs("option", "active", 3), panorama.setVisible(!0)), $("#dayTabs").tabs({
        activate: onStopTabChanged
    }), throwTheDate(), displaySelectedStop()
}

function displaySelectedStop() {
    var t = getStop(currentStopID)
    if (t) {
        stopIdVariable = t.s, stopNameVariable = t.n
        var e = $.grep(stops, function(t) {
                return t.c == currentStopID
            }),
            n = new google.maps.LatLng(e[0].l, e[0].o)
        geocode.geocode({
            latLng: n
        }, function(t, e) {
            if (e == google.maps.GeocoderStatus.OK) {
                var n, s
                for (h = 0; h < t.length; h++)
                    for (i = 0; i < t[0].address_components.length; i++)
                        for (j = 0; j < t[0].address_components[i].types.length; j++) "locality" == t[0].address_components[i].types[j] && (n = t[0].address_components[i].long_name), "postal_code" == t[0].address_components[i].types[j] && (s = t[0].address_components[i].long_name)
                $("#cityZip").text(n + ", " + s)
            }
        }), $("#stopTable").empty(), $("#stopTable").append("<tr><th>" + lang("Time") + "</th><th>" + lang("Route") + "</th></tr>"), $("#stopNameHeader")[0].innerHTML = t.n, $("#selectedStopId")[0].innerHTML = currentStopID, servingRoutes(), $("#servedByRoutes")[0].innerHTML = servedByRoutes
        var s = ""
        for (i = 0; i < finalStops.length; i++) s += '<option value="' + finalStops[i].s + '" id="' + finalStops[i].r + '">' + finalStops[i].s + "</option>"
        $("#scheduleFor option:not(:first-child)").remove(), $("#scheduleFor").append(s), SVpano()
    }
}

function servingRoutes() {
    var t = $.grep(calendar_dates, function(t) {
        return t.d == specialServiceDate
    })
    if (t.length > 0) var e = t[0].s
    var n = $.grep(t, function(t) {
        return 2 == t.e
    })
    if (n.length > 0) return $("#stopTable").append('<tr><td colspan="2">' + lang("There is no service during the holiday.") + "</td></tr>"), void(selectedStopId = $("#selectedStopId")[0].innerHTML)
    if (999 == currentServiceID) return $("#stopTable").append('<tr><td colspan="2">' + lang("Please check back later for future schedule information.") + "</td></tr>"), void(selectedStopId = $("#selectedStopId")[0].innerHTML)
    var s = [],
        o = $.grep(stop_times, function(t) {
            return t.s == stopIdVariable && 1 != t.p
        })
    for (finalStops = [], i = 0; i < o.length; i++) {
        var r = $.grep(trips, function(t) {
            return t.t == o[i].t && (t.s == currentServiceID || t.s == e)
        })
        for (j = 0; j < r.length; j++) {
            var a = $.grep(routes, function(t) {
                return t.r == r[j].r
            })
            finalStops.push(a[0])
        }
    }
    var l = {}
    for (finalStops = finalStops.filter(function(t) {
            return void 0 != t
        }), finalStops = finalStops.filter(function(t) {
            return l[t.r] ? !1 : (l[t.r] = !0, !0)
        }), servedByRoutes = "", finalStops.sort(function(t, e) {
            t = Number(String(t.s).replace(/\D/g, "")), e = Number(String(e.s).replace(/\D/g, ""))
            var i = typeof t,
                n = typeof e
            return n > i ? -1 : i > n ? 1 : e > t ? -1 : t > e ? 1 : 0
        }), i = 0; i < finalStops.length; i++) servedByRoutes += i > 0 ? ', <a href="#route-details?routeNum=' + finalStops[i].s + '">' + finalStops[i].s + "</a>" : '<a href="#route-details?routeNum=' + finalStops[i].s + '">' + finalStops[i].s
    for (i = 0; i < o.length; i++) {
        var u = $.grep(trips, function(t) {
            return o[i].t == t.t && (t.s == currentServiceID || t.s == e)
        })
        1 == u.length && s.push(o[i])
    }
    for (s.sort(function(t, e) {
            var i = new Date("1970/01/01 " + t.b),
                n = new Date("1970/01/01 " + e.b)
            return n > i ? -1 : 1
        }), i = 0; i < s.length; i++) {
        var h, c = s[i].b.slice(0, -3)
        4 == c.length && (c = "0" + c)
        var d = $.grep(trips, function(t) {
            return t.t == s[i].t
        })
        for (j = 0; j < d.length; j++) h = $.grep(routes, function(t) {
            return t.r == d[j].r
        })
        $("#stopTable").append('<tr id="' + h[0].r + '"><td>' + c + "</td><td>" + h[0].s + " " + d[0].h + "</td></tr>")
    }
    var p = $("#stopTable tr td:nth-child(1)")
    convertToStandard(p), selectedStopId = $("#selectedStopId")[0].innerHTML
}

function servingRoutesMap() {
    var t = $.grep(stop_times, function(t) {
        return t.s == stopIdVariable
    })
    for (finalStopsMap = [], i = 0; i < t.length; i++) {
        var e = $.grep(trips, function(e) {
            return e.t == t[i].t
        })
        for (j = 0; j < e.length; j++) {
            var n = $.grep(routes, function(t) {
                return t.r == e[j].r
            })
            finalStopsMap.push(n[0])
        }
    }
    var s = {}
    for (finalStopsMap = finalStopsMap.filter(function(t) {
            return void 0 != t
        }), finalStopsMap = finalStopsMap.filter(function(t) {
            return s[t.r] ? !1 : (s[t.r] = !0, !0)
        }), servedByRoutesMap = "", finalStopsMap.sort(function(t, e) {
            t = Number(String(t.s).replace(/\D/g, "")), e = Number(String(e.s).replace(/\D/g, ""))
            var i = typeof t,
                n = typeof e
            return n > i ? -1 : i > n ? 1 : e > t ? -1 : t > e ? 1 : 0
        }), i = 0; i < finalStopsMap.length; i++) servedByRoutesMap += i > 0 ? ', <a href="#route-details?routeNum=' + finalStopsMap[i].s + '">' + finalStopsMap[i].s + "</a>" : '<a href="#route-details?routeNum=' + finalStopsMap[i].s + '">' + finalStopsMap[i].s
}

function filterStops(t) {
    if ("all" == t) clearStopsFilter()
    else {
        var e = $("#stopTable tr").slice(1)
        for ($("#stopTable tr:hidden").show(), i = 0; i < e.length; i++) e[i].id != t && $("tr[id=" + e[i].id + "]").hide()
    }
    $("#stopTable").removeClass("table-striped")
}

function clearStopsFilter() {
    $("#noStops").remove(), $("#stopTable tr:hidden").show()
}

function onFindStopClick() {
    var t = $("#tbStop").val()
    t.length > 0 && (window.location.href = 4 == t.length && t == parseInt(t) && validateStopId(t) ? "#stops?stopId=" + currentStopID : "#map?search=" + t)
}

function loadMap() {
    $("#appPage").load("/common/" + language + "/map.html.gz", function() {
        initializeMap(), headsUp()
    }), setLeftnav("#lnavMap")
}

function initializeMap() {
    directionsDisplay = new google.maps.DirectionsRenderer, $("#searchStops").keypress(function(t) {
        13 == t.which && codeAddressMap()
    }), bounds = new google.maps.LatLngBounds(new google.maps.LatLng(48.410863, -122.904638), new google.maps.LatLng(49.004438, -121.595991)), geocoder = new google.maps.Geocoder, mapStyles = [{
        featureType: "transit.station.bus",
        stylers: [{
            visibility: "off"
        }]
    }, {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{
            color: "#A8A8A8"
        }]
    }], mapOptions = {
        center: {
            lat: 48.750057,
            lng: -122.476085
        },
        zoom: 12,
        styles: mapStyles,
        zoomControl: !0,
        scrollwheel: !0,
        draggable: !0,
        keyboardShortcuts: !0
    }
    finishInit(), navigator.geolocation.getCurrentPosition(function(t) {
        var e = new google.maps.LatLng(t.coords.latitude, t.coords.longitude)
        map.setCenter(e)
    }, function(t) {
        switch (t.code) {
            case t.PERMISSION_DENIED:
                alert("Some mapping functions will not work without geolocation services enabled. For full functionality, please go to your browser's settings and enable location services.")
                break
            case t.POSITION_UNAVAILABLE:
                alert("We were unable to get your currect location. Some mapping functions may not be available.")
                break
            case t.TIMEOUT:
                alert("The request to use your location timed out. Some mapping functions may not be available.")
                break
            case t.UNKNOWN_ERROR:
                alert("We were unable to get your current location. Some mapping functions may not be available.")
        }
    })
}

function finishInit() {
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions), directionsDisplay.setMap(map), directionsDisplay.setPanel(document.getElementById("directionsPanel")), routesLayer = map.data, routesLayer.loadGeoJson('https://data.ridewta.com/kml/routes_min.json'), routesLayer.setStyle(function(feature) {
        color = 'black'
        if (feature.getProperty('strokeColor')) {
            color = feature.getProperty('strokeColor')
        }
        return ({
            strokeColor: color
        })
    })
    var input = document.getElementById('searchStops')
    var options = {
        bounds: bounds,
        componentRestrictions: {
            country: 'us'
        }
    }
    var autocomplete = new google.maps.places.Autocomplete(input, options)
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        codeAddressMap()
    })
    busLayer = new google.maps.KmlLayer({
        url: "https://data.ridewta.com/kml/Stops.kml",
        preserveViewport: !0
    }), google.maps.event.addListener(map, "zoom_changed", function() {
        busLayer.setMap(map.zoom < 15 ? null : map)
    }), google.maps.event.addListenerOnce(map, "idle", function() {
        var t = document.getElementById("map-canvas").getElementsByTagName("a")
        $(t).click(function() {
            return !1
        })
    }), busLayer.setMap(map.zoom < 15 ? null : map), google.maps.event.addListener(busLayer, "click", function(t) {
        deleteMarkers(), kmlStopId = t.featureData.description.substring(9), stopIdVariable = kmlStopId, servingRoutesMap()
        var e = $.grep(stops, function(t) {
            return t.s == kmlStopId
        })
        3 == kmlStopId.length && (kmlStopId = "0" + kmlStopId), kmlStopCode = e[0].c, kmlStopName = e[0].n, t.featureData = {
            infoWindowHtml: '<h4 style="text-decoration: underline">' + kmlStopName + '</h4><table class="table table-striped table-hover table-bordered"><tr><th>' + lang("Stop ID") + "</th><th>" + lang("Served By") + '</th><tr><td><a href="#stops?stopId=' + kmlStopCode + '">' + kmlStopCode + '</a></td><td id="servedByRoutes">' + servedByRoutesMap + "</td></tr></table>"
        }
    }), infowindow = new google.maps.InfoWindow(), routesLayer.addListener('click', function(e) {
        deleteMarkers(), myHTML = e.feature.getProperty("name"), num = myHTML.substring(6), infowindow.setContent('<h4><a href="#route-details?routeNum=' + num + '">' + myHTML + '</a></h4>'), infowindow.setPosition(e.latLng), infowindow.setOptions({
            picelOffset: new google.maps.Size(0, -10)
        }), infowindow.open(map)
    }), routesLayer.addListener('mouseover', function(event) {
        routesLayer.revertStyle(), routesLayer.overrideStyle(event.feature, {
            strokeWeight: 9
        })
    }), routesLayer.addListener('mouseout', function(event) {
        routesLayer.revertStyle()
    }), setTimeout(function() {
        fillStopsMap()
    }, 500), scrollContentTop()
}

function showPosition(t) {
    mapOptions = {
        center: {
            lat: t.coords.latitude,
            lng: t.coords.longitude
        },
        zoom: 16,
        styles: mapStyles
    }
}

function codeAddressMap() {
    var e, o = document.getElementById("searchStops").value,
        t = new google.maps.places.PlacesService(map);
    if (3 != o.length && 4 != o.length || null == o.match(/^[0-9]+$/)) {
        var a = new google.maps.LatLng(map.getCenter().lat(), map.getCenter().lng()),
            n = {
                keyword: o,
                rankBy: google.maps.places.RankBy.DISTANCE,
                location: a
            },
            s = function(t, a) {
                t.length > 0 ? (console.log(a), "OK" == a ? (e = t[0].geometry.location, e.lat() < 49.004438 && e.lat() > 48.410863 && e.lng() < -121.595991 && e.lng() > -122.904638 ? (map.setCenter(t[0].geometry.location), map.setZoom(17)) : alert(lang("There were no results within our service area. Please check the address you entered and try again."))) : alert(lang("Geocode was not successful for the following reason: ") + a)) : geocoder.geocode({
                    address: o,
                    bounds: bounds
                }, function(o, t) {
                    t == google.maps.GeocoderStatus.OK ? (e = o[0].geometry.location, e.lat() < 49.004438 && e.lat() > 48.410863 && e.lng() < -121.595991 && e.lng() > -122.904638 ? (map.setCenter(o[0].geometry.location), map.setZoom(17)) : alert(lang("There were no results within our service area. Please check the address you entered and try again."))) : alert(lang("Geocode was not successful for the following reason: ") + t)
                })
            };
        t.nearbySearch(n, s)
    } else {
        var l = $.grep(stops, function(e) {
            return e.c == o
        });
        if (0 == l.length || l.length > 1) geocoder.geocode({
            address: o,
            bounds: bounds
        }, function(o, t) {
            e = o[0].geometry.location, t == google.maps.GeocoderStatus.OK ? e.lat() < 49.004438 && e.lat() > 48.410863 && e.lng() < -121.595991 && e.lng() > -122.904638 ? (map.setCenter(o[0].geometry.location), map.setZoom(17)) : alert(lang("There were no results within our service area. Please check the stop number you entered and try again.")) : alert(lang("Geocode was not successful for the following reason: ") + t)
        });
        else {
            stopIdVariable = l[0].s, kmlStopName = l[0].n, kmlStopCode = l[0].c, servingRoutesMap();
            var r = l[0].l,
                g = l[0].o,
                d = new google.maps.LatLng(r, g);
            map.setCenter(d), map.setZoom(17);
            var c = new google.maps.InfoWindow({
                    content: '<h4 style="text-decoration: underline">' + kmlStopName + '</h4><table class="table table-striped table-hover table-bordered"><tr><th>' + lang("Stop ID") + "</th><th>" + lang("Served By") + '</th><tr><td><a href="#stops?stopId=' + kmlStopCode + '">' + kmlStopCode + '</a></td><td id="servedByRoutes">' + servedByRoutesMap + "</td></tr></table>"
                }),
                p = new google.maps.Marker({
                    position: d,
                    map: map,
                    visible: !1
                });
            c.open(map, p), markers.push(p)
        }
    }
}

function setAllMap(t) {
    for (var e = 0; e < markers.length; e++) markers[e].setMap(t)
}

function clearMarkers() {
    setAllMap(null)
}

function deleteMarkers() {
    clearMarkers(), markers = []
}

function fillStopsMap() {
    stopQuery && ($("#searchStops")[0].value = stopQuery, codeAddressMap())
}

function getLocation() {
    navigator.geolocation ? (navigator.geolocation.getCurrentPosition(saveLocation, showError), $(".usecurrent").show()) : $(".usecurrent").hide()
}

function saveLocation(t) {
    currentLocation = t.coords.latitude + " " + t.coords.longitude
}

function useCurrentStart() {
    currentLocation ? $("#tbStartLocation").val(currentLocation) : navigator.geolocation && navigator.geolocation.getCurrentPosition(function(t) {
        currentLocation = t.coords.latitude + " " + t.coords.longitude, $("#tbStartLocation").val(currentLocation)
    })
}

function useCurrentEnd() {
    currentLocation ? $("#tbEndLocation").val(currentLocation) : navigator.geolocation && navigator.geolocation.getCurrentPosition(function(t) {
        currentLocation = t.coords.latitude + " " + t.coords.longitude, $("#tbEndLocation").val(currentLocation)
    })
}

function showError(t) {
    switch (t.code) {
        case t.PERMISSION_DENIED:
            break
        case t.POSITION_UNAVAILABLE:
            break
        case t.TIMEOUT:
            break
        case t.UNKNOWN_ERROR:
    }
}

function getRoutes() {
    var t = routes
    return t.sort(function(t, e) {
        t = Number(String(t.s).replace(/\D/g, "")), e = Number(String(e.s).replace(/\D/g, ""))
        var i = typeof t,
            n = typeof e
        return n > i ? -1 : i > n ? 1 : e > t ? -1 : t > e ? 1 : 0
    }), t
}

function getRoute(t) {
    routeList || (routeList = getRoutes())
    var e = $.grep(routeList, function(e) {
        return e.r == t
    })
    return e ? e[0] : null
}

function getStop(t) {
    var e = null
    if (t) {
        var e = Enumerable.From(stops).Where("$.c == " + t).ToArray()
        e && (e = e[0])
    }
    return e
}

function validateStopId(t) {
    var e = !1
    if (t) {
        var i = getStop(t)
        i ? (currentStopID = i.c, stopIdVariable = i.s, stopNameVariable = i.n, e = !0) : (currentStopID = null, stopIdVariable = null, stopNameVariable = null, e = !1)
    }
    return e
}

function validateDirId(t) {
    currentDirectionID = 0 == t ? 0 : 1 == t ? 1 : 0
}

function validateRouteId(t) {
    var e = getRoute(t)
    return e ? (currentRouteID = e.r, !0) : (currentRouteID = null, currentRouteNumber = null, !1)
}

function BindTopNav() {
    var t = $("#topnavbar ul.root")
    t.length > 0 && t.find("li.dynamic-children").each(function() {
        var t = $(this).children(".menu-item"),
            e = t.children("span").eq(0),
            i = e.children("span.menu-item-text").eq(0)
        $(this).hover(function() {
            HoverTopNav($, $(this), "")
        }, function() {
            HoverTopNav($, $(this), "o")
        }), t.is("span") ? (t.bind("click", function() {
            return DropTopNav($, $(this)), !1
        }), e.bind("click", function() {
            return DropTopNav($, $(this).parent()), !1
        })) : (t.bind("click", function(t) {
            return t.pageX >= i.offset().left && t.pageX <= i.offset().left + i.outerWidth(!0) && t.pageY >= i.offset().top && t.pageY <= i.offset().top + i.outerHeight(!0) ? !0 : (DropTopNav($, $(this).eq(0)), !1)
        }), e.bind("click", function(t) {
            return t.pageX >= i.offset().left && t.pageX <= i.offset().left + i.outerWidth(!0) && t.pageY >= i.offset().top && t.pageY <= i.offset().top + i.outerHeight(!0) ? window.location.href = $(this).parent("a").eq(0).attr("href") : DropTopNav($, $(this).parent("a").eq(0)), !1
        }))
    })
}

function HoverTopNav(t, e, i) {
    if (e.length > 0) {
        var n = t(".navbar-toggle")
        n.length > 0 && "none" == n.css("display") && DropTopNav(t, e.children(".menu-item").eq(0), i)
    }
}

function DropTopNav(t, e, i) {
    if (e.length > 0) {
        var n = e.siblings("ul").eq(0),
            s = e.parent()
        if (n.length > 0 && (s.hasClass("shown") || "o" == i ? (s.removeClass("shown"), n.attr("style", "")) : s.addClass("shown"), t(window).width() > 840)) {
            var o = n.offset().left + n.width()
            o > t(window).width() - 20 && n.attr("style", "left: -" + (o - (t(window).width() - 20)) + "px !important;  position:absolute !important;")
        }
    }
}

function lang(t) {
    var e = ["Route", "Out of Service", "Continues On As", "There is no bus service on this holiday.", "We’re sorry. Bus schedules for the date you selected are not available yet. Please check back closer to your intended date of travel.", "There is no service during the specified route and time.", "Starting Bus Stop", "No available view of this bus stop.", "Geocode was not successful for the following reason: ", "Time", "Stop ID", "Served By", "There were no results within our service area. Please check the stop number you entered and try again.", "to", "Flex service is available on this route within the flex service area (see map). Click <a href='http://www.ridewta.com/types-of-service/fixed-route/flex-service'>here</a> for more information on Flex Service."],
        i = ["Ruta", "Fuera de servicio", "Continuar como", "No hay servicio de autobús en estas vacaciones.", "Lo sentimos. Los horarios de autobuses para la fecha que ha seleccionado aún no están disponibles . Por favor, vuelva más cerca de su fecha prevista del viaje.", "No hay servicio de la ruta y la hora especificadas.", "A partir de la parada de autobús", "No hay vistas disponibles de esta parada de autobús.", "Geocode falló por la siguiente razón: ", "Hora", "ID de parada", "Servido por", "No hubo resultados dentro de nuestra área de servicio . Por favor, compruebe el número de parada que ha introducido y vuelva a intentarlo.", "", "Servicio flexible está disponible en esta ruta dentro del área de servicio de la flexión (ver mapa). Haga clic <a href='http://www.ridewta.com/espanol/tipos-de-servicio/ruta-fija/servicio-flexible'>aquí</a> para obtener más información sobre el servicio flexible."]
    return "es" == language ? i[e.indexOf(t)] : t
}

var currentRouteID, currentRouteNumber, currentStopID, routeList, map, trip_headsign, servedByRoutes, servedByRoutesMap, finalStops, finalStopsMap, specialServiceDate, map, routesLayer, busLayer, mapOptions, currentLocation, mapStyles, geocoder, kmlStopCode, kmlStopName, kmlStopId, chosenRoute, chosenRouteId, stopIdVariable, bounds, panorama, stopNameVariable, stopVariable, stopQuery, pagerTimeout, $tableHeader, $tableHeaderClone, tableHeaderTop, $tableContainer, $table, currentDirectionID = 0,
    currentServiceID = 1,
    currentDate = new Date,
    entryPanoId = null,
    scrollToTop = !1,
    gzipEnabled = !0
if ("es" == language) {
    var searchURL = "http://www.ridewta.com/search/pages/results.aspx?k=";
} else {
    var searchURL = "http://www.ridewta.com/search/pages/results.aspx?k=";
}
var markers = [],
    serviceChangeDate, serviceLastDate, currentDayNum
currentDate = new Date, currentDayNum = Date.parse(currentDate), currentDayNum = new Date(currentDayNum), currentDayNum = parseInt(currentDayNum.getFullYear().toString() + ("0" + (currentDayNum.getMonth() + 1).toString()).slice(-2) + ("0" + currentDayNum.getDate().toString()).slice(-2))
var weekday = new Array(7)
weekday[0] = "Sunday", weekday[1] = "Monday", weekday[2] = "Tuesday", weekday[3] = "Wednesday", weekday[4] = "Thursday", weekday[5] = "Friday", weekday[6] = "Saturday", currentDate = weekday[currentDate.getDay()], $(document).ready(function() {
        $(window).on("hashchange", function() {
            loadPageContent(), $("html, body").animate({
                scrollTop: 0
            }, "medium")
            var t = "/" + window.location.hash
            ga("set", "page", t), ga("send", "pageview", t)
        }), loadMain()
    }),
    function(t) {
        t.fn.changeElementType = function(e) {
            var i = {}
            t.each(this[0].attributes, function(t, e) {
                i[e.nodeName] = e.nodeValue
            }), this.replaceWith(function() {
                return t("<" + e + "/>", i).append(t(this).contents())
            })
        }
    }(jQuery)
var sync = function() {
    $tableHeaderClone.scrollLeft(this.scrollLeft)
}
$('.navbar-inner .wta-alert').text("Our schedules are changing March 19th!");
$('.navbar-inner .wta-alert').attr('href', 'https://futureschedules.ridewta.com');
$('.navbar-inner .wta-alert').show();
var routes= [];
