const { readdirSync, readFileSync, writeFileSync } = require('fs');
const ScCompression = require('sc-compression');
const { parser } = require('../config.json');
const { convert } = require('./csv2json');
const { resolve } = require('path');


async function decompress() {
	for await (const path of ['assets/csv', 'assets/localization', 'assets/logic']) {
		console.log(`Decompressing files in ${path}`);
		readdirSync(path).forEach((file) => {
			const filepath = resolve(path, file);
			const buffer = readFileSync(filepath);
			writeFileSync(filepath, ScCompression.decompress(buffer));
		});
	}

	console.log('Done!');
}

async function main() {
	// Initially converting the raw CSV files to Json format..
	if (process.argv.includes('--decompress')) await decompress();
	await convert();

	// Parsing upgrade stats
	if (parser.upgradeStats) {
		const { run } = require('./parsers/upgradeStats');

		try {
			await run();
		} catch (error) {
			console.log(error);
		}
	}

	// super troops info
	if (parser.superTroops) {
		const { run } = require('./parsers/superTroops');
		try {
			await run();
		} catch (error) {
			console.log(error);
		}
	}
}

main();
