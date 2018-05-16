#!/usr/bin/env node

/* global process */

var PutCommitServer = require('./put-commit-server');
var logFormat = require('log-format');
const port = 6666;

PutCommitServer({ gitDir: process.env.GITDIR }, useServer);

function useServer(error, server) {
  if (error) {
    process.stderr.write(error);
    process.exit(1);
    return;
  }

  server.listen(port, onReady);

  function onReady(error) {
    if (error) {
      process.stderr.write(error);
    } else {
      process.stdout.write(logFormat(server.name, 'listening at', server.url));
    }
  }
}
