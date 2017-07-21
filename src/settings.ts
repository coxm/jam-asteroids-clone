let numPlayers: number = 1;


export const players = {
	get count(): number { return numPlayers; },
	set count(val: number) { numPlayers = val; }
};
