import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { toSolidityJSON } from '..';
import { existsSync, readFileSync, rmSync } from 'node:fs';

const testData = {
	foo: '0x1234567890',
	foob: '0x1234567890234567890123456789012345678901234567890234567890123456789012345678901234567890',
	bar: 10n,
	baz: 10,
	qux: 'hello',
	values: [1, 2, 3, 4],
	test6: {
		foo: 'bar',
		amount: BigInt(10e18),
	},
	test7: {
		foo: 'bar',
		amount: BigInt(10e18),
	},
	quux: true,
	myAddress: '0x1234567890123456789012345678901234567890',
};

const nestedData = {
	addr: '0x1234567890123456789012345678901234567890',
	amount: BigInt(10e18),
	baz4: testData,
	baz54: testData,
	baz524: testData,
	baz52924: testData,
	baz529214: testData,
	nested: {
		arr: ['hello', 'world'],
		foo: 'bar',
		baz: testData,
		bar: 10,
		asf9: testData,
		asd2: testData,
		nested: {
			foo: 'bar',
			bar: 10,
			testData,
			nested2: {
				baz91: testData,
				baz582: testData,
				foo: 'bar',
				amount: BigInt(10e18),
			},
		},
	},
};

const testInput = {
	testA: testData,
	testA2: testData,
	testB: nestedData,
	testB2: nestedData,
	testB3: nestedData,
	testC: {
		val: 'hello',
	},
};

describe('pk-forge-json', () => {
	const keys = Object.keys(testInput);
	if (!process.cwd().includes('test')) throw new Error('Not in test directory');

	beforeEach(() => {
		toSolidityJSON(testInput);
	});

	afterEach(() => {
		rmSync('temp', { recursive: true });
		rmSync('temp2', { recursive: true });
		rmSync('src2', { recursive: true });
		rmSync('src', { recursive: true });
	});

	it('creates json files from data', () => {
		for (const key of keys) {
			const path = `temp/${key.toLowerCase()}.json`;
			expect(existsSync(path)).toBe(true);
		}
	});

	it('creates correct solidity file content', () => {
		const solFile = 'src/Types.sol';
		expect(existsSync(solFile)).toBe(true);

		const solContent = readFileSync(solFile, 'utf-8');

		expect(solContent).toContain(`interface ITypes {`);
		expect(solContent).toContain(`contract Types is ITypes {`);
		expect(solContent).toContain(`struct TestA {`);
		expect(solContent).not.toContain(`struct TestA2 {`);
		expect(solContent).toContain(`struct TestB {`);
		expect(solContent).not.toContain(`struct TestB2 {`);
		expect(solContent).not.toContain(`struct TestB# {`);
		expect(solContent).toContain(`struct TestC {`);
		expect(solContent).toContain(`function getTestA() internal virtual view returns (TestA memory) {`);
		expect(solContent).toContain(`function getTestA2() internal virtual view returns (TestA memory) {`);
		expect(solContent).toContain(`function getTestB() internal virtual view returns (TestB memory) {`);
		expect(solContent).toContain(`function getTestB2() internal virtual view returns (TestB memory) {`);
		expect(solContent).toContain(`function getTestB3() internal virtual view returns (TestB memory) {`);
		expect(solContent).toContain(`function getTestC() internal virtual view returns (TestC memory) {`);
	});

	it('creates files from config', () => {
		toSolidityJSON(testInput, { dirJSON: 'temp2', name: 'Foobar', dirSOL: 'src2' });

		for (const key of keys) {
			const path = `temp2/${key.toLowerCase()}.json`;
			expect(existsSync(path)).toBe(true);
		}

		const solFile = 'src2/Foobar.sol';
		expect(existsSync(solFile)).toBe(true);

		const solContent = readFileSync(solFile, 'utf-8');
		expect(solContent).toContain(`interface IFoobar {`);
		expect(solContent).toContain(`contract Foobar is IFoobar {`);

		toSolidityJSON(testInput, { dirJSON: 'temp2', dirSOL: 'src2' });

		const solFile2 = 'src2/Types.sol';
		expect(existsSync(solFile2)).toBe(true);

		const solContent2 = readFileSync(solFile2, 'utf-8');
		expect(solContent2).toContain(`interface ITypes {`);
		expect(solContent2).toContain(`contract Types is ITypes {`);
	});
});
