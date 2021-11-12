var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'pdf-search',
  description: 'Web service wrapping elastic search for pdf searching',
  script: 'C:\\path-to-node-script\\server.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();
