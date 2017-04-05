//App cache handling -- updated
if (window.applicationCache.status === 5) {
  console.log('obsolete manifest state');
  window.location.reload();
}
window.applicationCache.addEventListener('onobsolete', function(e) {
  console.log('obsolete manifest event');
  window.location.reload();
});

window.applicationCache.addEventListener('updateready', function(e) {
	console.log('update is ready!');
	if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
	  console.log('new manifest');
	  window.applicationCache.swapCache();
	  window.location.reload();
	} else {
	  console.log('old manifest');
	}
}, false);
try {window.applicationCache.update();} catch(e) {console.log(e);}

//Load notices from SharePoint
var notices;
function loadNotices() {
  var xhttp = new XMLHttpRequest();
  xhttp.responseType = 'json';
  xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        var rss = xhttp.response;
        notices = rss.items;
        var noticeList = $("#noticeList");
        noticeList.empty();
        for (i = 0; i < notices.length; i ++) {
        	var noticeID = notices[i].url.substring(70);
            noticeList.append("<li><a href='http://www.ridewta.com/espanol/Pages/notice-details.aspx?ID=" + noticeID + "'>" + notices[i].title + "</a></li>");
        }
        setTimeout(loadNotices, 5000);
      }
    }
  xhttp.open("GET", "https://api.ridewta.com/notices/es/", true);
  xhttp.send();
}
setTimeout(loadNotices, 1000);
