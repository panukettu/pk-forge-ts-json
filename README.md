# forge + ts + json

Writes object keys to JSON files and generates solidity types and getters for them.

## Input

```typescript
import { toSolidityJSON } from '@pkxp/forge-ts-json';

const foo = {
  amount: 1,
  amountETH: 10_000.15e18,
  value: -11e16,
  description: 'hello',
  qux: {
    enabled: true,
    values: [1, 2, 3],
  },
};

const bar = {
  foo,
  abc: 'def',
  similar: {
    foo,
    bar: 10,
    amount: -10,
  },
  baz: {
    val: '0x12342AAABBBCCCDDDDDDDDDD111111111111111121491294219491294129491249129491',
    val2: '0x12342AAABBBCCCDDDDDDDDDD1111111111111111214912',
    addr: '0x12342AAABBBCCCDDDDDDDDDD1111111111111111',
    foo,
    similar2: {
      foo,
      bar: 10,
      amount: -15,
    },
  },
};

toSolidityJSON(
  { bar, foo, baz: { c: 'd' }, foo2: foo, baz2: { c: 'd' } },
  { name: 'Types', dirJSON: 'temp', dirSOL: 'src' } // all optional, dirSOL default is 'profile.default.src' from foundry.toml
);
```

## Solidity Output

Above snippet generates the following solidity at `src/Types.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITypes {
		struct Bar {
				Foo foo;
				string abc;
				BarSimilar similar;
				BarBaz baz;
		}

  	struct BarSimilar {
				Foo foo;
				uint256 bar;
				int256 amount;
		}

  	struct BarBaz {
				bytes val;
				bytes32 val2;
				address addr;
				Foo foo;
				BarSimilar similar2;
		}

  	struct Foo {
				uint256 amount;
				uint256 amountETH;
				int256 value;
				string description;
				FooQux qux;
		}

  	struct FooQux {
				bool enabled;
				uint256[] values;
		}

  	struct Baz {
				string c;
		}
}

contract Types is ITypes {
		address private constant vm = address(uint160(uint256(keccak256("hevm cheat code"))));

    function getBar() internal virtual view returns (Bar memory) {
        return abi.decode(getJSON("bar.json"), (Bar));
    }

    function getFoo() internal virtual view returns (Foo memory) {
        return abi.decode(getJSON("foo.json"), (Foo));
    }

    function getBaz() internal virtual view returns (Baz memory) {
        return abi.decode(getJSON("baz.json"), (Baz));
    }

    function getFoo2() internal virtual view returns (Foo memory) {
        return abi.decode(getJSON("foo2.json"), (Foo));
    }

    function getBaz2() internal virtual view returns (Baz memory) {
        return abi.decode(getJSON("baz2.json"), (Baz));
    }

		function getJSON(string memory path) private view returns (bytes memory) {
			(, bytes memory data) = vm.staticcall(bytes.concat(hex'60f9bb11', abi.encode(path)));
			(, bytes memory json) = vm.staticcall(bytes.concat(hex'6a82600a', data));
			return abi.decode(json, (bytes));
		}
}
```

## JSON Output

Example snippet generates `temp/bar.json`, `temp/foo.json`, `temp/foo2.json`, `temp/baz.json`, `temp/baz2.json`

All inner keys are renamed to match struct order when parsing in solidity, eg. `temp/bar.json`:

```json
{
  "00_foo": {
    "00_amount": 1,
    "01_amountETH": 1.000015e22,
    "02_value": -110000000000000000,
    "03_description": "hello",
    "04_qux": {
      "00_enabled": true,
      "01_values": [1, 2, 3]
    }
  },
  "01_abc": "def",
  "02_similar": {
    "00_foo": {
      "00_amount": 1,
      "01_amountETH": 1.000015e22,
      "02_value": -110000000000000000,
      "03_description": "hello",
      "04_qux": {
        "00_enabled": true,
        "01_values": [1, 2, 3]
      }
    },
    "01_bar": 10,
    "02_amount": -10
  },
  "03_baz": {
    "00_val": "0x12342AAABBBCCCDDDDDDDDDD111111111111111121491294219491294129491249129491",
    "01_val2": "0x12342AAABBBCCCDDDDDDDDDD1111111111111111214912",
    "02_addr": "0x12342AAABBBCCCDDDDDDDDDD1111111111111111",
    "03_foo": {
      "00_amount": 1,
      "01_amountETH": 1.000015e22,
      "02_value": -110000000000000000,
      "03_description": "hello",
      "04_qux": {
        "00_enabled": true,
        "01_values": [1, 2, 3]
      }
    },
    "04_similar2": {
      "00_foo": {
        "00_amount": 1,
        "01_amountETH": 1.000015e22,
        "02_value": -110000000000000000,
        "03_description": "hello",
        "04_qux": {
          "00_enabled": true,
          "01_values": [1, 2, 3]
        }
      },
      "01_bar": 10,
      "02_amount": -15
    }
  }
}
```
