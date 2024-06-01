module.exports = {
    /**
     * Generates a random string of the specified length.
     *
     * @param {number} length - The length of the random string to generate.
     * @return {string} The randomly generated string.
     */
    generateRandom: (length) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    /**
     * Generates a unique string of the specified length that is not present in the given array.
     *
     * @param {number} length - The length of the generated string.
     * @param {Array} arr - The array containing strings to check for uniqueness.
     * @return {string} The generated unique string.
     */
    generateUnique: (length, arr) => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        do {
            result = '';
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
        } while (arr.includes(result));
        return result;
    },
    /**
     * Creates a timestamp object with the current time in milliseconds and a formatted date string.
     *
     * @return {Object} An object containing the current time in milliseconds and a formatted date string.
     */
    createTimestamp: () => {
        const now = new Date();
        const millis = now.getTime();
        const date = now.toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        return {
            millis,
            date
        };
    },
    
    /**
     * Creates a full banner object.
     *
     * @return {Object} An object containing the full banner.
     */
    createFullBanner: () => {
        const createBannerQuarter = () => {
            let pattern = [
                [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
                [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
                [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
                [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
                [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
                [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
            ];

            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 25; j++) {
                    pattern[i][j] = Math.random() < 0.5;
                }
            }

            return pattern;
        };

        const bannerQuarter = createBannerQuarter();

        const fullBanner = [];
        for (let i = 0; i < 12; i++) {
            fullBanner[i] = [];
            for (let j = 0; j < 50; j++) {
                if (i <= 6 && j <= 25) {
                    fullBanner[i][j] = bannerQuarter[i%6][j%25];
                } else if (i > 6 && j <= 25) {
                    fullBanner[i][j] = !bannerQuarter[i - 6][j%25];
                } else if (i <= 6 && j > 25) {
                    fullBanner[i][j] = !bannerQuarter[i%6][j - 25];
                } else {
                    fullBanner[i][j] = bannerQuarter[i - 6][j - 25];
                }
            }
        }

        return fullBanner;
    }
};
