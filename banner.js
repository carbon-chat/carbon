const createFullBanner = require('./utils').createFullBanner;

class Banner {
    /**
     * Creates a new instance of the class.
     * 
     * @param {string} caption - The caption of the banner.
     * @param {string} rarity - The rarity of the banner.
     * @param {string} bannerId - The ID of the banner.
     * @returns {Banner}
     */
    constructor(caption, rarity, bannerId) {
        this.caption = caption;
        this.rarity = rarity;
        this.bannerId = bannerId;
        this.image = createFullBanner();
    }
}

module.exports = Banner;
