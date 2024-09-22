import type { Struct } from './template';
import { capitalize, ensureObject, isHex } from './utils';

export function createStruct(name = 'Struct', item: Record<string, unknown>, isTopLevel: boolean): Struct[] {
	ensureObject(item);

	const keys = Object.keys(item);
	const values = Object.values(item);
	const innerStructs = [] as Struct[];

	const parsedValues = values.map((val, idx) => {
		if (Array.isArray(val)) return `${parseType(val[0])}[]` as const;
		try {
			return parseType(val);
		} catch (e: any) {
			if (e.message?.startsWith?.('Unknown type')) {
				const innerName = `${name}${capitalize(keys[idx])}`;
				innerStructs.push(...createStruct(innerName, val as Record<string, unknown>, false));
				return innerName;
			}
			throw e;
		}
	});
	if (!parsedValues.length) throw new Error('No values to parse');

	return [
		{
			name,
			isTopLevel,
			file: name,
			typeId: parsedValues.join(''),
			content: `\tstruct ${name} {\n\t\t\t${keys
				.map((key, i) => `\t${parsedValues[i]} ${key};`)
				.join('\n\t\t\t')}\n\t\t}`,
		},
	].concat(innerStructs);
}

export function parseType(value: unknown) {
	if (isHex(value)) {
		const length = value.length - 2;
		if (length % 2) {
			throw new Error('Invalid hex length');
		}
		if (length === 40) return `address` as const;
		if (length > 64) return `bytes` as const;
		return `bytes32` as const;
	}

	if (typeof value === 'string') return 'string';

	if (typeof value === 'number' || typeof value === 'bigint') {
		if (value < 0) return 'int256';
		return 'uint256';
	}
	if (typeof value === 'boolean') return 'bool';

	throw new Error(`Unknown type: ${value}`);
}
