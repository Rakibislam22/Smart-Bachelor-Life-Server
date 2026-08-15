const firebaseAdmin = require("../config/firebase.config");
const User = require("../models/user.model");
const { logger, getErrorMeta } = require("../utils/logger.util");
const { sendPushToGroup, sendPushToTokens } = require("./notification.service");

let previousWarningActive = false;
let listenerStarted = false;

function startWarningListener() {
    if (listenerStarted) {
        return;
    }

    listenerStarted = true;

    try {
        firebaseAdmin.database().ref("/warning").on("value", async (snapshot) => {
            try {
                const warning = snapshot.val() || {};
                const isActive = Boolean(warning?.active);
                const message = warning?.message || "Emergency warning reported.";
                const groupId = warning?.groupId || warning?.groupID || null;

                if (!isActive && previousWarningActive) {
                    previousWarningActive = false;
                    return;
                }

                if (isActive && !previousWarningActive) {
                    previousWarningActive = true;
                    if (groupId) {
                        await sendPushToGroup(groupId, {
                            title: "⚠️ Emergency Alert",
                            body: message,
                            data: { type: "emergency_warning", groupId: String(groupId) },
                        });
                    } else {
                        const allUsers = await User.find({}).select("fcmTokens");
                        const tokens = allUsers.flatMap((user) => user.fcmTokens || []);
                        await sendPushToTokens(tokens, {
                            title: "⚠️ Emergency Alert",
                            body: message,
                            data: { type: "emergency_warning" },
                        });
                    }
                }
            } catch (error) {
                logger.error("Warning listener push failed", {
                    error: getErrorMeta(error),
                });
            }
        });

        logger.info("RTDB warning listener started");
    } catch (error) {
        logger.error("Failed to start RTDB warning listener", {
            error: getErrorMeta(error),
        });
    }
}

module.exports = {
    startWarningListener,
};
