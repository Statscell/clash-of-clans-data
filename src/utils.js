const path = require('path');
const RAW_TEXTS = require(path.resolve(__dirname, '../raw/texts.json'));
const RAW_TEXTS_PATCH = require(path.resolve(__dirname, '../raw/texts_patch.json'));
const RAW_RESOURCES = require(path.resolve(__dirname, '../raw/resources.json'));
const RAW_CHARACTERS = require(path.resolve(__dirname, '../raw/characters.json'));
const RAW_SPELLS = require(path.resolve(__dirname, '../raw/spells.json'));
const RAW_PETS = require(path.resolve(__dirname, '../raw/pets.json'));
const RAW_HEROES = require(path.resolve(__dirname, '../raw/heroes.json'));
const HERO_EQUIPMENTS = require(path.resolve(__dirname, '../raw/character_items.json'));

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

function getResourceAndCost(costs, resourceIds) {
	const _costs = costs.toString().split(';').map((c) => c.trim()).map((c) => Number(c));
	const resources = RAW_RESOURCES.filter(field => resourceIds.split(';').map((t) => t.trim()).includes(field.Name));
	return resources.map((resource, i) => {
		return {
			resource: getTextValue(resource.AltTID ?? resource.TID),
			cost: _costs[i],
		};
	});
}

function getAllowedCharacters(allowedCharacters) {
	return allowedCharacters.split(';').filter((name) => name).map((name) => {
		const character = RAW_HEROES.find((char) => char.Name === name);
		return getTextValue(character.TID);
	});
}

function getID(TID, type) {
	let list = null;
	if (type === 'troop' || type === 'siege') list = RAW_CHARACTERS;
	else if (type === 'spell') list = RAW_SPELLS;
	else if (type === 'pet') list = RAW_PETS;
	else if (type === 'hero') list = RAW_HEROES;
	else if (type === 'equipment') list = HERO_EQUIPMENTS;

	if (!list) return null;

	return list
		.slice(1)
		.filter(ch => ch.Name !== '')
		.findIndex((ch) => ch.TID === TID && (type === 'troop'
			? ch.DisableProduction !== true
			: true));
}

module.exports = { getResourceName, getTextValue, getID, getResourceAndCost, getAllowedCharacters };
