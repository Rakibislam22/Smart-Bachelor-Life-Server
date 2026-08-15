const firebaseAdmin = require("../config/firebase.config");
const User = require("../models/user.model");
const groupModel = require("../models/group.model");
const { logger, getErrorMeta } = require("../utils/logger.util");

async function removeInvalidToken(token) {
    if (!token || typeof token !== "string") return;

    try {
        const user = await User.findOne({ fcmTokens: token });
        if (!user) return;

        user.fcmTokens = (user.fcmTokens || []).filter((existingToken) => existingToken !== token);
        await user.save();
        logger.warn("Removed invalid FCM token from user", {
            userId: user._id,
            tokenPreview: token.slice(0, 20),
        });
    } catch (error) {
        logger.error("Failed to remove invalid FCM token", {
            error: getErrorMeta(error),
        });
    }
}

async function sendPushToTokens(tokens, { title, body, data = {} } = {}) {
    const normalizedTokens = Array.isArray(tokens)
        ? [...new Set(tokens.filter(Boolean).map((token) => String(token).trim()).filter(Boolean))]
        : [];

    if (!normalizedTokens.length) {
        return { successCount: 0, failureCount: 0, responses: [] };
    }

    try {
        const response = await firebaseAdmin.messaging().sendEachForMulticast({
            tokens: normalizedTokens,
            notification: {
                title: title || "Smart Bachelor Life",
                body: body || "You have a new notification.",
            },
            data: Object.fromEntries(
                Object.entries(data || {}).map(([key, value]) => [key, String(value ?? "")]),
            ),
        });

        logger.info("FCM multicast sent", {
            successCount: response.successCount,
            failureCount: response.failureCount,
        });

        const invalidTokens = [];
        for (let index = 0; index < response.responses.length; index += 1) {
            const result = response.responses[index];
            const token = normalizedTokens[index];
            if (result?.error) {
                logger.warn("FCM token send failed", {
                    tokenPreview: token?.slice(0, 20),
                    error: result.error.message,
                    errorCode: result.error.code,
                });

                if (
                    result.error.code === "messaging/invalid-registration-token" ||
                    result.error.code === "messaging/registration-token-not-registered"
                ) {
                    invalidTokens.push(token);
                }
            }
        }

        await Promise.all(invalidTokens.map((token) => removeInvalidToken(token)));

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses,
        };
    } catch (error) {
        logger.error("FCM multicast failed", {
            error: getErrorMeta(error),
        });
        return { successCount: 0, failureCount: normalizedTokens.length, responses: [] };
    }
}

async function sendPushToGroup(groupId, { title, body, data } = {}) {
    if (!groupId) {
        return { successCount: 0, failureCount: 0, responses: [] };
    }

    try {
        const group = await groupModel.findById(groupId).select("userIDs managerID");
        if (!group) {
            return { successCount: 0, failureCount: 0, responses: [] };
        }

        const userIds = [...new Set([...(group.userIDs || []), group.managerID].filter(Boolean))];
        const users = await User.find({ _id: { $in: userIds } }).select("fcmTokens");
        const tokens = users.flatMap((user) => user.fcmTokens || []);

        return sendPushToTokens(tokens, { title, body, data });
    } catch (error) {
        logger.error("FCM group push failed", {
            groupId,
            error: getErrorMeta(error),
        });
        return { successCount: 0, failureCount: 0, responses: [] };
    }
}

module.exports = {
    sendPushToTokens,
    sendPushToGroup,
};
