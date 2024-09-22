import { capitalize } from './utils';

export type Struct = { name: string; file: string; typeId: string; content: string; isTopLevel: boolean };

export const template = (name: string, structs: Struct[]) =>
	`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface I${name} {\n\t${structs
		.filter((s) => s.content)
		.map((s) => s.content)
		.join('\n\n  ')}\n}

contract ${name} is I${name} {
		address private constant vm = address(uint160(uint256(keccak256("hevm cheat code"))));

    ${structs
			.filter((s) => s.isTopLevel)
			.map((s) => {
				const structName = capitalize(s.name);
				return `function get${capitalize(s.file)}() internal virtual view returns (${structName} memory) {
        return abi.decode(getJSON("${s.file.toLowerCase()}.json"), (${structName}));
    }`;
			})
			.join('\n\n    ')}

		function getJSON(string memory path) private view returns (bytes memory) {
			(, bytes memory data) = vm.staticcall(bytes.concat(hex'60f9bb11', abi.encode(path)));
			(, bytes memory json) = vm.staticcall(bytes.concat(hex'6a82600a', data));
			return abi.decode(json, (bytes));
		}\n}`;
