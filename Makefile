tsc=./node_modules/typescript/bin/tsc

json_assets=$(shell find assets/actors assets/sectors -type f -wholename "*.json")
minified_assets=$(json_assets:%=dist/%)


svg_sources=$(shell find assets/img -type f -wholename "*.svg")
svg_outputs=$(svg_sources:assets/img/%.svg=dist/img/%.png)


.PHONY: default
default: game svgs
	


.PHONY: all
all: jam game svgs
	


.PHONY: jam
jam:
	mkdir -p dist/js/jam
	$(tsc) -p config/jam.tsconfig.json


.PHONY: game
game:
	mkdir -p dist/js/game
	$(tsc) -p config/game.tsconfig.json


.PHONY: dist
dist: minify-assets
	node script/create-bundle.js
	node script/create-index.js
	./node_modules/cssmin/bin/cssmin style.css > dist/style.css
	if [ ! -f dist/system-production.js ]; then cp node_modules/systemjs/dist/system-production.js dist/; fi


.PHONY: minify-assets
minify-assets: $(minified_assets)
	


dist/assets/%.json: assets/%.json
	mkdir -p dist/assets/actors dist/assets/sectors
	./script/minify.js "$^" "$@"


.PHONY: svgs
svgs: $(svg_outputs)
	


dist/img/%.png: assets/img/%.svg
	inkscape -z -e "$@" "$+"
