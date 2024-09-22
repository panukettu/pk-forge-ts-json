import { writeFileSync } from 'node:fs';
import { createStruct } from './src/logic';
import { template, type Struct } from './src/template';
import { capitalize, ensureObject, mergeDuplicates, padKeys, pathJSON, solPath } from './src/utils';

type Input = {
	[key: string]: Record<string, unknown>;
};

export type Config = {
	name?: string;
	dirSOL?: string;
	dirJSON?: string;
};

export function toSolidityJSON(input: Input, config?: Config) {
	const cfg = { ...{ dirJSON: 'temp', name: 'Types' }, ...config };
	const names = toJSON(input, cfg.dirJSON);

	let structs = [] as Struct[];
	Object.values(input).forEach((item, i) => {
		structs.push(...createStruct(names[i], item, true));
	});

	while (structs.some((s, _, self) => self.some((s2) => s2.typeId === s.typeId && s2.name !== s.name))) {
		structs = mergeDuplicates(structs);
	}
	writeFileSync(solPath(cfg.name, cfg.dirSOL), template(cfg.name, structs));
}

export function toJSON(input: Input, dirJSON = 'temp') {
	ensureObject(input);

	return Object.keys(input).map((key) => {
		if (typeof input[key] !== 'object' || !input[key]) throw new Error('Data must be an object');

		writeFileSync(pathJSON(dirJSON, `${key.toLowerCase()}.json`), JSON.stringify(padKeys(input[key]), null, 2));
		return capitalize(key);
	});
}
