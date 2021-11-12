var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'pdf-search',
  description: 'Web service wrapping elastic search for pdf searching',
  script: 'C:\\path-to-node-script\\server.js'
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

// Uninstall the service.
svc.uninstall();
