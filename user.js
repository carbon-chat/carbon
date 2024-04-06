class User {
    /**
     * Constructor function for creating a new instance of the class.
     *
     * @param {string} username - The username for the user.
     * @param {string} passwordHash - The hashed password for the user.
     */
    constructor(username, passwordHash, uuid) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.uuid = uuid;
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
            passwordHash: this.passwordHash
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
        return user;
    }
}

module.exports = User;