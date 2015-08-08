@echo Off
Echo Using NODE.JS with UglifyJS installed
goto %1
Echo Minifying and combining Javascript application files
cd WTA.Schedules
cd Scripts
uglifyjs jquery-ui.min.js linq.min.js main.js bootstrap.min.js -o app.min.js
/*  Moved to a seperate site.
Echo Minifying and combining data set 1
cd ..
cd data
uglifyjs routes.js calendar.js calendar_dates.js stops.js -o data_routes.js
Echo Minifying and combining data set 1
uglifyjs trips.js stop_times.min.js -o data_trips.js
cd ..
*/
Echo Minifying and combining CSS
cd css
uglifycss bootstrap.min.css bootstrap-custom.css font-awesome.min.css jquery-ui.min.css main.css > combined.css

goto end
:install
Echo Installing UglifyJS 2
npm install uglify-js -g

Echo Installing UglifyCSS
npm install uglifycss -g

:end
cls
