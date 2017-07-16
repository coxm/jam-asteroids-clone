tsc=./node_modules/typescript/bin/tsc

svg_sources=$(shell find assets/img -type f -wholename "*.svg")
svg_outputs=$(svg_sources:%.svg=%.png)


.PHONY: default
default: game
	


.PHONY: all
all: jam game
	


.PHONY: jam
jam:
	mkdir -p dist/js/jam
	$(tsc) -p config/jam.tsconfig.json


.PHONY: game
game:
	mkdir -p dist/js/game
	$(tsc) -p config/game.tsconfig.json


.PHONY: svgs
svgs: $(svg_outputs)
	


assets/img/%.png: assets/img/%.svg
	inkscape -z -e "$@" "$+"
