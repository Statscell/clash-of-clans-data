const { writeFileSync, existsSync, mkdirSync } = require('fs');
const formatJson = require('json-format');

const path = require('path');
const RAW_CHARACTERS = require(path.resolve(__dirname, '../../raw/characters.json'));
const RAW_SPELLS = require(path.resolve(__dirname, '../../raw/spells.json'));
const RAW_HEROES = require(path.resolve(__dirname, '../../raw/heroes.json'));
const RAW_PETS = require(path.resolve(__dirname, '../../raw/pets.json'));
const HERO_EQUIPMENTS = require(path.resolve(__dirname, '../../raw/character_items.json'));
const RAW_BUILDINGS = require(path.resolve(__dirname, '../../raw/buildings.json'));

const { maxTH, maxBH } = require('../../config.json');

const { getResourceName, getTextValue, getID, getResourceAndCost, getAllowedCharacters } = require('../utils');

const TYPES = {
	TROOPS: 0,
	SPELLS: 1,
	HEROES: 2,
	PETS: 3,
	EQUIPMENT: 4
};

// eslint-disable-next-line require-await
async function parseStats() {
	const troopsInfo = _parseStats(RAW_CHARACTERS, TYPES.TROOPS);
	const spellsInfo = _parseStats(RAW_SPELLS, TYPES.SPELLS);
	const heroesInfo = _parseStats(RAW_HEROES, TYPES.HEROES);
	const petsInfo = _parseStats(RAW_PETS, TYPES.PETS);
	const equipmentsInfo = _parseStats(HERO_EQUIPMENTS, TYPES.EQUIPMENT);

	const outputItems = [].concat(troopsInfo, spellsInfo, heroesInfo, petsInfo, equipmentsInfo);

	if (!existsSync('./output')) mkdirSync('./output');
	writeFileSync('./output/troopUpgradeStats.json', formatJson(outputItems, { type: 'space', size: 2 }));
}

