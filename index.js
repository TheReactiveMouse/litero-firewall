const net = require('net');
const fs = require('fs');
const dns = require('dns');
const server = net.createServer();
const {Worker} = require("worker_threads");
if (process.argv[3] == "github_test"){
  console.log(process.argv);
  return true
} else {


server.on('connection', (clientToProxySocket) => {
  console.log('[PROXY] Handling request...');
  // We need only the data once, the starting packet
  clientToProxySocket.once('data', (data) => {
    // If you want to see the packet uncomment below
    // console.log(data.toString());
    console.log(data.toString());
    const isTLSConnection = data.toString().indexOf('CONNECT') !== -1;

    // By Default port is 80
    let serverPort = 80;
    let serverAddress;
    if (isTLSConnection) {
      // Port changed if connection is TLS
      serverPort = data.toString()
                          .split('CONNECT ')[1].split(' ')[0].split(':')[1];
      serverAddress = data.toString()
                          .split('CONNECT ')[1].split(' ')[0].split(':')[0];
    } else {
      serverAddress = data.toString().split('Host: ')[1].split('\r\n')[0];
    }

    console.log(serverAddress);

    fs.readFile("rules.txt", encoding="utf-8", (err, result2) => {
      dns.resolve(serverAddress, callback=(err, result) => {
        if (result2.includes(result) == true){
          let proxyToServerSocket = net.createConnection({
            host: serverAddress,
            port: serverPort
          }, () => {
            console.log(`DISALLOWED TRAFFIC : ${serverAddress} / ${result}`);
            console.log('PROXY TO SERVER SET UP');
            if (isTLSConnection) {
              clientToProxySocket.write('HTTP/1.1 200 OK\r\n\n');
            } else {
              proxyToServerSocket.write(data);
            }
      
            clientToProxySocket.pipe(proxyToServerSocket);
            proxyToServerSocket.pipe(clientToProxySocket);
      
            proxyToServerSocket.on('error', () => {
            });
            
          });
          clientToProxySocket.on('error', () => {
          });
          } else {
            console.log(`DISALLOWED TRAFFIC : ${serverAddress} / ${result}`);
            clientToProxySocket.destroy();
            }
      });
    });
  });
});

server.on('error', (err) => {
  console.log('[PROXY] Something went wrong...');
  console.log(err);
});

server.on('close', () => {
  console.log('[PROXY] CONNECTION END');
});

server.listen(8124, () => {
  console.log(`Firewall running at 0.0.0.0:8124, connect your clients and have fun.`);
});
}