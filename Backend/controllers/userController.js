const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user profile/settings
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user personal info
// @route   PUT /api/user/profile
// @access  Private
const updatePersonalProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.lastName = req.body.lastName !== undefined ? req.body.lastName : user.lastName;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                phone: updatedUser.phone
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update security settings (Password, 2FA)
// @route   PUT /api/user/security
// @access  Private
const updateSecuritySettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update 2FA
        if (req.body.twoFactorEnabled !== undefined) {
            user.twoFactorEnabled = req.body.twoFactorEnabled;
        }

        // Update password if old and new are provided
        if (req.body.oldPassword && req.body.newPassword) {
            const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
            
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid current password' });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.newPassword, salt);
        }

        await user.save();
        res.json({ message: 'Security settings updated successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update privacy settings
// @route   PUT /api/user/privacy
// @access  Private
const updatePrivacySettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            user.privacySettings = {
                ...user.privacySettings,
                ...req.body
            };
            
            await user.save();
            res.json(user.privacySettings);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update notification settings
// @route   PUT /api/user/notifications
// @access  Private
const updateNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            user.notificationSettings = {
                ...user.notificationSettings,
                ...req.body
            };
            
            await user.save();
            res.json(user.notificationSettings);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Freeze account
// @route   POST /api/user/freeze
// @access  Private
const freezeAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            user.status = 'frozen';
            // Here you would also write logic to hide user's ads
            await user.save();
            res.json({ message: 'Account successfully frozen' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete account (Hard delete)
// @route   DELETE /api/user/delete
// @access  Private
const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            // Hard delete user from DB
            await User.findByIdAndDelete(req.user._id);
            // Optionally: Delete user's ads, messages, images from S3/GridFS
            res.json({ message: 'Account successfully deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getUserProfile,
    updatePersonalProfile,
    updateSecuritySettings,
    updatePrivacySettings,
    updateNotificationSettings,
    freezeAccount,
    deleteAccount
};