function _parseStats(inputItems, type) {
	// temporary variables
	let validCharacter = { name: '', village: '' };
	let hallLevel = 1;

	// Every valid output character
	const outputList = [];

	for (let i = 1; i < inputItems.length; i++) {
		const character = inputItems[i];

		// soft exit for no name and no last character name
		if (character.Name === '' && validCharacter.name === '') {
			hallLevel = 1;
			continue;
		}

		// Ignoring all the disabled characters
		if ((type !== TYPES.PETS && character.DisableProduction === true) || (type !== TYPES.TROOPS && character.EnabledBySuperLicence === true) || character.Deprecated === true || character.IsSecondaryTroop === true || character.EnabledByCalendar === true) {
			validCharacter.name = '';
			continue;
		}

		const village = character.VillageType === 1
			? 'builderBase'
			: 'home';

		const upgradeTime = type === TYPES.EQUIPMENT
			? null
			: formatUpdateTime(character.UpgradeTimeH, character.UpgradeTimeM);
		const upgradeCost = type === TYPES.EQUIPMENT
			? parseInt(character.UpgradeCosts)
			: character.UpgradeCost === ''
				? null
				: parseInt(character.UpgradeCost);
		const upgradeResourceAndCost = type === TYPES.EQUIPMENT
			? getResourceAndCost(character.UpgradeCosts, character.UpgradeResources)
			: null;
		const allowedCharacters = type === TYPES.EQUIPMENT
			? getAllowedCharacters(character.AllowedCharacters)
			: [];

		const dps = character.DPS || 0;
		const regenerationTime = type === TYPES.HEROES
			? character.RegenerationTimeMinutes * 60
			: null;

		// unlock values
		let unlockValues = {
			hall: null,
			cost: 0,
			time: 0,
			resource: '',
			building: '',
			buildingLevel: 0,
		};

		// handling different character types
		if (type === TYPES.HEROES) {
			unlockValues.hall = hallLevel = character.RequiredTownHallLevel;
			const heroAltar = RAW_BUILDINGS.find(build => build.TID === character.TID);
			if (heroAltar) {
				unlockValues.cost = heroAltar.BuildCost;
				unlockValues.time = formatUnlockTime(heroAltar.BuildTimeD, heroAltar.BuildTimeH, heroAltar.BuildTimeM, heroAltar.BuildTimeS);
				unlockValues.resource = getResourceName(heroAltar.BuildResource);
				unlockValues.building = getTextValue(heroAltar.TID);
				unlockValues.buildingLevel = 1;
			}
		} else {
			const productionBuildingType = type === TYPES.SPELLS
				? 'SpellForgeLevel'
				: type === TYPES.PETS
					? 'LaboratoryLevel'
					: type === TYPES.EQUIPMENT
						? 'RequiredBlacksmithLevel'
						: 'BarrackLevel';


			if (character.Name !== '' && character[productionBuildingType] !== '') {
				// some weird fix.. because the pets file sucks
				const productionBuildingField = type === TYPES.PETS
					? 'Pet Shop'
					: type === TYPES.EQUIPMENT
						? 'Blacksmith'
						: character.ProductionBuilding;
				// Resetting hall level to 1 for new troop
				hallLevel = 1;
				const _build = RAW_BUILDINGS.find(build => {
					if (type === TYPES.EQUIPMENT) {
						const buildingLevel = character[productionBuildingType];
						return build.BuildingLevel === buildingLevel && build.ExportName.includes(`${productionBuilding[productionBuildingField]}`);
					}
					return build.ExportName === `${productionBuilding[productionBuildingField]}${character[productionBuildingType]}`;
				});
				// unlock Values
				unlockValues.time = formatUnlockTime(_build.BuildTimeD, _build.BuildTimeH, _build.BuildTimeM, _build.BuildTimeS);
				unlockValues.cost = _build.BuildCost;
				const _buildLvl1 = RAW_BUILDINGS.find(build => build.ExportName === `${productionBuilding[productionBuildingField]}1`);
				unlockValues.resource = getResourceName(_buildLvl1.BuildResource);
				unlockValues.building = getTextValue(_buildLvl1.TID);
				unlockValues.hall = _build.TownHallLevel || _buildLvl1.TownHallLevel;
				unlockValues.buildingLevel = _build.BuildingLevel || _buildLvl1.BuildingLevel;
				// console.log(unlockValues);
			}

			// Getting required TH level for current character level
			if (!isNaN(character.LaboratoryLevel)) {
				const labBuildName = type === TYPES.PETS
					? 'PetLab'
					: validCharacter.village === 'home'
						? 'Lab'
						: 'Lab2';
				const labThRequirement = RAW_BUILDINGS
					.find(build => build.ExportName === `${labBuilding[labBuildName]}${character.LaboratoryLevel || 1}`).TownHallLevel;
				hallLevel = unlockValues.hall
					? Math.max(unlockValues.hall, hallLevel)
					: Math.max(hallLevel, labThRequirement);
			}

			if (!isNaN(character.RequiredBlacksmithLevel)) {
				const blRequirement = RAW_BUILDINGS
					.find(build => {
						const buildingLevel = character[productionBuildingType];
						return build.BuildingLevel === buildingLevel && build.ExportName.includes(`${productionBuilding['Blacksmith']}`);
					}).TownHallLevel;
				hallLevel = unlockValues.hall
					? Math.max(unlockValues.hall, hallLevel)
					: Math.max(hallLevel, blRequirement);
			}
		}

		// Adding new character to the list
		if (character.Name) {
			if (character.TID === '') continue;
			validCharacter.name = character.Name;
			validCharacter.village = village;

			const category = type === TYPES.HEROES
				? 'hero'
				: type === TYPES.SPELLS
					? 'spell'
					: type === TYPES.EQUIPMENT
						? 'equipment'
						: 'troop';
			const subCategory = [TYPES.TROOPS, TYPES.PETS].includes(type)
				? unlockValues.building === 'Workshop'
					? 'siege'
					: unlockValues.building === 'Pet House'
						? 'pet'
						: 'troop'
				: category;

			// Adding info
			outputList.push({
				_name: character.Name,
				tid: character.TID,
				id: getID(character.TID, subCategory),
				name: getTextValue(character.TID),
				housingSpace: character.HousingSpace || 0,
				village,
				category,
				subCategory,
				unlock: unlockValues,
				resourceType: getResourceName(character.TrainingResource),
				trainingTime: ![TYPES.HEROES, TYPES.PETS, TYPES.EQUIPMENT].includes(type)
					? character.TrainingTime
					: 0,
				regenerationTimes: type === TYPES.HEROES
					? [regenerationTime]
					: [],
				dps: dps > 0
					? [dps]
					: [],
				upgrade: {
					cost: upgradeCost
						? [upgradeCost]
						: [],
					time: upgradeTime
						? [upgradeTime]
						: [],
					resource: getResourceName(character.UpgradeResource || character.UpgradeResources),
					resources: upgradeResourceAndCost?.length
						? [upgradeResourceAndCost]
						: []
				},
				allowedCharacters,
				maxLevel: character.VisualLevel || 1,
				minLevel: character.VisualLevel || 1,
				hallLevels: [hallLevel],
				seasonal: character.EnabledByCalendar === true
			});

		} else {
			if (validCharacter.name === '') continue;
			const foundItem = outputList.find(itm => itm._name === validCharacter.name && itm.village === validCharacter.village);
			if (!foundItem) continue;

			if (dps > 0) foundItem.dps.push(dps);
			if (regenerationTime) foundItem.regenerationTimes.push(regenerationTime);
			if (upgradeCost) foundItem.upgrade.cost.push(upgradeCost);
			if (upgradeTime) foundItem.upgrade.time.push(upgradeTime);
			if (upgradeResourceAndCost?.length) foundItem.upgrade.resources.push(upgradeResourceAndCost);
			foundItem.hallLevels.push(hallLevel);
			foundItem.maxLevel = Math.max(foundItem.maxLevel, character.VisualLevel || 1);
			foundItem.minLevel = Math.min(foundItem.minLevel, character.VisualLevel || 1);
		}
	}

	return outputList.map((itm) => {
		const levels = [];
		let previousLevel = 0;
		const maxHall = itm.village === 'home'
			? maxTH
			: maxBH;

		for (let i = 1; i <= Math.max(...itm.hallLevels, maxHall); i++) {
			const possibleLevel = itm.hallLevels.lastIndexOf(i);
			if (possibleLevel >= 0) {
				levels.push(possibleLevel + (itm.minLevel || 1));
				previousLevel = possibleLevel + (itm.minLevel || 1);
			} else {
				levels.push(previousLevel);
			}
		}
		delete itm.hallLevels;
		// delete itm.minLevel;
		delete itm.maxLevel;
		delete itm._name;
		itm.levels = levels;
		return itm;
	});
}

