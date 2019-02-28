/* global __dirname, process */
var test = require('tape');
var assertNoError = require('assert-no-error');
var fs = require('fs');
var PutCommitServerCore = require('../put-commit-server-core');
var request = require('request');

const testGitDir = __dirname + '/test-git-dir';
const testFile = 'test-file.json';
var initialContents = { key: 'value' };
const port = 6666;

const serverHost = process.env.SERVER || 'localhost';

const testSecret = 'secret';

var server;

// WARNING: Must be run via the Makefile in order to set up
// the test git repo beforehand.
PutCommitServerCore(
  { gitDir: testGitDir, secret: testSecret, enableDirectFileAPI: false },
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
  test('Try to put new non-JSON file', nonJSONTest);
  test('Put new JSON file', newJSONTest);
  test('Update JSON file', updateJSONTest);
  test('Put bad JSON file', badJSONTest);
  test('Close server', closeServer);

  function nonJSONTest(t) {
    request(
      getReqOpts({
        secret: testSecret,
        path: 'file',
        json: false,
        body: JSON.stringify(initialContents)
      }),
      checkResponse
    );

    function checkResponse(error, res) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 405, 'Correct status code is returned.');
      fs.readFile(
        testGitDir + '/' + testFile,
        {
          encoding: 'utf8'
        },
        checkFileRead
      );
    }

    function checkFileRead(error) {
      t.ok(error, 'No file is created.');
      t.end();
    }
  }

  function newJSONTest(t) {
    request(
      getReqOpts({ secret: testSecret, body: initialContents }),
      checkResponse
    );

    function checkResponse(error, res, body) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 200, 'Correct status code is returned.');
      if (res.statusCode !== 200) {
        console.log('body:', body);
      }
      var fileContents = fs.readFileSync(testGitDir + '/' + testFile, {
        encoding: 'utf8'
      });
      t.deepEqual(
        JSON.parse(fileContents),
        initialContents,
        'Committed content is correct.'
      );
      t.end();
    }
  }

  function updateJSONTest(t) {
    var updateObj = { key: 'update' };
    request(getReqOpts({ secret: testSecret, body: updateObj }), checkResponse);

    function checkResponse(error, res, body) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 200, 'Correct status code is returned.');
      if (res.statusCode !== 200) {
        console.log('body:', body);
      }
      var fileContents = fs.readFileSync(testGitDir + '/' + testFile, {
        encoding: 'utf8'
      });
      t.deepEqual(
        JSON.parse(fileContents),
        updateObj,
        'Committed content is correct.'
      );
      t.end();
    }
  }

  function badJSONTest(t) {
    request(
      getReqOpts({
        secret: testSecret,
        body: '{bad: "JSON"}',
        json: false,
        filename: 'bad.json'
      }),
      checkResponse
    );

    function checkResponse(error, res, body) {
      assertNoError(t.ok, error, 'No error while making new file request.');
      t.equal(res.statusCode, 422, 'Correct status code is returned.');
      if (res.statusCode !== 422) {
        console.log('body:', body);
      }
      fs.readFile(
        testGitDir + '/bad.json',
        {
          encoding: 'utf8'
        },
        checkFileRead
      );
    }

    function checkFileRead(error) {
      t.ok(error, 'No file is created.');
      t.end();
    }
  }

  function closeServer(t) {
    server.close(t.end);
  }
}

function getReqOpts({
  secret,
  path = 'json',
  body,
  json = true,
  filename = testFile
}) {
  return {
    method: 'PUT',
    url: `http://${serverHost}:${port}/${path}?filename=${filename}&name=Dr.+Wily&email=wily@smallcatlabs.com`,
    body,
    json,
    headers: {
      Authorization: `Key ${secret}`
    }
  };
}
