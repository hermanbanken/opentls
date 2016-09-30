browserify src/main.ts --debug \
-p [ tsify --noImplicitAny -p typings/index.d.ts -t ES6 ] \
-u form-data \
-u request \
-u node-fetch \
-s opentls > build/app.js
