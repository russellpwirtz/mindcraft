import * as world from '../library/world.js';
import * as mc from '../../utils/mcdata.js';


export function getTypeOfGeneric(bot, block_name) {
    if (mc.MATCHING_WOOD_BLOCKS.includes(block_name)) {

        // Return most common wood type in inventory
        let type_count = {};
        let max_count = 0;
        let max_type = null;
        let inventory = world.getInventoryCounts(bot);
        for (const item in inventory) {
            for (const wood of mc.WOOD_TYPES) {
                if (item.includes(wood)) {
                    if (type_count[wood] === undefined)
                        type_count[wood] = 0;
                    type_count[wood] += inventory[item];
                    if (type_count[wood] > max_count) {
                        max_count = type_count[wood];
                        max_type = wood;
                    }
                }
            }
        }
        if (max_type !== null)
            return max_type + '_' + block_name;

        // Return nearest wood type
        let blocks = world.getNearbyBlocks(bot, 32);
        for (const block of blocks) {
            if (block.name.endsWith('log'))
                return block.name.split('_')[0] + '_' + block_name;
        }

        // Return oak
        return 'oak_' + block_name;
    }
    return block_name;
}


export function blockSatisfied(target_name, block) {
    if (target_name == 'dirt') {
        return block.name == 'dirt' || block.name == 'grass_block';
    } else if (mc.MATCHING_WOOD_BLOCKS.includes(target_name)) {
        return block.name.endsWith(target_name);
    }
    return block.name == target_name;
}


export function itemSatisfied(bot, item, quantity=1) {
    let qualifying = [item];
    if (item.includes('pickaxe') || 
            item.includes('axe') || 
            item.includes('shovel') ||
            item.includes('hoe') ||
            item.includes('sword')) {
        let material = item.split('_')[0];
        let type = item.split('_')[1];
        if (material === 'wooden') {
            qualifying.push('stone_' + type);
            qualifying.push('iron_' + type);
            qualifying.push('gold_' + type);
            qualifying.push('diamond_' + type);
        } else if (material === 'stone') {
            qualifying.push('iron_' + type);
            qualifying.push('gold_' + type);
            qualifying.push('diamond_' + type);
        } else if (material === 'iron') {
            qualifying.push('gold_' + type);
            qualifying.push('diamond_' + type);
        } else if (material === 'gold') {
            qualifying.push('diamond_' + type);
        }
    }
    for (let item of qualifying) {
        if (world.getInventoryCounts(bot)[item] >= quantity) {
            return true;
        }
    }
    return false;
}
