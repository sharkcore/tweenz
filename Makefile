any: build

.PHONY: test
test: node_modules
	yarn run flow
	yarn run lint
	yarn test

node_modules: package.json
	yarn

.PHONY: build
build: node_modules
	./node_modules/.bin/babel src -d lib
	./node_modules/.bin/flow-copy-source src lib
