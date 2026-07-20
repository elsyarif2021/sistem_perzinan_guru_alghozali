import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Diagnostic server is working!\n');
});

const PORT = 3000;

server.on('error', (err) => {
  console.error('SERVER ERROR:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Diagnostic server successfully listening on http://127.0.0.1:${PORT}`);
});

process.on('exit', (code) => {
  console.log(`PROCESS EXITING with code: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
