/* global __dirname, process */
var test = require('tape');
var assertNoError = require('assert-no-error');
var fs = require('fs');
var PutCommitServer = require('../put-commit-server');
var request = require('request');

const testGitDir = __dirname + '/test-git-dir';
const testFile = 'test-file.json';
var initialContents = {"key": "value"};
const port = 6666;

const serverHost = process.env.SERVER || 'localhost';

const testSecret = 'secret';

var server;

// WARNING: Must be run via the make file in order to set up
// the test git repo beforehand.
PutCommitServer({ gitDir: testGitDir, secret: testSecret, disableDirectFileAPI: true }, startServer);

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
  test('Try to put new non-JSON file', nonJSONTest);
  test('Put new JSON file', newJSONTest);
  test('Update JSON file', updateJSONTest);
  test('Close server', closeServer);

  function nonJSONTest(t) {
    request(getReqOpts(testSecret), checkResponse);

    function checkResponse(error, res, body) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 404, 'Correct status code is returned.');
      var fileContents = fs.readFileSync(testGitDir + '/' + testFile, {
        encoding: 'utf8'
      });
      t.equal(fileContents, '', 'No file is created.');
      t.end();
    }
  }

  function newJSONTest(t) {
    request(getReqOpts(testSecret, initialContents), checkResponse);

    function checkResponse(error, res, body) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 200, 'Correct status code is returned.');
      if (res.statusCode !== 200) {
        console.log('body:', body);
      }
      var fileContents = fs.readFileSync(testGitDir + '/' + testFile, {
        encoding: 'utf8'
      });
      t.equal(JSON.parse(fileContents), initialContents, 'Committed content is correct.');
      t.end();
    }
  }
  
  function updateJSONTest(t) {
    var updateObj = { key: 'update' };
    request(getReqOpts(testSecret, updateObj), checkResponse);

    function checkResponse(error, res, body) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 200, 'Correct status code is returned.');
      if (res.statusCode !== 200) {
        console.log('body:', body);
      }
      var fileContents = fs.readFileSync(testGitDir + '/' + testFile, {
        encoding: 'utf8'
      });
      t.equal(JSON.parse(fileContents), updateObj, 'Committed content is correct.');
      t.end();
    }
  }
 
  function closeServer(t) {
    server.close(t.end);
  }
}

function getReqOpts(secret, objectToPut) {
  return {
    method: 'PUT',
    url: `http://${serverHost}:${port}/file?filename=${
      testFile
    }&name=Dr.+Wily&email=wily@smallcatlabs.com`,
    body: objectToPut || initialContents,
    json: typeof objectToPut === 'object',
    headers: {
      Authorization: `Key ${secret}`
    }
  };
}
