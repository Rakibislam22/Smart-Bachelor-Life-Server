const firebaseAdmin = require("../config/firebase.config");
const Meal = require("../models/meal.model");
const Menu = require("../models/menu.model");
const { logger, getErrorMeta } = require("../utils/logger.util");

// The app's users and meal "date" values are conceptually in Bangladesh time
// (Asia/Dhaka, UTC+6, no DST). Date-only strings like "2026-08-16" sent from
// the frontend are parsed by JS as UTC midnight — which is 6:00 AM Dhaka time,
// not Dhaka midnight. So "today" has to be computed using the Dhaka offset,
// not raw UTC and not the server machine's local timezone.
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

function getTodayRange() {
    const now = new Date();

    // Shift "now" by +6h so its UTC-getters reveal Dhaka's current calendar date.
    const dhakaShifted = new Date(now.getTime() + DHAKA_OFFSET_MS);
    const dhakaYear = dhakaShifted.getUTCFullYear();
    const dhakaMonth = dhakaShifted.getUTCMonth();
    const dhakaDate = dhakaShifted.getUTCDate();

    // Dhaka midnight on that calendar date, expressed as a real UTC instant.
    const startOfDay = new Date(
        Date.UTC(dhakaYear, dhakaMonth, dhakaDate, 0, 0, 0, 0) - DHAKA_OFFSET_MS,
    );

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return { startOfDay, endOfDay };
}

async function getMealSummaryForGroup(groupId) {
    const { startOfDay, endOfDay } = getTodayRange();

    const [todayMeals, todayMenu] = await Promise.all([
        Meal.find({
            groupID: groupId,
            date: { $gte: startOfDay, $lt: endOfDay },
        }).select("mealCount date"),
        Menu.findOne({
            groupID: groupId,
            date: { $gte: startOfDay, $lt: endOfDay },
        })
            .sort({ updatedAt: -1, date: -1 })
            .lean(),
    ]);

    logger.info("Meal summary query window", {
        groupId: String(groupId),
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
        matchedMealDocs: todayMeals.length,
        matchedDates: todayMeals.map((m) => m.date?.toISOString?.() ?? m.date),
        menuFound: Boolean(todayMenu),
        menuDate: todayMenu?.date
            ? new Date(todayMenu.date).toISOString()
            : null,
        menuFields: todayMenu
            ? {
                breakfast: todayMenu.breakfast,
                lunch: todayMenu.lunch,
                dinner: todayMenu.dinner,
            }
            : null,
    });

    const totals = todayMeals.reduce(
        (acc, mealDoc) => {
            const mealCount = Array.isArray(mealDoc?.mealCount)
                ? mealDoc.mealCount
                : [0, 0, 0];

            acc.bfast_count += Number(mealCount[0] || 0);
            acc.lunch_count += Number(mealCount[1] || 0);
            acc.dinner_count += Number(mealCount[2] || 0);

            return acc;
        },
        { bfast_count: 0, lunch_count: 0, dinner_count: 0 },
    );

    return {
        bfast_count: totals.bfast_count,
        lunch_count: totals.lunch_count,
        dinner_count: totals.dinner_count,
        bfast_menu: todayMenu?.breakfast || "",
        lunch_menu: todayMenu?.lunch || "",
        dinner_menu: todayMenu?.dinner || "",
        updatedAt: firebaseAdmin.database.ServerValue.TIMESTAMP,
    };
}

async function syncMealToFirebase(mealSummary) {
    try {
        await firebaseAdmin.database().ref("/meal").set({
            bfast_count: mealSummary?.bfast_count ?? 0,
            lunch_count: mealSummary?.lunch_count ?? 0,
            dinner_count: mealSummary?.dinner_count ?? 0,
            bfast_menu: mealSummary?.bfast_menu ?? "",
            lunch_menu: mealSummary?.lunch_menu ?? "",
            dinner_menu: mealSummary?.dinner_menu ?? "",
            updatedAt: firebaseAdmin.database.ServerValue.TIMESTAMP,
        });
    } catch (error) {
        logger.error("Failed to sync meal summary to RTDB", {
            error: getErrorMeta(error),
        });
    }
}

module.exports = {
    getMealSummaryForGroup,
    syncMealToFirebase,
};
