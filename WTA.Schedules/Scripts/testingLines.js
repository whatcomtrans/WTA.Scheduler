var DS = new google.maps.DirectionsService();
//auto load option
//Route 80X
var path80x = new google.maps.MVCArray();
var poly80x = new google.maps.Polyline({map:map});
var route80x = new google.maps.MVCArray();
var BTS = new google.maps.LatLng(48.750172,-122.47536);
var LCPR = new google.maps.LatLng(48.734558,-122.46602);
var APR = new google.maps.LatLng(48.619778,-122.35496);
var CPR = new google.maps.LatLng(48.482388,-122.33682);
var SS = new google.maps.LatLng(48.418167,-122.33413);
path80x.push(BTS);
path80x.push(LCPR);
path80x.push(APR);
path80x.push(CPR);
path80x.push(SS);


//Route 71x
var path71x = new google.maps.MVCArray();
var poly71x = new google.maps.Polyline({map:map});
var route71x = new google.maps.MVCArray();
var CTS  = new google.maps.LatLng(48.792805,-122.49104);
var GMTM = new google.maps.LatLng(48.870419,-122.48566);
var CAFS = new google.maps.LatLng(48.998566,-122.26482);
path71x.push(BTS);
path71x.push(CTS);
path71x.push(GMTM);
path71x.push(CAFS);

//Route 331
var path331 = new google.maps.MVCArray();
var poly331 = new google.maps.Polyline({map:map});
var route331 = new google.maps.MVCArray();
var CATS = new google.maps.LatLng(48.761543,-122.47495);
var WAMS = new google.maps.LatLng(48.766968,-122.44523);
path331.push(BTS);
path331.push(CATS);
path331.push(WAMS);
path331.push(CTS);

//Route 43
var path43 = new google.maps.MVCArray();
var poly43 = new google.maps.Polyline({map:map});
var route43 = new google.maps.MVCArray();
var LDLS = new google.maps.LatLng(48.744846,-122.46103);
var OLXS = new google.maps.LatLng(48.744087,-122.44357);
var SWAY = new google.maps.LatLng(48.706554,-122.44554);
path43.push(BTS);
path43.push(LDLS);
path43.push(OLXS);
path43.push(SWAY);

var allRoutes = [{
  name: "80x",
  path: path80x,
  route: route80x,
  poly: poly80x
},
{
  name: "71x",
  path: path71x,
  route: route71x,
  poly: poly71x
},
{
  name: "331",
  path: path331,
  route: route331,
  poly: poly331
},
{
  name: "43",
  path: path43,
  route: route43,
  poly: poly43
}];

for (var x=0;x<allRoutes.length;x++) {
  console.log(x);
  for (var i=1;i<allRoutes[x].path.length;i++) {
    console.log(i);
    DS.route({
      origin: allRoutes[x].path.getAt(i-1),
      destination: allRoutes[x].path.getAt(i),
      travelMode: google.maps.DirectionsTravelMode.DRIVING
    }, function(result, status) {
      if (status==google.maps.DirectionsStatus.OK) {
        for (var k=0, len=result.routes[0].overview_path.length;k<len;k++) {
          console.log(k);
          allRoutes[x].route.push(result.routes[0].overview_path[k]);
        }
      }
    });
  }
  allRoutes[x].poly.setPath(allRoutes[x].route);
}



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






//optional listeners for style
google.maps.event.addListener(poly, 'mouseover', function(e) {
  poly.setOptions({strokeColor: 'red'})
});
google.maps.event.addListener(poly, 'mouseout', function(e) {
  poly.setOptions({strokeColor: 'black'})
});