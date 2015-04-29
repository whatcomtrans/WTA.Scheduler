var BTS = new google.maps.LatLng(48.750172,-122.47536);
var LCPR = new google.maps.LatLng(48.734558,-122.46602);
var APR = new google.maps.LatLng(48.619778,-122.35496);
var CPR = new google.maps.LatLng(48.482388,-122.33682);
var SS = new google.maps.LatLng(48.418167,-122.33413);
var CTS  = new google.maps.LatLng(48.792805,-122.49104);
var GMTM = new google.maps.LatLng(48.870419,-122.48566);
var CAFS = new google.maps.LatLng(48.998566,-122.26482);
var CATS = new google.maps.LatLng(48.761543,-122.47495);
var WAMS = new google.maps.LatLng(48.766968,-122.44523);
var LDLS = new google.maps.LatLng(48.744846,-122.46103);
var OLXS = new google.maps.LatLng(48.744087,-122.44357);
var SWAY = new google.maps.LatLng(48.706554,-122.44554);

var stopsArray = [];
for (i=0;i<stops.length;i++) {
  stopsArray.push(new google.maps.LatLng(stops[i].stop_lat,stops[i].stop_lon));
}
//Stops In Route-- push these into the jsonArray for a new route
//step1- For every route...
for (i=0;i<routes.length;i++) {
  //Get the current route's route_id
  var currentRouteID = routes[i].route_id;
  console.log(routes[i].route_short_name);
  //Give me a list of all of the trips that take that route...
  var tripsInRoute = $.grep(trips, function(a) {
    return currentRouteID == a.route_id;
  });
  var stopTimesInRoute = [];
  for (i = 0; i < tripsInRoute.length; i++) {
      var tripStopArray = $.grep(stop_times, function (d) {
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
}
//Finally, push each of these routeStopID arrays into the jsonArray!

// Initialise some variables
var directionsService = new google.maps.DirectionsService();
var num, map, data;
var requestArray = [], renderArray = [];

// A JSON Array containing some people/routes and the destinations/stops
var jsonArray = {
    "Route 80x": [BTS, LCPR, APR, CPR, SS],
    "Route 71x": [BTS, CTS, GMTM, CAFS],
    "Route 331": [BTS, CATS, WAMS, CTS],
    "Route 43": [BTS, LDLS, OLXS, SWAY]
}
    
// 16 Standard Colours for navigation polylines
var colourArray = ['navy', 'grey', 'fuchsia', 'black', 'white', 'lime', 'maroon', 'purple', 'aqua', 'red', 'green', 'silver', 'olive', 'blue', 'yellow', 'teal'];

// Let's make an array of requests which will become individual polylines on the map.
function generateRequests(){
    requestArray = [];
    for (var route in jsonArray){
        // This now deals with one of the people / routes
        // Somewhere to store the wayoints
        var waypts = [];
        // 'start' and 'finish' will be the routes origin and destination
        var start, finish
        // lastpoint is used to ensure that duplicate waypoints are stripped
        var lastpoint
        data = jsonArray[route]
        limit = data.length
        for (var waypoint = 0; waypoint < limit; waypoint++) {
            if (data[waypoint] === lastpoint){
                // Duplicate of of the last waypoint - don't bother
                continue;
            } 
            // Prepare the lastpoint for the next loop
            lastpoint = data[waypoint]
            // Add this to waypoint to the array for making the request
            waypts.push({
                location: data[waypoint],
                stopover: true
            });
        }
        // Grab the first waypoint for the 'start' location
        start = (waypts.shift()).location;
        // Grab the last waypoint for use as a 'finish' location
        finish = waypts.pop();
        if(finish === undefined){
            // Unless there was no finish location for some reason?
            finish = start;
        } else {
            finish = finish.location;
        }
        // Let's create the Google Maps request object
        var request = {
            origin: start,
            destination: finish,
            waypoints: waypts,
            travelMode: google.maps.TravelMode.DRIVING
        };
        // and save it in our requestArray
        requestArray.push({"route": route, "request": request});
    }
    processRequests();
}
function processRequests(){
    // Counter to track request submission and process one at a time;
    var i = 0;
    // Used to submit the request 'i'
    function submitRequest(){
        directionsService.route(requestArray[i].request, directionResults);
    }
    // Used as callback for the above request for current 'i'
    function directionResults(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            // Create a unique DirectionsRenderer 'i'
            renderArray[i] = new google.maps.DirectionsRenderer();
            renderArray[i].setMap(map);
            // Some unique options from the colorArray so we can see the routes
            // May set any options here such as registering on hover or click listeners, behavior etc.
            renderArray[i].setOptions({
                preserveViewport: true,
                suppressInfoWindows: true,
                polylineOptions: {
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                    strokeColor: 'black'//colourArray[i]
                },
                markerOptions:{
                    visible: false
                }
            });
            if (requestArray[i].route == "Route 331") {
              renderArray[i].setOptions({
                polylineOptions: {
                  strokeColor: 'gold'
                }
              });
            }
            // Use this new renderer with the result
            renderArray[i].setDirections(result);
            // and start the next request
            nextRequest();
        }
    }
    function nextRequest(){
        // Increase the counter
        i++;
        // Make sure we are still waiting for a request
        if(i >= requestArray.length){
            // No more to do
            return;
        }
        // Submit another request
        submitRequest();
    }
    // This request is just to kick start the whole process
    submitRequest();
}
generateRequests();

//Generate a LatLng object for each stop in stops arracy
for (i=0;i<stops.length;i++) {
  //How can I assign a new name to a variable based on its stop_code each time?
  var stops[i].stop_code = new google.maps.LatLng(stops[i].stop_lat,stops[i].stop_lon);
}

//
//Generate the allRoutes prototype object
var allRoutes = [];
//For each route, generate a DS, poly, and route object and push these into the allRoutes object
for (i=0;i<routes.length;i++) {
  var thing = {
    name: routes[i].route_short_name,
    route: "route"+routes[i].route_short_name,
    poly: "poly"+routes[i].route_short_name,
    ds: "ds"+routes[i].route_short_name,
    stops: []
  }
  //push the applicable stops into the stops array for the thing object
  for (j=0;j<SOMETHING.length;j++) {
    things.stops.push([j]);
  }
  thing.stops.push();

  //push the thing object into the allRoutes array
  allRoutes.push(thing);
}

//Old Loop Method with polylines-- Preferred method as they polylines are easier to manipulate after rendered.
var BTS = new google.maps.LatLng(48.750172,-122.47536);
var LCPR = new google.maps.LatLng(48.734558,-122.46602);
var APR = new google.maps.LatLng(48.619778,-122.35496);
var CPR = new google.maps.LatLng(48.482388,-122.33682);
var SS = new google.maps.LatLng(48.418167,-122.33413);
var CTS  = new google.maps.LatLng(48.792805,-122.49104);
var GMTM = new google.maps.LatLng(48.870419,-122.48566);
var CAFS = new google.maps.LatLng(48.998566,-122.26482);
var CATS = new google.maps.LatLng(48.761543,-122.47495);
var WAMS = new google.maps.LatLng(48.766968,-122.44523);
var LDLS = new google.maps.LatLng(48.744846,-122.46103);
var OLXS = new google.maps.LatLng(48.744087,-122.44357);
var SWAY = new google.maps.LatLng(48.706554,-122.44554);
// Route 80X
var DS80x = new google.maps.DirectionsService();
// var path80x = new google.maps.MVCArray();
var poly80x = new google.maps.Polyline({map:map});
var route80x = new google.maps.MVCArray();
// path80x.push(BTS);
// path80x.push(LCPR);
// path80x.push(APR);
// path80x.push(CPR);
// path80x.push(SS);

// Route 71x
var DS71x = new google.maps.DirectionsService();
// var path71x = new google.maps.MVCArray();
var poly71x = new google.maps.Polyline({map:map});
var route71x = new google.maps.MVCArray();

// path71x.push(BTS);
// path71x.push(CTS);
// path71x.push(GMTM);
// path71x.push(CAFS);

// Route 331
var DS331 = new google.maps.DirectionsService();
// var path331 = new google.maps.MVCArray();
var poly331 = new google.maps.Polyline({map:map});
var route331 = new google.maps.MVCArray();

// path331.push(BTS);
// path331.push(CATS);
// path331.push(WAMS);
// path331.push(CTS);

// Route 43
var DS43 = new google.maps.DirectionsService();
// var path43 = new google.maps.MVCArray();
var poly43 = new google.maps.Polyline({map:map});
var route43 = new google.maps.MVCArray();

// path43.push(BTS);
// path43.push(LDLS);
// path43.push(OLXS);
// path43.push(SWAY);

var allRoutes = [{
  name: "80x",
  // path: path80x,
  route: route80x,
  poly: poly80x,
  ds: DS80x,
  stops: [BTS, LCPR, APR, CPR, SS]
},
{
  name: "71x",
  // path: path71x,
  route: route71x,
  poly: poly71x,
  ds: DS71x,
  stops: [BTS, CTS, GMTM, CAFS]
},
{
  name: "331",
  // path: path331,
  route: route331,
  poly: poly331,
  ds: DS331,
  stops: [BTS, CATS, WAMS, CTS]
},
{
  name: "43",
  // path: path43,
  route: route43,
  poly: poly43,
  ds: DS43,
  stops: [BTS, LDLS, OLXS, SWAY]
}];

function generateRequests() {
  requestArray = [];
  for (var route in allRoutes) {
    var DS = allRoutes[route].ds;
    var waypts = [];
    // 'start' and 'finish' will be the routes origin and destination
    var start, finish;
    // lastpoint is used to ensure that duplicate waypoints are stripped
    var lastpoint;
    data = allRoutes[route].stops;
    limit = data.length;
    for (var waypoint = 0; waypoint < limit; waypoint++) {
      if (data[waypoint] === lastpoint){
        // Duplicate of of the last waypoint - don't bother
        continue;
      } 
      // Prepare the lastpoint for the next loop
      lastpoint = data[waypoint]
      // Add this to waypoint to the array for making the request
      waypts.push({
        location: data[waypoint],
        stopover: true
      });
    }
    // Grab the first waypoint for the 'start' location
    start = (waypts.shift()).location;
    // Grab the last waypoint for use as a 'finish' location
    finish = waypts.pop();
    if(finish === undefined){
      // Unless there was no finish location for some reason?
      finish = start;
    } else {
      finish = finish.location;
    }
    var request = [];
    var pathLength = allRoutes[route].stops.length;// used to be path.length
    for (var i=1;i<pathLength;i++) {
      request.push({
        origin: start,
        destination: finish,
        waypoints: waypts,
        travelMode: google.maps.TravelMode.DRIVING
      }); 
    }
    requestArray.push({"route": allRoutes[route], "request": request, "DS": DS});
  }
  processRequests();
}

function processRequests() {
  var i=0;
  function submitRequest() {
    requestArray[i].DS.route(requestArray[i].request[0], directionResults);
  }
  function directionResults(result, status) {
    if (status ==  google.maps.DirectionsStatus.OK) {
      for (var k=0, len=result.routes[0].overview_path.length;k<len;k++) {
        allRoutes[i].route.push(result.routes[0].overview_path[k]);
      }
      allRoutes[i].poly.setPath(allRoutes[i].route);
      //GO Line color options set here
      if (allRoutes[i].name === '331') {
        poly331.setOptions({
          strokeColor: 'gold'
        });
      }
      nextRequest();
    }
  }
  function nextRequest() {
    i++;
    if(i >= requestArray.length){
        return;
    }
    submitRequest();
  }
  submitRequest();
}
generateRequests();

// How to detect if polylines intersect given 2 sets of points
poly80x.getPath()



// for (var x=0;x<allRoutes.length;x++) {
//   var DS = allRoutes[x].ds;
//   for (var i=1;i<allRoutes[x].path.length;i++) {
//     DS.route({
//       origin: allRoutes[x].path.getAt(i-1),
//       destination: allRoutes[x].path.getAt(i),
//       travelMode: google.maps.DirectionsTravelMode.DRIVING
//     }, function(result, status) {
//       if (status==google.maps.DirectionsStatus.OK) {
//         for (var k=0, len=result.routes[0].overview_path.length;k<len;k++) {
//           allRoutes[x].route.push(result.routes[0].overview_path[k]);
//         }
//       }
//     });
//   }
//   allRoutes[x].poly.setPath(allRoutes[x].route);
// }

//user click event listener option
google.maps.event.addListener(map, "click", function(evt) {
  if (path.getLength() === 0) {
    path.push(evt.latLng);
    poly.setPath(path);
  } else {
    DS.route({
      origin: path.getAt(path.getLength() - 1),
      destination: evt.latLng,
      travelMode: google.maps.DirectionsTravelMode.DRIVING
    }, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        for (var i = 0, len = result.routes[0].overview_path.length;
            i < len; i++) {
          path.push(result.routes[0].overview_path[i]);
        }
      }
    });
  }
});

//optional listeners for style for old poly method
google.maps.event.addListener(poly, 'mouseover', function(e) {
  poly.setOptions({strokeColor: 'red'})
});
google.maps.event.addListener(poly, 'mouseout', function(e) {
  poly.setOptions({strokeColor: 'black'})
});