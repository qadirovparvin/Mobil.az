const ACTIVE_ACCOUNT_STATUSES = new Set(['active']);
const BLOCKED_ACCOUNT_STATUSES = new Set(['frozen', 'deleted', 'blocked', 'banned', 'inactive', 'disabled']);

const isAccountAllowed = (user) => {
    if (!user) return false;
    return ACTIVE_ACCOUNT_STATUSES.has(user.status) && !user.disabled && !user.isBlocked && !user.isBanned;
};

const getAccountDeniedMessage = (user) => {
    if (!user) return 'Account is not active';
    if (BLOCKED_ACCOUNT_STATUSES.has(user.status) || user.disabled || user.isBlocked || user.isBanned) {
        return 'Account is blocked or inactive';
    }
    return 'Account is not active';
};

module.exports = {
    isAccountAllowed,
    getAccountDeniedMessage
};
