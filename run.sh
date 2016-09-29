browserify src/main.ts --debug -p [ tsify --noImplicitAny -p typings/index.d.ts -t ES6 ] > build/app.js
