const RAW_UNITS = require('../output/troopUpgradeStats-formatted.json');
const RAW_SUPER_UNITS = require('../output/super-troops.json');

const fs = require('fs');

fs.writeFileSync('./output/raw.json', JSON.stringify({ RAW_UNITS, RAW_SUPER_UNITS }, null, 0));
