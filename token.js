const { generateUnique } = require('./utils');

class Token {
    /**
     * Constructor for creating an instance of the class.
     *
     * @param {uuid} uuid - The UUID of the instance.
     * @param {array} authCodes - The array of authentication codes already issued.
     * @param {number} expiry - The expiry time in milliseconds. Default is 86400000.
     */
    constructor(uuid, authCodes, expiry = 86400000) {
        this.authCode = generateUnique(100, authCodes);
        this.expiresAt = Date.now() + expiry;
        this.uuid = uuid;
    }

    /**
     * Converts the object to a JSON representation.
     *
     * @return {Object} The JSON representation of the object.
     */
    toJSON() {
        return {
            authCode: this.authCode,
            expiresAt: this.expiresAt,
            uuid: this.uuid
        };
    }

    /**
     * Creates a Token object from a JSON representation.
     *
     * @param {object} json - The JSON object representing the Token.
     * @param {Array} authCodes - An array of auth codes.
     * @return {Token} The Token object created from the JSON representation.
     */
    static fromJSON(json, authCodes) {
        let token = new Token(json.uuid, authCodes);
        token.expiresAt = json.expiresAt;
        token.authCode = json.authCode;
        return token;
    }
}

module.exports = Token;