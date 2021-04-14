const { parser } = require('../config.json');
const { convert } = require('./csv2json');

async function main() {
	// Initially converting the raw CSV files to Json format..
	await convert();

	// Parsing upgrade stats
	if (parser.upgradeStats) {
		const { run } = require('./parsers/upgradeStats');
		run();
	}

	// super troops info
	if (parser.superTroops) {
		const { run } = require('./parsers/superTroops');
		run();
	}
}

main();
