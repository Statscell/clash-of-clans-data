const RAW_UNITS = require('../output/troopUpgradeStats.json');
const fs = require('fs');
const formatJson = require('json-format');

const units = [];
const equipment = [];

for (const unit of RAW_UNITS) {
	if (unit.category === 'equipment') {
		equipment.push({ name: unit.tid, seasonal: unit.allowedCharacters });
	}

	// delete unit.upgrade.resources;
	units.push(unit);
}

console.log(equipment.length);

fs.writeFileSync('./output/troopUpgradeStats-formatted.json', formatJson(units,{ type: 'space', size: 2 }));
fs.writeFileSync('./output/equipment.json', formatJson(equipment,{ type: 'space', size: 2 }));
