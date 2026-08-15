const Menu = require("../models/menu.model");
const User = require("../models/user.model");
const groupModel = require("../models/group.model");
const {
	getMealSummaryForGroup,
	syncMealToFirebase,
} = require("../services/rtdbMealSync.service");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

async function syncDeviceMealForGroup(groupId) {
	if (!groupId || !process.env.DEVICE_GROUP_ID) {
		return;
	}

	if (String(groupId) !== String(process.env.DEVICE_GROUP_ID)) {
		return;
	}

	try {
		const summary = await getMealSummaryForGroup(groupId);
		await syncMealToFirebase(summary);
	} catch (error) {
		logger.error("Menu-triggered meal RTDB sync failed", {
			error: getErrorMeta(error),
			groupId,
		});
	}
}

//  CREATE MENU
exports.createMenu = async (req, res) => {
	const logCtx = getLogContext(req);
	const { groupID, date, breakfast, lunch, dinner } = req.body;

	logger.info("Create menu attempt", {
		...logCtx,
		groupID,
		date,
	});

	try {
		const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		if (!groupID) {
			return res.status(400).json({
				success: false,
				message: "groupID is required",
			});
		}

		const group = await groupModel.findOne({
			_id: groupID,
			managerID: req.user._id,
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message:
					"You are not authorized to create a menu for this group",
			});
		}

		const menu = await Menu.create({
			userID: user._id,
			groupID: group._id,
			date: date || new Date(),
			breakfast,
			lunch,
			dinner,
		});

		// Keep RTDB writes scoped to the single ESP32 apartment group only.
		void syncDeviceMealForGroup(group._id);

		logger.info("Menu created", {
			...logCtx,
			menuId: menu._id,
			userId: user._id,
		});

		return res.status(201).json({
			success: true,
			message: "Menu created successfully",
			data: menu,
		});
	} catch (error) {
		logger.error("Error creating menu", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while creating the menu",
		});
	}
};

//  GET MENUS
exports.getMenus = async (req, res) => {
	const logCtx = getLogContext(req);

	logger.info("Get menus attempt", {
		...logCtx,
		query: req.query,
	});

	try {
		if (!req.query.groupID) {
			return res.status(400).json({
				success: false,
				message: "groupID query is required",
			});
		}

		const group = await groupModel.findOne({
			_id: req.query.groupID,
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to view menus for this group",
			});
		}

		const menus = await Menu.find({
			groupID: group._id,
		}).populate("userID", "displayName email");

		logger.info("Menus fetched", { ...logCtx, count: menus.length });

		return res.status(200).json({
			success: true,
			message: "Menus fetched successfully",
			data: menus,
		});
	} catch (error) {
		logger.error("Error fetching menus", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while fetching menus",
		});
	}
};

//  UPDATE MENU
exports.updateMenu = async (req, res) => {
	const logCtx = getLogContext(req);
	const { breakfast, lunch, dinner, date } = req.body;

	logger.info("Update menu attempt", {
		...logCtx,
		menuId: req.params.id,
		updates: req.body,
	});

	try {
		if (
			breakfast === undefined &&
			lunch === undefined &&
			dinner === undefined &&
			date === undefined
		) {
			return res.status(400).json({
				success: false,
				message:
					"At least one of breakfast, lunch, dinner, or date must be provided for update",
			});
		}

		const menu = await Menu.findById(req.params.id);

		if (!menu) {
			return res.status(404).json({
				success: false,
				message: "Menu not found",
			});
		}

		const group = await groupModel.findOne({
			_id: menu.groupID,
			managerID: req.user._id,
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to update this menu",
			});
		}

		const updates = {};
		if (breakfast !== undefined) {
			updates.breakfast = breakfast;
		}
		if (lunch !== undefined) {
			updates.lunch = lunch;
		}
		if (dinner !== undefined) {
			updates.dinner = dinner;
		}
		if (date !== undefined) {
			updates.date = date;
		}

		const updatedMenu = await Menu.findByIdAndUpdate(
			req.params.id,
			updates,
			{
				new: true,
			},
		);

		// Keep RTDB writes scoped to the single ESP32 apartment group only.
		void syncDeviceMealForGroup(menu.groupID);

		logger.info("Menu updated", { ...logCtx, menuId: updatedMenu._id });

		return res.status(200).json({
			success: true,
			message: "Menu updated successfully",
			data: updatedMenu,
		});
	} catch (error) {
		logger.error("Error updating menu", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while updating the menu",
		});
	}
};

//  DELETE MENU
exports.deleteMenu = async (req, res) => {
	const logCtx = getLogContext(req);

	logger.info("Delete menu attempt", {
		...logCtx,
		menuId: req.params.id,
	});

	try {
		const menu = await Menu.findById(req.params.id);

		if (!menu) {
			return res.status(404).json({
				success: false,
				message: "Menu not found",
			});
		}

		const group = await groupModel.findOne({
			_id: menu.groupID,
			managerID: req.user._id,
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to delete this menu",
			});
		}

		await Menu.findByIdAndDelete(req.params.id);

		// Keep RTDB writes scoped to the single ESP32 apartment group only.
		void syncDeviceMealForGroup(menu.groupID);

		logger.info("Menu deleted", { ...logCtx, menuId: menu._id });

		return res.status(200).json({
			success: true,
			message: "Menu deleted successfully",
		});
	} catch (error) {
		logger.error("Error deleting menu", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while deleting the menu",
		});
	}
};
