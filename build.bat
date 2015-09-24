@echo Off
Echo Using NODE.JS with UglifyJS installed
if "%1"=="" goto help
goto %1

:help
Echo Use parameter css to minify the CSS, ex "build css"
Echo Use parameter js to minify the JavaScript, ex "build js"
Echo Use parameter isntall to install the UglifyJS2 and UglifyCSS to global, ex "build install"
pause
goto :end

:css
cd WTA.Schedules
cd css
Echo Minifying and combining CSS
uglifycss bootstrap.min.css bootstrap-custom.css font-awesome.min.css jquery-ui.min.css bootstrap-theme.min.css main.min.css > schedules.min.css
cd ..
cd ..

:js
cd WTA.Schedules
cd Scripts
Echo Minifying and combining Javascript application files
uglifyjs jquery-ui.min.js linq.min.js bootstrap.min.js jquery-1.9.0.min.js routes.js > app.min.js
cd ..
cd ..
Echo Minifying and combining data
uglifyjs trips.js stops.js stop_times.js calendar.js calendar_dates.js > data.min.js
cd ..
cd ..

goto end
:install
Echo Installing UglifyJS 2
npm install uglify-js -g

Echo Installing UglifyCSS
npm install uglifycss -g

:end
cls
