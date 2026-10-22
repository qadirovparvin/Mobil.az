const { exec } = require('child_process');
const net = require('net');

function isPortOpen(port) {
  return new Promise((resolve) => {
    const s = net.createConnection(port, '127.0.0.1', () => {
      s.end();
      resolve(true);
    });
    s.on('error', () => {
      const s2 = net.createConnection(port, 'localhost', () => {
        s2.end();
        resolve(true);
      });
      s2.on('error', () => resolve(false));
      s2.setTimeout(1000, () => { s2.destroy(); resolve(false); });
    });
    s.setTimeout(1000, () => { s.destroy(); resolve(false); });
  });
}

(async () => {
  const open = await isPortOpen(5000);
  if (open) {
    console.log('Backend already running on 5000');
    process.exit(0);
  }
  console.log('Starting backend...');
  if (process.platform === 'win32') {
    exec(`powershell -Command "Start-Process node -ArgumentList server.js -WorkingDirectory '${__dirname}' -WindowStyle Hidden"`);
  } else {
    exec('nohup node server.js >/dev/null 2>&1 &', { cwd: __dirname });
  }
  setTimeout(() => process.exit(0), 1200);
})();
