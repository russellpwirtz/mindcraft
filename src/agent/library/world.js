import pf from 'mineflayer-pathfinder';
import * as mc from '../../utils/mcdata.js';


export function getNearestFreeSpace(bot, size=1, distance=8) {
    /**
     * Get the nearest empty space with solid blocks beneath it of the given size.
     * @param {Bot} bot - The bot to get the nearest free space for.
     * @param {number} size - The (size x size) of the space to find, default 1.
     * @param {number} distance - The maximum distance to search, default 8.
     * @returns {Vec3} - The south west corner position of the nearest free space.
     * @example
     * let position = world.getNearestFreeSpace(bot, 1, 8);
     **/
    let empty_pos = bot.findBlocks({
        matching: (block) => {
            return block && block.name == 'air';
        },
        maxDistance: distance,
        count: 1000
    });
    for (let i = 0; i < empty_pos.length; i++) {
        let empty = true;
        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                let top = bot.blockAt(empty_pos[i].offset(x, 0, z));
                let bottom = bot.blockAt(empty_pos[i].offset(x, -1, z));
                if (!top || !top.name == 'air' || !bottom || bottom.drops.length == 0 || !bottom.diggable) {
                    empty = false;
                    break;
                }
            }
            if (!empty) break;
        }
        if (empty) {
            return empty_pos[i];
        }
    }
}


export function getNearestBlocks(bot, block_types=null, distance=16, count=10000) {
    /**
     * Get a list of the nearest blocks of the given types.
     * @param {Bot} bot - The bot to get the nearest block for.
     * @param {string[]} block_types - The names of the blocks to search for.
     * @param {number} distance - The maximum distance to search, default 16.
     * @param {number} count - The maximum number of blocks to find, default 10000.
     * @returns {Block[]} - The nearest blocks of the given type.
     * @example
     * let woodBlocks = world.getNearestBlocks(bot, ['oak_log', 'birch_log'], 16, 1);
     **/
    // if blocktypes is not a list, make it a list
    let block_ids = [];
    if (block_types === null) {
        block_ids = mc.getAllBlockIds(['air']);
    }
    else {
        if (!Array.isArray(block_types))
            block_types = [block_types];
        for(let block_type of block_types) {
            block_ids.push(mc.getBlockId(block_type));
        }
    }

    let positions = bot.findBlocks({matching: block_ids, maxDistance: distance, count: count});
    let blocks = [];
    for (let i = 0; i < positions.length; i++) {
        let block = bot.blockAt(positions[i]);
        let distance = positions[i].distanceTo(bot.entity.position);
        blocks.push({ block: block, distance: distance });
    }
    blocks.sort((a, b) => a.distance - b.distance);

    let res = [];
    for (let i = 0; i < blocks.length; i++) {
        res.push(blocks[i].block);
    }
    return res;
}


export function getNearestBlock(bot, block_type, distance=16) {
     /**
     * Get the nearest block of the given type.
     * @param {Bot} bot - The bot to get the nearest block for.
     * @param {string} block_type - The name of the block to search for.
     * @param {number} distance - The maximum distance to search, default 16.
     * @returns {Block} - The nearest block of the given type.
     * @example
     * let coalBlock = world.getNearestBlock(bot, 'coal_ore', 16);
     **/
    let blocks = getNearestBlocks(bot, block_type, distance, 1);
    if (blocks.length > 0) {
        return blocks[0];
    }
    return null;
}


export function getNearbyEntities(bot, maxDistance=16) {
    let entities = [];
    for (const entity of Object.values(bot.entities)) {
        const distance = entity.position.distanceTo(bot.entity.position);
        if (distance > maxDistance) continue;
        entities.push({ entity: entity, distance: distance });
    }
    entities.sort((a, b) => a.distance - b.distance);
    let res = [];
    for (let i = 0; i < entities.length; i++) {
        res.push(entities[i].entity);
    }
    return res;
}

export function getNearestEntityWhere(bot, predicate, maxDistance=16) {
    return bot.nearestEntity(entity => predicate(entity) && bot.entity.position.distanceTo(entity.position) < maxDistance);
}


export function getNearbyPlayers(bot, maxDistance) {
    if (maxDistance == null) maxDistance = 16;
    let players = [];
    for (const entity of Object.values(bot.entities)) {
        const distance = entity.position.distanceTo(bot.entity.position);
        if (distance > maxDistance) continue;
        if (entity.type == 'player' && entity.username != bot.username) {
            players.push({ entity: entity, distance: distance });
        } 
    }
    players.sort((a, b) => a.distance - b.distance);
    let res = [];
    for (let i = 0; i < players.length; i++) {
        res.push(players[i].entity);
    }
    return res;
}


export function getInventoryStacks(bot) {
    let inventory = [];
    for (const item of bot.inventory.items()) {
        if (item != null) {
            inventory.push(item);
        }
    }
    return inventory;
}


