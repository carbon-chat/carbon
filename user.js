const Banner = require('./banner.js');

class User {
    /**
     * Constructor function for creating a new instance of the class.
     *
     * @param {string} username - The username for the user.
     * @param {string} passwordHash - The hashed password for the user.
     * @param {string} uuid - The UUID for the user.
     * @returns {User}
     */
    constructor(username, passwordHash, uuid) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.uuid = uuid;
        this.icon = null;
        this.followers = [];
        this.banners = [
            new Banner('Default Banner', 'common')
        ];
        this.suspensionLevel = 0;
        this.isAdmin = false;
    }

    /**
     * Adds an icon to a user.
     *
     * @param {string} icon - The icon to be added.
     * @returns {void}
     */
    addIcon(icon) {
        this.icon = icon;
    }

    /**
     * Adds a follower to the user's list of followers.
     *
     * @param {User} follower - The user who is followng the user.
     * @returns {void}
     */
    addFollower(follower) {
        this.followers.push(follower);

        if (this.followers.length == 1) {
            this.banners.push(new Banner('First Follower', 'common'));
        } else if (this.followers.length == 100) {
            this.banners.push(new Banner('100 Followers', 'rare'));
        } else if (this.followers.length == 1000) {
            this.banners.push(new Banner('1000 Followers', 'epic'));
        } else if (this.followers.length == 10000) {
            this.banners.push(new Banner('10,000 Followers', 'legendary'));
        } else if (this.followers.length == 100000) {
            this.banners.push(new Banner('100,000 Followers', 'mythic'));
        } else if (this.followers.length == 1000000) {
            this.banners.push(new Banner('1,000,000 Followers', 'diamond'));
        }
    }

    /**
     * Removes a follower from the user's list of followers.
     *
     * @param {User} follower - The user who is no longer followng the user.
     * @returns {void}
     */
    removeFollower(follower) {
        this.followers = this.followers.filter(f => f.uuid !== follower.uuid);
    }

    sendBanner(user, bannerId) {
        // Find the banner in the user's list of banners
        const banner = user.banners.find(b => b.bannerId === bannerId);

        // Remove the banner from the user's list of banners
        user.banners = user.banners.filter(b => b.bannerId !== bannerId);

        // Send the banner to the user
        this.banners.push(banner);
    }

    /**
     * Sets the suspension level of the user.
     * 
     * 0 - no suspension
     * 1 - warning 1
     * 2 - warning 2
     * 3 - partial suspension
     * 4 - suspended
     * 5 - permanently suspended
     *
     * @param {number} level - The new suspension level.
     * @returns {void}
     */
    setSuspensionLevel(level) {
        this.suspensionLevel = level;
    }

    /**
     * Converts the object to a JSON representation.
     *
     * @return {Object} The JSON representation of the object.
     */
    toJSON() {
        return {
            username: this.username,
            uuid: this.uuid,
            passwordHash: this.passwordHash,
            icon: this.icon,
            followers: this.followers,
            banners: this.banners
        };
    }

    /**
     * Create a new User instance from a JSON object.
     *
     * @param {object} json - The JSON object representing a user.
     * @return {User} - The created User instance.
     */
    static fromJSON(json) {
        let user = new User(json.username, json.passwordHash);
        user.uuid = json.uuid;
        user.addIcon(json.icon);
        user.followers = json.followers;
        user.banners = json.banners;
        return user;
    }
}

module.exports = User;
