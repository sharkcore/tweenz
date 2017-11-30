any: build

node_modules: package.json
	yarn

build: node_modules
	./node_modules/.bin/babel src -d lib --watch