function formatUpdateTime(timeH, timeM) {
	const time = (isNaN(timeH)
		? 0
		: timeH * 60) + (isNaN(timeM)
		? 0
		: timeM);
	return time === 0
		? 0
		: parseInt(time) * 60;
}

function formatUnlockTime(timeD, timeH, timeM, timeS) {
	return parseInt((isNaN(timeD)
		? 0
		: timeD * 24 * 60 * 60) + (isNaN(timeH)
		? 0
		: timeH * 60 * 60) + (isNaN(timeM)
		? 0
		: timeM * 60) + (isNaN(timeS)
		? 0
		: timeS));
}

const productionBuilding = {
	'Barrack': 'barracks_lvl',
	'Dark Elixir Barrack': 'darkBarracks_lvl',
	'Barrack2': 'adv_training_camp_lvl',
	'SiegeWorkshop': 'siegeWorkshop_lvl',
	'Spell Forge': 'spell_factory_lvl',
	'Mini Spell Factory': 'mini_spell_distillery_lvl',
	'Pet Shop': 'pet_house_lvl',
	'Blacksmith': 'blacksmith_lvl'
};

const labBuilding = {
	'Lab': 'laboratory_lvl',
	'Lab2': 'Telescope_lvl',
	'PetLab': 'pet_house_lvl'
};

// eslint-disable-next-line no-unused-vars
const heroAltars = {
	'TID_BARBARIAN_KING': 'heroaltar_barbarian_king_lvl',
	'TID_ARCHER_QUEEN': 'heroaltar_archer_queen_lvl',
	'TID_WARMACHINE': 'heroaltar_warmachine_lvl',
	// 'TID_HERO_BATTLE_COPTER': 'heroaltar_battle_copter_lvl',
	'TID_HERO_ROYAL_CHAMPION': 'heroaltar_royal_champion_lvl',
	'TID_GRAND_WARDEN': 'heroaltar_elder_lvl'
};

module.exports = { run: parseStats };
