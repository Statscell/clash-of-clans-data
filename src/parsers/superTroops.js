const { writeFileSync, existsSync, mkdirSync } = require('fs');
const formatJson = require('json-format');

const path = require('path');
const RAW_CHARACTERS = require(path.resolve(__dirname, '../../raw/characters.json'));
const RAW_SUPER_TROOPS = require(path.resolve(__dirname, '../../raw/super_licences.json'));

const { getResourceName, getTextValue, getID } = require('../utils');


function parseSuperTroops() {
	const output = [];

	for (const troop of RAW_SUPER_TROOPS) {
		if (troop.Name.toLowerCase() === 'string') continue;
		const superTroop = RAW_CHARACTERS.find(raw => raw.Name === troop.Replacement);
		const superTID = superTroop.TID;
		const troopOriginal = RAW_CHARACTERS.find(raw => raw.Name === troop.Original);

		output.push({
			name: getTextValue(superTID),
			id: getID(superTID, 'troop'),
			original: getTextValue(troopOriginal.TID),
			minOriginalLevel: troop.MinOriginalLevel + 1,
			village: troop.VillageType === 1
				? 'builderBase'
				: 'home',
			duration: troop.DurationH * 60 * 60,
			cooldown: troop.CooldownH * 60 * 60,
			resource: getResourceName(troop.Resource),
			resourceCost: troop.ResourceCost,
			housingSpace: superTroop.HousingSpace
		});
	}

	if (!existsSync('./output')) mkdirSync('./output');
	writeFileSync('./output/super-troops.json', formatJson(output, { type: 'space', size: 2 }));
}

module.exports = { run: parseSuperTroops };
