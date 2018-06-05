var restify = require('restify');
var git = require('isomorphic-git');
var fs = require('fs');
var to = require('await-to-js').to;
var sb = require('standard-bail')();
var defaults = require('lodash.defaults');
var ParseJSON = require('./parse_json');
var callNextTick = require('call-next-tick');

function PutCommitServer(
  { gitDir, secret, enableDirectFileAPI = false },
  done
) {
  var baseGitOpts = { fs, dir: gitDir };
  var server = restify.createServer({
    name: 'put-commit-server'
  });

  server.use(restify.CORS());
  server.use(restify.queryParser());

  server.get('/health', respondOK);
  if (enableDirectFileAPI) {
    server.put('/file', respondUpdateFile);
  }
  server.put('/json', responseUpdateJSON);
  server.head(/.*/, respondHead);

  git
    .status(defaults({ filepath: 'index.txt' }, baseGitOpts))
    .catch(done)
    .then(passServer);

  function passServer(status) {
    console.log('index.txt git status:', status);
    done(null, server);
  }

  function respondOK(req, res, next) {
    res.send(200, 'OK!');
    next();
  }

  function responseUpdateJSON(req, res, next) {
    respondUpdateFile(req, res, next, true);
  }

  function respondUpdateFile(req, res, next, validateJSON = false) {
    if (req.headers.authorization !== `Key ${secret}`) {
      res.send(401);
      next();
      return;
    }
    if (!req.query || !req.query.filename) {
      res.send(400, 'You need to provide a filename in the query string.');
      next();
      return;
    }

    if (req.query.filename.startsWith('.')) {
      res.send(400, 'Invalid filename.');
      next();
      return;
    }

    if (!req.query.name) {
      res.send(
        400,
        'You need to provide an (author) name in the query string.'
      );
      next();
      return;
    }

    if (!req.query.email) {
      res.send(400, 'You need to provide an email in the query string.');
      next();
      return;
    }

    var body = '';
    req.on('end', checkFile);
    req.on('data', collectBodyData);

    function collectBodyData(data) {
      body += data;
    }

    function checkFile() {
      if (!body) {
        res.send(400, 'You need to provide file content in the body.');
        next();
        return;
      }

      if (validateJSON) {
        ParseJSON(writeFile)(body);
      } else {
        callNextTick(writeFile);
      }

      function writeFile(error) {
        if (error) {
          res.send(422, error.message);
          next();
          return;
        }

        // TODO: Use mime type header?
        fs.writeFile(
          `${gitDir}/${req.query.filename}`,
          body,
          { encoding: 'utf8' },
          sb(addToGit, next)
        );
      }
    }

    async function addToGit() {
      let error;
      [error] = await to(
        git.add(defaults({ filepath: req.query.filename }, baseGitOpts))
      );
      if (error) {
        next(error);
        return;
      }
      let commitOpts = defaults(
        {
          author: { name: req.query.name, email: req.query.email },
          message: `An update from ${req.query.name}.`
        },
        baseGitOpts
      );
      [error] = await to(git.commit(commitOpts));

      if (error) {
        next(error);
        return;
      }
      res.json(200, { message: 'OK!' });
      next();
    }
  }

  function respondHead(req, res, next) {
    res.writeHead(200, {
      'content-type': 'application/json'
    });
    res.end();
    next();
  }
}

module.exports = PutCommitServer;
