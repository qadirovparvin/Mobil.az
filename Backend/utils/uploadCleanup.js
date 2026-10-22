const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const uploadsRoot = path.resolve(__dirname, '../uploads');
const privateRoot = path.resolve(__dirname, '../private_uploads');

const resolveUploadPath = (fileUrl) => {
    if (!fileUrl || typeof fileUrl !== 'string') return null;

    let pathname = fileUrl.trim();
    if (!pathname) return null;

    try {
        if (/^https?:\/\//i.test(pathname)) {
            pathname = new URL(pathname).pathname;
        }
    } catch {
        return null;
    }

    if (!pathname.startsWith('/uploads/')) return null;

    const relativePath = pathname.replace(/^\/uploads\//, '');
    const absolutePath = path.resolve(uploadsRoot, relativePath);
    if (absolutePath !== uploadsRoot && absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) {
        return absolutePath;
    }

    logger.warn(`Skipped unsafe upload path: ${fileUrl}`);
    return null;
};

const deleteUploadFiles = async (fileUrls = []) => {
    const uniquePaths = [...new Set(fileUrls.map(resolveUploadPath).filter(Boolean))];

    const results = await Promise.all(uniquePaths.map(async (filePath) => {
        try {
            await fs.promises.unlink(filePath);
            return { filePath, deleted: true };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { filePath, deleted: false, missing: true };
            }
            logger.warn(`Failed to delete upload ${filePath}: ${error.message}`);
            return { filePath, deleted: false, error: error.message };
        }
    }));

    return {
        attempted: uniquePaths.length,
        deleted: results.filter((result) => result.deleted).length,
        missing: results.filter((result) => result.missing).length,
        errors: results.filter((result) => result.error)
    };
};

const cleanupOrphanedUploads = async (thresholdHours = 24) => {
    if (process.env.CLEANUP_ORPHANS === 'false') {
        logger.info('cleanupOrphanedUploads: Skipped because CLEANUP_ORPHANS is set to false');
        return;
    }
    const mongoose = require('mongoose');
    let Ad, Store, User;
    try {
        Ad = mongoose.model('Ad');
        Store = mongoose.model('Store');
        User = mongoose.model('User');
    } catch (e) {
        logger.error(`cleanupOrphanedUploads: Models not loaded yet`);
        return;
    }
    
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const now = Date.now();

    const oldUploads = new Set();
    const oldPrivate = new Set();

    const walkDir = async (dir, set) => {
        if (!fs.existsSync(dir)) return;
        const items = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.name === '.gitkeep') continue;
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                await walkDir(fullPath, set);
            } else if (item.isFile()) {
                const stats = await fs.promises.stat(fullPath).catch(() => null);
                if (stats && (now - stats.mtimeMs > thresholdMs)) {
                    set.add(fullPath);
                }
            }
        }
    };

    await walkDir(uploadsRoot, oldUploads);
    await walkDir(privateRoot, oldPrivate);

    if (oldUploads.size === 0 && oldPrivate.size === 0) return;

    if (oldUploads.size > 0) {
        const adCursor = Ad.find({}, 'images').lean().cursor();
        for await (const ad of adCursor) {
            if (oldUploads.size === 0) break;
            if (Array.isArray(ad.images)) {
                for (const img of ad.images) {
                    if (typeof img === 'string') {
                        const absPath = resolveUploadPath(img);
                        if (absPath) oldUploads.delete(absPath);
                        oldUploads.delete(path.join(uploadsRoot, path.basename(img)));
                    }
                }
            }
        }
    }

    if (oldUploads.size > 0) {
        const userCursor = User.find({ avatar: { $ne: null } }, 'avatar').lean().cursor();
        for await (const user of userCursor) {
            if (oldUploads.size === 0) break;
            if (typeof user.avatar === 'string') {
                const absPath = resolveUploadPath(user.avatar);
                if (absPath) oldUploads.delete(absPath);
                oldUploads.delete(path.join(uploadsRoot, path.basename(user.avatar)));
            }
        }
    }

    if (oldUploads.size > 0 || oldPrivate.size > 0) {
        const storeCursor = Store.find({}, 'logoUrl coverUrl kycDocuments').lean().cursor();
        for await (const store of storeCursor) {
            if (oldUploads.size === 0 && oldPrivate.size === 0) break;
            
            if (typeof store.logoUrl === 'string') {
                const absPath = resolveUploadPath(store.logoUrl);
                if (absPath) oldUploads.delete(absPath);
                oldUploads.delete(path.join(uploadsRoot, path.basename(store.logoUrl)));
            }
            if (typeof store.coverUrl === 'string') {
                const absPath = resolveUploadPath(store.coverUrl);
                if (absPath) oldUploads.delete(absPath);
                oldUploads.delete(path.join(uploadsRoot, path.basename(store.coverUrl)));
            }
            
            if (store.kycDocuments) {
                if (store.kycDocuments.taxDocument?.storageKey) {
                    oldPrivate.delete(path.join(privateRoot, store.kycDocuments.taxDocument.storageKey));
                }
                if (store.kycDocuments.identityDocument?.storageKey) {
                    oldPrivate.delete(path.join(privateRoot, store.kycDocuments.identityDocument.storageKey));
                }
            }
        }
    }

    let deletedCount = 0;
    for (const fullPath of oldUploads) {
        try {
            await fs.promises.unlink(fullPath);
            logger.info(`Orphan cleanup: deleted ${path.relative(uploadsRoot, fullPath)} from uploads/`);
            deletedCount++;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.warn(`Orphan cleanup: failed to delete ${path.relative(uploadsRoot, fullPath)} from uploads/ - ${error.message}`);
            }
        }
    }

    for (const fullPath of oldPrivate) {
        try {
            await fs.promises.unlink(fullPath);
            logger.info(`Orphan cleanup: deleted ${path.relative(privateRoot, fullPath)} from private_uploads/`);
            deletedCount++;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.warn(`Orphan cleanup: failed to delete ${path.relative(privateRoot, fullPath)} from private_uploads/ - ${error.message}`);
            }
        }
    }

    if (deletedCount > 0) {
        logger.info(`Orphan cleanup completed: removed ${deletedCount} files.`);
    }
};

module.exports = {
    deleteUploadFiles,
    resolveUploadPath,
    cleanupOrphanedUploads
};
