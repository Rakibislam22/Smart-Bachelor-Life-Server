const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

exports.registerToken = async (req, res) => {
    const logCtx = getLogContext(req);
    const { token } = req.body || {};

    logger.info("Register FCM token attempt", {
        ...logCtx,
        hasToken: Boolean(token),
    });

    try {
        if (!token || typeof token !== "string" || !token.trim()) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
        }

        const normalizedToken = token.trim();
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!Array.isArray(user.fcmTokens)) {
            user.fcmTokens = [];
        }

        if (!user.fcmTokens.includes(normalizedToken)) {
            user.fcmTokens.push(normalizedToken);
            await user.save();
        }

        logger.info("Register FCM token success", {
            ...logCtx,
            userId: user._id,
        });

        return res.status(200).json({
            success: true,
            message: "FCM token registered successfully",
        });
    } catch (error) {
        logger.error("Register FCM token failed", {
            ...logCtx,
            error: getErrorMeta(error),
        });

        return res.status(500).json({
            success: false,
            message: "An error occurred while registering the token",
        });
    }
};

exports.removeToken = async (req, res) => {
    const logCtx = getLogContext(req);
    const { token } = req.body || {};

    logger.info("Remove FCM token attempt", {
        ...logCtx,
        hasToken: Boolean(token),
    });

    try {
        if (!token || typeof token !== "string" || !token.trim()) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const normalizedToken = token.trim();
        user.fcmTokens = Array.isArray(user.fcmTokens)
            ? user.fcmTokens.filter((existingToken) => existingToken !== normalizedToken)
            : [];
        await user.save();

        logger.info("Remove FCM token success", {
            ...logCtx,
            userId: user._id,
        });

        return res.status(200).json({
            success: true,
            message: "FCM token removed successfully",
        });
    } catch (error) {
        logger.error("Remove FCM token failed", {
            ...logCtx,
            error: getErrorMeta(error),
        });

        return res.status(500).json({
            success: false,
            message: "An error occurred while removing the token",
        });
    }
};
