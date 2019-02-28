TESTGITDIR = tests/test-git-dir

pushall:
	git push origin master
	npm publish

prettier:
	prettier --single-quote --write "**/*.js"

test-clean:
	rm -rf $(TESTGITDIR)
	mkdir -p $(TESTGITDIR) && \
	  cd $(TESTGITDIR) && \
	  touch index.txt && \
	  git init && \
	  git add . && \
	  git commit -a -m"Initial commit."

test: test-clean
	node tests/put-json-tests.js
	node tests/put-commit-server-tests.js

