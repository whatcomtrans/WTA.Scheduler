@echo Off
Echo Using NODE.JS with UglifyJS installed
if "%1"=="" goto runit
goto %1
:runit
cd WTA.Schedules
cd css
Echo Minifying and combining CSS
uglifycss bootstrap.min.css bootstrap-custom.css font-awesome.min.css jquery-ui.min.css bootstrap-theme.min.css main.css scheduler.css > schedules.min.css
cd ..
cd Scripts
Echo Minifying and combining Javascript application files
uglifyjs jquery-ui.min.js linq.min.js bootstrap.min.js jquery-1.9.0.min.js scheduler.js > app.min.js
cd ..

goto end
:install
Echo Installing UglifyJS 2
npm install uglify-js -g

Echo Installing UglifyCSS
npm install uglifycss -g

:end
cls
