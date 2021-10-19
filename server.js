// Just a small server I use to test my static site locally.
const http = require('http'),
      { URL } = require('url'),
      fs = require('fs'),
      path = require('path'),
      basedir = __dirname,
      port = process.argv[2] || 8888;

http.createServer((request, response) => {
    try {
        const reqURL = new URL(request.url, `http://${request.headers.host}`);
        let pathname = reqURL.pathname;
        if(pathname.endsWith("/")) pathname += "index.html";

        let ext = /(?:\.([^.]+))?$/.exec(pathname)[1]; // https://stackoverflow.com/a/680982
        switch(ext) {
            case "html": response.writeHead(200, { "Content-Type": "text/html" });
            case "js":   response.writeHead(200, { "Content-Type": "application/javascript" });
            case "json": response.writeHead(200, { "Content-Type": "application/json" });
            case "css":  response.writeHead(200, { "Content-Type": "text/css" });
            case "txt":  response.writeHead(200, { "Content-Type": "text/plain" });
        }

        const fspath = basedir + path.normalize(pathname);
        const stream = fs.createReadStream(fspath);

        stream.pipe(response);
        stream.on('open', () => response.writeHead(200));
        stream.on('error', (e) => {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.write("404 Not Found :)");
            response.end();
        });
   } catch(e) {
        response.writeHead(500);
        response.end();
        console.error(e.stack);
   }
}).listen(port);

console.log(`Listening on port ${port}.`);
