const firebaseAdmin = require("../config/firebase.config");
const { logger, getErrorMeta } = require("../utils/logger.util");
const { sendPushToGroup } = require("./notification.service");

let previousStatus = null;
let listenerStarted = false;

function startKitchenListener() {
    if (listenerStarted) {
        return;
    }

    listenerStarted = true;

    try {
        firebaseAdmin.database().ref("/kitchen").on("value", async (snapshot) => {
            try {
                const data = snapshot.val() || {};
                const status = String(data.status || "").toLowerCase();

                // Only notify on the transition INTO "done", not on every write.
                const justFinishedCooking =
                    status.includes("done") && !String(previousStatus || "").includes("done");

                previousStatus = status;

                if (!justFinishedCooking) {
                    return;
                }

                logger.info("Kitchen status changed to done, sending notification");

                await sendPushToGroup(process.env.DEVICE_GROUP_ID, {
                    title: "🍳 Cooking Done",
                    body: data.message || "Cooking is complete — food is ready!",
                    data: { type: "kitchen", status },
                });
            } catch (error) {
                logger.error("Kitchen listener push failed", {
                    error: getErrorMeta(error),
                });
            }
        });

        logger.info("RTDB kitchen listener started");
    } catch (error) {
        logger.error("Failed to start RTDB kitchen listener", {
            error: getErrorMeta(error),
        });
    }
}

module.exports = {
    startKitchenListener,
};
