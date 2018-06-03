#!/usr/bin/env node

/* global process */

var PutCommitServer = require('./put-commit-server');
var logFormat = require('log-format');
var config = require('./config');

const port = 6666;

PutCommitServer(
  {
    gitDir:
      process.env.GITDIR || '/usr/share/nginx/html/smidgeo.com/story-beat-data',
    secret: config.secret
  },
  useServer
);

function useServer(error, server) {
  if (error) {
    process.stderr.write(logFormat(error.message, error.stack));
    process.exit(1);
    return;
  }

  server.listen(port, onReady);

  function onReady(error) {
    if (error) {
      process.stderr.write(logFormat(error.message, error.stack));
    } else {
      process.stdout.write(logFormat(server.name, 'listening at', server.url));
    }
  }
}
