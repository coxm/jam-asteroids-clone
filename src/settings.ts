export const players = new Set<string>();


export const DEV = (
	typeof (window as any).DEV === 'boolean' &&
	(window as any).DEV === true
);
console.log('Running in', DEV ? 'dev' : 'production', 'mode');