export function getInventoryCounts(bot) {
    /**
     * Get an object representing the bot's inventory.
     * @param {Bot} bot - The bot to get the inventory for.
     * @returns {object} - An object with item names as keys and counts as values.
     * @example
     * let inventory = world.getInventoryCounts(bot);
     * let oakLogCount = inventory['oak_log'];
     * let hasWoodenPickaxe = inventory['wooden_pickaxe'] > 0;
     **/
    let inventory = {};
    for (const item of bot.inventory.items()) {
        if (item != null) {
            if (inventory[item.name] == null) {
                inventory[item.name] = 0;
            }
            inventory[item.name] += item.count;
        }
    }
    return inventory;
}

export function getRecipe(bot, item) {
  /**
   * Get a recipe of the item to be crafted.
   * @param {Bot} bot - The bot to get the craftable items for.
   * @returns {{"item": String, "materials": []}} - A map of the crafting item name and a list of the materials required.
   * @example
   * let recipe = world.getRecipe(bot, 'stone_pickaxe');
   **/
  let res = {};

  if (item === "hoe") {
    item = "stone_hoe";
  }

  res.item = item;
  res.materials = [];

  let itemsToCraft = mc.getAllItems().filter(i => i.name === item);
  if (!itemsToCraft || itemsToCraft.length < 1) {
    return {"item": item, "error": "Unable to find item."};
  }
  
  let itemIdToCraft = itemsToCraft[0].id;
  let itemNameToCraft = itemsToCraft[0].name;

  let allRecipes = bot.recipesAll(itemIdToCraft,null,1,null);
  if (!allRecipes || allRecipes.length < 1) {
    return {"item": itemNameToCraft, "error": "Unable to find recipe"};
  }

  let recipesList = allRecipes.map(recipes => {
    if (recipes.ingredients) {
      return [recipes.ingredients.map(ingredient=>ingredient.id)];
    } else if (recipes.inShape) {
      return recipes.inShape.flatMap(itemList=>itemList.filter(item=>item.id!==-1).map(item => item.id));
    }
  });

  if (!recipesList || recipesList.length < 1) {
    return {"item": itemNameToCraft, "error": "Unable to parse recipe."};
  }
  
  let firstRecipe = recipesList[0];
  res.materials.push(...firstRecipe.map(recipeItemId => mc.getAllItems().filter(item => recipeItemId === item.id).map(i => i.name)));

  return res;
}

export function getCraftableItems(bot) {
    /**
     * Get a list of all items that can be crafted with the bot's current inventory.
     * @param {Bot} bot - The bot to get the craftable items for.
     * @returns {string[]} - A list of all items that can be crafted.
     * @example
     * let craftableItems = world.getCraftableItems(bot);
     **/
    let table = getNearestBlock(bot, 'crafting_table');
    if (!table) {
        for (const item of bot.inventory.items()) {
            if (item != null && item.name === 'crafting_table') {
                table = item;
                break;
            }
        }
    }
    let res = [];
    for (const item of mc.getAllItems()) {
        let recipes = bot.recipesFor(item.id, null, 1, table);
        if (recipes.length > 0)
            res.push(item.name);
    }
    return res;
}


export function getPosition(bot) {
    /**
     * Get your position in the world (Note that y is vertical).
     * @param {Bot} bot - The bot to get the position for.
     * @returns {Vec3} - An object with x, y, and x attributes representing the position of the bot.
     * @example
     * let position = world.getPosition(bot);
     * let x = position.x;
     **/
    return bot.entity.position;
}


export function getNearbyEntityTypes(bot) {
    /**
     * Get a list of all nearby mob types.
     * @param {Bot} bot - The bot to get nearby mobs for.
     * @returns {string[]} - A list of all nearby mobs.
     * @example
     * let mobs = world.getNearbyEntityTypes(bot);
     **/
    let mobs = getNearbyEntities(bot, 16);
    let found = [];
    for (let i = 0; i < mobs.length; i++) {
        if (!found.includes(mobs[i].name)) {
            found.push(mobs[i].name);
        }
    }
    return found;
}


export function getNearbyPlayerNames(bot) {
    /**
     * Get a list of all nearby player names.
     * @param {Bot} bot - The bot to get nearby players for.
     * @returns {string[]} - A list of all nearby players.
     * @example
     * let players = world.getNearbyPlayerNames(bot);
     **/
    let players = getNearbyPlayers(bot, 64);
    let found = [];
    for (let i = 0; i < players.length; i++) {
        if (!found.includes(players[i].username) && players[i].username != bot.username) {
            found.push(players[i].username);
        }
    }
    return found;
}

