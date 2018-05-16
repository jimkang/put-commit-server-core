var restify = require('restify');
var callNextTick = require('call-next-tick');

function PutCommitServer({ gitDir }, done) {
  // TODO: Basically everything.
  var server = restify.createServer({
    name: 'put-commit-server'
  });

  server.use(restify.CORS());
  server.use(restify.queryParser());

  server.get('/health', respondOK);
  server.put('/file', respondUpdateFile);
  server.head(/.*/, respondHead);

  // Do async init here, if needed, then call callback.
  callNextTick(done, null, server);
}

function respondOK(req, res, next) {
  res.send(200, 'OK!');
  next();
}

function respondUpdateFile(req, res, next) {
  // TODO.
  res.send(200, 'OK!');
  next();
}

function respondHead(req, res, next) {
  res.writeHead(200, {
    'content-type': 'application/json'
  });
  res.end();
  next();
}

module.exports = PutCommitServer;
