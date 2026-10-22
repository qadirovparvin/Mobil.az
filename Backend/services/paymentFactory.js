const paymentConfig = require('../config/payment');

const getProvider = () => {
    const { provider } = paymentConfig.getConfig();
    if (provider === 'payriff') {
        return require('./payriffProvider');
    }
    return require('./mockProvider');
};

module.exports = { getProvider };
