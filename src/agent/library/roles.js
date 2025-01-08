import { readFileSync, readdirSync} from 'fs';

let roleMap;

function getFullRoleConfig() {
    if (!roleMap) {
        const rolesDir = './profiles/roles';
        const roleFiles = readdirSync(rolesDir).filter(file => file.endsWith('.json'));
        roleMap = roleFiles.reduce((acc, file) => {
            const roleName = file.replace('.json', '');
            const roleData = JSON.parse(readFileSync(`${rolesDir}/${file}`, 'utf8'));
            acc[roleName] = roleData;
            return acc;
        }, {});
    }

    return roleMap;
}

export function getRoleConfig(roleName) {
    /**
     * Return a map which represents all .json files in the roles directory, which maps the role name to its configuration
     * @param {Map} roleName, Name of the role, derived from the file name
     * @returns {Promise<Map>} Map of the role configuration values
     * @example
     * await roles.getRoleConfig("farmer");
     **/
    if (!getFullRoleConfig()[roleName]) {
        console.log(`Unable to get role config for ${roleName}, not found in full role config`);
        return null;
    }
    return getFullRoleConfig()[roleName];
}
