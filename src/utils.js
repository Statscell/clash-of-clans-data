const RAW_TEXTS = require('../raw/texts.json');
const RAW_TEXTS_PATCH = require('../raw/texts_patch.json');
const RAW_RESOURCES = require('../raw/resources.json');
const RAW_CHARACTERS = require('../raw/characters.json');
const RAW_SPELLS = require('../raw/spells.json');
const RAW_PETS = require('../raw/pets.json');
const RAW_HEROES = require('../raw/heroes.json');

function getTextValue(id) {
	const found = RAW_TEXTS.find(field => field.TID === id) ?? RAW_TEXTS_PATCH.find(field => field.TID === id);
	return found
		? found.EN
		: id;
}

function getResourceName(id) {
	const resource = RAW_RESOURCES.find(field => field.Name === id);
	return resource
		? getTextValue(resource.AltTID ?? resource.TID)
		: id;
}

function getID(TID, type) {
	let list = null;
	if (type === 'troop' || type === 'siege') list = RAW_CHARACTERS;
	else if (type === 'spell') list = RAW_SPELLS;
	else if (type === 'pet') list = RAW_PETS;
	else if (type === 'hero') list = RAW_HEROES;

	if (!list) return null;

	return list
		.slice(1)
		.filter(ch => ch.Name !== '')
		.map(ch => ch.TID)
		.indexOf(TID);
}

module.exports = { getResourceName, getTextValue, getID };
