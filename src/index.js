const { upgradeStats } = require('../config.json');
const { convert } = require('./csv2json');

async function main() {
	// Initially converting the raw CSV files to Json format..
	await convert();

	// Parsing upgrade stats
	if (upgradeStats) {
		const { run } = require('./parsers/upgradeStats');
		run();
	}
}

main();
