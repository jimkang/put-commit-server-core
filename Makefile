HOMEDIR = $(shell pwd)
SMUSER = bot
PRIVUSER = root
SERVER = smidgeo
SSHCMD = ssh $(SMUSER)@$(SERVER)
PRIVSSHCMD = ssh $(PRIVUSER)@$(SERVER)
PROJECTNAME = put-commit-server
APPDIR = /opt/$(PROJECTNAME)
TESTGITDIR = tests/test-git-dir

pushall: update-remote
	git push origin master

sync:
	rsync -a $(HOMEDIR) $(SMUSER)@$(SERVER):/opt/ --exclude node_modules/ --exclude data/
	$(SSHCMD) "cd /opt/$(PROJECTNAME) && npm install"

restart-remote:
	$(PRIVSSHCMD) "service $(PROJECTNAME) restart"

set-permissions:
	$(PRIVSSHCMD) "chmod +x $(APPDIR)/$(PROJECTNAME).js && \
	chmod 777 -R $(APPDIR)/data/"

update-remote: sync set-permissions restart-remote

install-service:
	$(PRIVSSHCMD) "cp $(APPDIR)/$(PROJECTNAME).service /etc/systemd/system && \
	systemctl daemon-reload"

set-up-directories:
	$(PRIVSSHCMD) "mkdir -p $(APPDIR)/data"

initial-setup: set-up-directories sync set-permissions install-service

check-status:
	$(SSHCMD) "systemctl status $(PROJECTNAME)"

prettier:
	prettier --single-quote --write "**/*.js"

test:
	rm -rf $(TESTGITDIR)
	mkdir -p $(TESTGITDIR) && \
	  cd $(TESTGITDIR) && \
	  touch index.txt && \
	  git init && \
	  git add . && \
	  git commit -a -m"Initial commit."
	node tests/put-commit-server-tests.js
