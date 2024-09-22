import { join } from 'node:path';
import type { Struct } from './template';
import { existsSync, mkdirSync } from 'node:fs';
import { type Config } from '..';

export function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function padKeys(item: object) {
	let count = 0;

	return Object.entries(item).reduce((acc, [key, value]) => {
		const keyPad = `${(count++).toString().padStart(2, '0')}_${key}`;
		if (typeof value === 'bigint') {
			acc[keyPad] = Number(value);
		} else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			acc[keyPad] = padKeys(value);
		} else {
			acc[keyPad] = value;
		}
		return acc;
	}, {} as Record<string, unknown>);
}

export function isAddress(value: unknown): value is `0x${string}` {
	return typeof value === 'string' && value.length === 42;
}

export function isHex(value: unknown): value is `0x${string}` {
	return typeof value === 'string' && value.startsWith('0x');
}

export function ensureObject(value: unknown) {
	if (typeof value !== 'object' || value === null || Array.isArray(value))
		throw new Error(`Data must be an object, got: ${typeof value}`);
}

export function mergeDuplicates(structs: Struct[]) {
	let result = structs;
	for (let index = 0; index < structs.length; index++) {
		const struct = structs[index];
		const existing = result.find((s) => s.name !== struct.name && s.typeId === struct.typeId);
		if (!existing) continue;

		const shorter = struct.name.length < existing.name.length ? struct : existing;
		const longer = struct.name.length < existing.name.length ? existing : struct;

		result = result
			.map((s) => {
				if (s.name === longer.name) {
					if (!s.isTopLevel) return null;
					s.name = shorter.name;
					s.content = '';
				}
				if (s.content.includes(longer.name)) {
					s.content = s.content.replace(new RegExp(longer.name, 'g'), shorter.name);
					s.typeId = s.typeId.replace(longer.name, shorter.name);
				}
				return s;
			})
			.filter(Boolean) as Struct[];
	}
	return result;
}

export const dirSources = () => {
	try {
		return getPath(require(getPath('foundry.toml')).profile.default.src);
	} catch {
		return process.cwd();
	}
};

export const solPath = (name: string, dir = dirSources()) => {
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	return join(dir, `${name}.sol`);
};

export const pathJSON = (dir: string, name: string) => {
	const path = join(getPath(dir));

	if (!existsSync(path)) mkdirSync(path, { recursive: true });

	return join(path, name);
};

export const getPath = (path: string) => join(process.cwd(), path);