export function getNearbyBlockDetails(bot, block_types=null, distance=16, max_per_type=2) {
    /**
     * Get a list of nearby blocks and their details such as location and metadata.
     * @param {Bot} bot - The bot to get nearby blocks for.
     * @param {number} distance - The maximum distance to search, default 16.
     * @param {number} max_per_type - The maximum number of blocks per type, default 2.
     * @returns {string[]} - A list of all nearby blocks.
     * @example
     * let blocks = world.getNearbyBlockTypes(bot);
     **/
    const blockCounts = new Map();
    const result = getNearestBlocks(bot, block_types, distance).filter(block => {
      const blockKey = getBlockKey(bot, block);
      const count = blockCounts.get(blockKey) || 0;
      blockCounts.set(blockKey, count + 1);
      return count < max_per_type;
    }).map(block => 
      `${block.name} at [${block.position.x}, ${block.position.y}, ${block.position.z}] ${getBlockMetadataString(bot, block)}`
    );
    return result;
}

export async function isClearPath(bot, target) {
    /**
     * Check if there is a path to the target that requires no digging or placing blocks.
     * @param {Bot} bot - The bot to get the path for.
     * @param {Entity} target - The target to path to.
     * @returns {boolean} - True if there is a clear path, false otherwise.
     */
    let movements = new pf.Movements(bot)
    movements.canDig = false;
    movements.canPlaceOn = false;
    let goal = new pf.goals.GoalNear(target.position.x, target.position.y, target.position.z, 1);
    let path = await bot.pathfinder.getPathTo(movements, goal, 100);
    return path.status === 'success';
}

export function shouldPlaceTorch(bot) {
    if (!bot.modes.isOn('torch_placing') || bot.interrupt_code) return false;
    const pos = getPosition(bot);
    // TODO: check light level instead of nearby torches, block.light is broken
    let nearest_torch = getNearestBlock(bot, 'torch', 6);
    if (!nearest_torch)
        nearest_torch = getNearestBlock(bot, 'wall_torch', 6);
    if (!nearest_torch) {
        const block = bot.blockAt(pos);
        let has_torch = bot.inventory.items().find(item => item.name === 'torch');
        return has_torch && block?.name === 'air';
    }
    return false;
}

export function getBiomeName(bot) {
    /**
     * Get the name of the biome the bot is in.
     * @param {Bot} bot - The bot to get the biome for.
     * @returns {string} - The name of the biome.
     * @example
     * let biome = world.getBiomeName(bot);
     **/
    const biomeId = bot.world.getBiome(bot.entity.position);
    return mc.getAllBiomes()[biomeId].name;
}

export function getBlockKey(bot, block) {
      /**
     * Create a deterministic key for a given block, considering specific block metadata 
     * and the block above. The key is generated based on the following rules:
     * 1. If the block above is a harvestable crop, the key is a combination of the current block's name and the block above's name.
     * 2. If the current block is a sign with text, the key includes the block's name and the first 8 characters of each line of the sign's text.
     * 3. Otherwise, the key is simply the current block's name.
     * @param {Bot} bot - The bot making the call.
     * @param {Block} block - The block used to determine the key.
     * @returns {String} - string representing a deterministic key for the given block
     */
    let above = bot.blockAt(block.position.offset(0,1,0));
    if (isHarvestableCrop(above)) {
        return `${block.name}|${above.name}`;
    } 
    if (block?.name.includes("_sign") && block.getSignText()) {
        return `${block.name}|${block.getSignText()[0].substring(0,8)}|${block.getSignText()[1].substring(0,8)}`;
    }
    return block?.name;
}

let crops = ["wheat", "beetroot", "potatoes", "carrots"]

function getBlockMetadataString(bot, block) {
    if (!block) {
        return "";
    } else if (block.name === "farmland") {
        let above = bot.blockAt(block.position.offset(0,1,0));
        return(`Is ${block.metadata > 4 ? "" : "NOT "}watered. ${getCropDetails(above)}`)
    } else if (crops.includes(block?.name)) {
        return(`Is ${isHarvestableCrop(block) ? "" : "NOT "}ready for harvest.`)
    } else if (block.name.includes("_sign")) {
        let frontText = block.getSignText()[0].replaceAll('\n', '|');
        let backText = block.getSignText()[1].replaceAll('\n', '|');
        return `Front: {${frontText}} Back: {${backText}}`;
    }
    return "";
}

function getCropDetails(block) {
    if (crops.includes(block?.name)) {
        return `Has ${isHarvestableCrop(block) ? "harvestable" : "seedling"} ${block.name}.`;
    } else {
        return `Ready for seeds.`;
    }
}

function isHarvestableCrop(block) {
    if (!block || !block.metadata) {
        return false;
    }
    if (!crops.includes(block.name)) {
        return false;
    }
    return block.name === "beetroot" ? block.metadata === 3 : block.metadata === 7;
}