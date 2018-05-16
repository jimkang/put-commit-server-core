/* global __dirname */
var test = require('tape');
var assertNoError = require('assert-no-error');
var fs = require('fs');
var PutCommitServer = require('../put-commit-server');
var request = require('request');

const testGitDir = __dirname + '/test-git-dir';
const testFile = 'test-file.txt';
const initialContents = 'Hey, this is a new file.';
const port = 6666;
var server;

// WARNING: Must be run via the make file in order to set up
// the test git repo beforehand.

PutCommitServer({ gitDir: testGitDir }, startServer);

function startServer(error, theServer) {
  if (error) {
    throw error;
  }
  server = theServer;
  server.listen(port, runTests);
}

function runTests(error) {
  if (error) {
    throw error;
  }
  test('Put new file', newFileTest);
  test('Close server', closeServer);

  function newFileTest(t) {
    var reqOpts = {
      method: 'PUT',
      url: `http://localhost:${port}/file?filename=${testFile}`,
      body: initialContents
    };
    request(reqOpts, checkResponse);

    function checkResponse(error, res) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 200, 'Correct status code is returned.');
      // t.ok(fs.existsSync(testGitDir + '/.git'), '.git dir exists.');
      var fileContents = fs.readFileSync(testGitDir + '/' + testFile);
      t.equal(fileContents, initialContents, 'Committed content is correct.');
      t.end();
    }
  }

  function closeServer(t) {
    t.end(server.close);
  }
}
