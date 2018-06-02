/* global __dirname, process */
var test = require('tape');
var assertNoError = require('assert-no-error');
var fs = require('fs');
var PutCommitServer = require('../put-commit-server');
var request = require('request');

const testGitDir = __dirname + '/test-git-dir';
const testFile = 'test-file.txt';
const initialContents = 'Hey, this is a new file.';
const port = 6666;

const serverHost = process.env.SERVER || 'localhost';

const testSecret = 'secret';

var server;

// WARNING: Must be run via the make file in order to set up
// the test git repo beforehand.
PutCommitServer(
  { gitDir: testGitDir, secret: testSecret, enableDirectFileAPI: true },
  startServer
);

function startServer(error, theServer) {
  if (error) {
    console.log('Error creating server:', error);
    process.exit();
  }
  server = theServer;
  server.listen(port, runTests);
}

function runTests(error) {
  if (error) {
    console.log('Error starting server:', error);
    process.exit();
  }
  test('Put new file with bad secret', badSecretTest);
  test('Put new file', newFileTest);
  test('Close server', closeServer);

  function newFileTest(t) {
    request(getReqOpts(testSecret), checkResponse);

    function checkResponse(error, res, body) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 200, 'Correct status code is returned.');
      if (res.statusCode !== 200) {
        console.log('body:', body);
      }
      // t.ok(fs.existsSync(testGitDir + '/.git'), '.git dir exists.');
      var fileContents = fs.readFileSync(testGitDir + '/' + testFile, {
        encoding: 'utf8'
      });
      t.equal(fileContents, initialContents, 'Committed content is correct.');
      t.end();
    }
  }

  function badSecretTest(t) {
    request(getReqOpts('bad secret'), checkResponse);

    function checkResponse(error, res) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 401, 'Unauthorized status code is returned.');
      t.end();
    }
  }

  function closeServer(t) {
    server.close(t.end);
  }
}

function getReqOpts(secret) {
  return {
    method: 'PUT',
    url: `http://${serverHost}:${port}/file?filename=${
      testFile
    }&name=Dr.+Wily&email=wily@smallcatlabs.com`,
    body: initialContents,
    headers: {
      Authorization: `Key ${secret}`
    }
  };
}
