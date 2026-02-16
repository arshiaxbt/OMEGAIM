const solc = require('solc');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../contracts/OmegaAim.sol'), 'utf8');

const input = {
  language: 'Solidity',
  sources: { 'OmegaAim.sol': { content: source } },
  settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  output.errors.forEach(e => {
    if (e.severity === 'error') {
      console.error(e.formattedMessage);
      process.exit(1);
    }
  });
}

const contract = output.contracts['OmegaAim.sol']['OmegaAim'];
const abi = contract.abi;
const bytecode = '0x' + contract.evm.bytecode.object;

// Save ABI for frontend
fs.mkdirSync(path.resolve(__dirname, '../src/lib'), { recursive: true });
fs.writeFileSync(
  path.resolve(__dirname, '../src/lib/contract.ts'),
  `export const OMEGAAIM_ABI = ${JSON.stringify(abi, null, 2)} as const;\n\nexport const OMEGAAIM_BYTECODE = "${bytecode}";\n`
);

console.log('Contract compiled successfully!');
console.log(`ABI written to src/lib/contract.ts`);
