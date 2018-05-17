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
var server;

// WARNING: Must be run via the make file in order to set up
// the test git repo beforehand.
PutCommitServer({ gitDir: testGitDir }, startServer);

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
  test('Put new file', newFileTest);
  test('Close server', closeServer);

  function newFileTest(t) {
    var reqOpts = {
      method: 'PUT',
      url: `http://localhost:${port}/file?filename=${
        testFile
      }&name=Dr.+Wily&email=wily@smallcatlabs.com`,
      body: initialContents
    };
    request(reqOpts, checkResponse);

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

  function closeServer(t) {
    server.close(t.end);
  }
}
