import * as world from '../library/world.js';
import convoManager from '../conversation.js';
import { getAdjacentBlocksString, getInventoryString, pad } from '../npc/utils.js';

// queries are commands that just return strings and don't affect anything in the world
export const queryList = [
    {
        name: "!stats",
        description: "Get your bot's location, health, hunger, and time of day.", 
        perform: function (agent) {
            let bot = agent.bot;
            let res = 'STATS';
            let pos = bot.entity.position;
            // display position to 2 decimal places
            res += `\n- Position: x: ${pos.x.toFixed(2)}, y: ${pos.y.toFixed(2)}, z: ${pos.z.toFixed(2)}`;
            res += `\n- Gamemode: ${bot.game.gameMode}`;
            res += `\n- Health: ${Math.round(bot.health)} / 20`;
            res += `\n- Hunger: ${Math.round(bot.food)} / 20`;
            res += `\n- Biome: ${world.getBiomeName(bot)}`;
            res += `\n- Dimension: ${bot.game.dimension}`;
            let weather = "Clear";
            if (bot.rainState > 0)
                weather = "Rain";
            if (bot.thunderState > 0)
                weather = "Thunderstorm";
            res += `\n- Weather: ${weather}`;
            // let block = bot.blockAt(pos);
            // res += `\n- Artficial light: ${block.skyLight}`;
            // res += `\n- Sky light: ${block.light}`;
            // light properties are bugged, they are not accurate

            if (bot.time.timeOfDay < 6000) {
                res += '\n- Time: Morning';
            } else if (bot.time.timeOfDay < 12000) {
                res += '\n- Time: Afternoon';
            } else {
                res += '\n- Time: Night';
            }

            // get the bot's current action
            let action = agent.actions.currentActionLabel;
            if (agent.isIdle())
                action = 'Idle';
            res += `\n- Current Action: ${action}`;


            let players = world.getNearbyPlayerNames(bot);
            let bots = convoManager.getInGameAgents().filter(b => b !== agent.name);
            players = players.filter(p => !bots.includes(p));

            res += '\n- Nearby Human Players: ' + (players.length > 0 ? players.join(', ') : 'None.');
            res += '\n- Nearby Bot Players: ' + (bots.length > 0 ? bots.join(', ') : 'None.');
            res += getInventoryString(agent);
            res += agent.bot.modes.getMiniDocs();
            res += getAdjacentBlocksString(bot);
            if (agent.memory_bank.getKeys()) {
                res += "\nSAVED PLACES\n- ";
                res += agent.memory_bank.getKeys().replaceAll(', ', '\n- ');
            }
            if (world.getNearestBlock(agent.bot, 'crafting_table')) {
                res += getCraftableString(agent);
            }
            return pad(res);
        }
    },
    {
        name: "!inventory",
        description: "Get your bot's inventory.",
        perform: function (agent) {
            return getInventoryString(agent);
        }
    },
    {
        name: "!nearbyBlocks",
        description: "Get the blocks near the bot.",
        perform: function (agent) {
            let bot = agent.bot;
            let res = 'NEARBY_BLOCKS';
            let blocks = world.getNearbyBlockDetails(bot);
            for (let i = 0; i < blocks.length; i++) {
                res += `\n- ${blocks[i]}`;
            }
            if (blocks.length == 0) {
                res += ': none';
            }
            res += `\nYour location: [${Math.round(bot.entity.position.x)},${Math.round(bot.entity.position.y)},${Math.round(bot.entity.position.z)}]`;
            res += getAdjacentBlocksString(bot); 
            return pad(res);
        }
    },
    {
        name: "!craftable",
        description: "Get the craftable items with the bot's inventory.",
        perform: function (agent) {
            return getCraftableString(agent);
        }
    },
    {
      name: "!recipe",
      description: "Get the proper item name and materials required to craft an item.",
      params: {
          item: { 
              type: 'string', 
              description: 'The name of the item to craft.' 
          }
        },
        perform: function (agent, item) {
            let recipe = world.getRecipe(agent.bot, item);
            if (recipe.error) {
                return `RECIPE:\nItem to craft: ${recipe.item}\nError: ${recipe.error}`;
            } else {
                return `RECIPE:\nItem to craft: ${recipe.item}\nMaterials: ${recipe.materials?.join(', ')}`;
            }
        }
    },
    {
        name: "!entities",
        description: "Get the nearby players and entities.",
        perform: function (agent) {
            let bot = agent.bot;
            let res = 'NEARBY_ENTITIES';
            let players = world.getNearbyPlayerNames(bot);
            let bots = convoManager.getInGameAgents().filter(b => b !== agent.name);
            players = players.filter(p => !bots.includes(p));

            for (const player of players) {
                res += `\n- Human player: ${player}`;
            }
            for (const bot of bots) {
                res += `\n- Bot player: ${bot}`;
            }

            for (const entity of world.getNearbyEntityTypes(bot)) {
                if (entity === 'player' || entity === 'item')
                    continue;
                res += `\n- entities: ${entity}`;
            }
            if (res == 'NEARBY_ENTITIES') {
                res += ': none';
            }
            return pad(res);
        }
    },
    {
        name: "!modes",
        description: "Get all available modes and their docs and see which are on/off.",
        perform: function (agent) {
            return agent.bot.modes.getDocs();
        }
    },
    {
        name: '!savedPlaces',
        description: 'List all saved locations.',
        perform: async function (agent) {
            return "Saved place names: " + agent.memory_bank.getKeys();
        }
    }
];


// queries are commands that just return strings and don't affect anything in the world
// role queries vary per role so aren't included by default
export const roleQueryList = [
    {
        name: "!scanFarm",
        description: "Get details about the nearby farm blocks.",
        perform: function (agent) {
            let bot = agent.bot;
            let res = 'SCAN_FARM';
            let block_types = ["composter", "dirt_path", "farmland", "wheat", "wheat_seeds", "beetroot_seeds", "melon_seeds", "grass_block", "melon", "melon_seeds", "beetroots", "potatoes", "carrots", "pumpkin_seeds", "pumpkin"]
            let blocks = world.getNearbyBlockDetails(bot, block_types, 16, 16);
            for (let i = 0; i < blocks.length; i++) {
                res += `\n- ${blocks[i]}`;
            }
            if (blocks.length == 0) {
                res += ': none';
            }
            res += `\nYour location: [${Math.round(bot.entity.position.x)},${Math.round(bot.entity.position.y)},${Math.round(bot.entity.position.z)}]`;
            res += getAdjacentBlocksString(bot); 
            return pad(res);
        }
    },
]


function getCraftableString(agent) {
    let craftable = world.getCraftableItems(agent.bot);
    let res = 'CRAFTABLE_ITEMS';
    for (const item of craftable) {
        res += `\n- ${item}`;
    }
    if (res == 'CRAFTABLE_ITEMS') {
        res += ': none';
    }
    return pad(res);
}

