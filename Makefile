tsc=./node_modules/typescript/bin/tsc


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
