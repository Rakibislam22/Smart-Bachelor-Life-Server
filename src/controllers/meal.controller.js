const Meal = require("../models/meal.model");
const User = require("../models/user.model");
const groupModel = require("../models/group.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

//  CREATE MEAL
exports.createMeal = async (req, res) => {
	const logCtx = getLogContext(req);
	const { groupID, mealCount, date } = req.body;

	logger.info("Create meal attempt", {
		...logCtx,
		groupID,
		date,
		mealCount,
	});

	try {
		const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		//  VALIDATION
		if (!groupID || mealCount === undefined) {
			return res.status(400).json({
				success: false,
				message: "groupID and mealCount are required",
			});
		}

		// Validate mealCount is an array with exactly 3 values
		if (!Array.isArray(mealCount)) {
			return res.status(400).json({
				success: false,
				message: "mealCount must be an array",
			});
		}

		if (mealCount.length !== 3) {
			return res.status(400).json({
				success: false,
				message: "mealCount must contain exactly 3 values",
			});
		}

		if (!mealCount.every((val) => typeof val === "number" && val >= 0)) {
			return res.status(400).json({
				success: false,
				message: "All mealCount values must be non-negative numbers",
			});
		}

		const group = await groupModel.findOne({
			_id: groupID,
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not a member of this group",
			});
		}

		const meal = await Meal.create({
			userID: user._id,
			groupID: group._id,
			date,
			mealCount,
		});

		res.status(201).json({ success: true, data: meal });
	} catch (error) {
		logger.error("Error creating meal", {
			...logCtx,
			error: getErrorMeta(error),
		});

		res.status(500).json({
			success: false,
			message: "An error occurred while creating the meal",
		});
	}
};

//  GET MEALS
exports.getMeals = async (req, res) => {
	const logCtx = getLogContext(req);
	const { groupID, date } = req.query;

	logger.info("Get meals attempt", {
		...logCtx,
		groupID,
		date,
	});

	try {
		//  VALIDATION
		if (!groupID) {
			return res.status(400).json({
				success: false,
				message: "groupID query is required",
			});
		}

		const group = await groupModel.findOne({
			_id: groupID,
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not a member of this group",
			});
		}

		const query = { groupID };

		//  Only filter date if user sends it
		if (date) {
			query.date = date;
		}

		const meals = await Meal.find(query).populate(
			"userID",
			"displayName email",
		);

		res.status(200).json({
			success: true,
			message: "Meals fetched successfully",
			data: meals,
		});
	} catch (error) {
		logger.error("Error fetching meals", {
			...logCtx,
			error: getErrorMeta(error),
		});

		res.status(500).json({
			success: false,
			message: "An error occurred while fetching meals",
		});
	}
};

//  UPDATE MEAL
exports.updateMeal = async (req, res) => {
	const logCtx = getLogContext(req);

	logger.info("Update meal attempt", {
		...logCtx,
		mealId: req.params.id,
		updates: req.body,
	});

	try {
		//  OPTIONAL VALIDATION
		if (req.body.mealCount !== undefined) {
			if (!Array.isArray(req.body.mealCount)) {
				return res.status(400).json({
					success: false,
					message: "mealCount must be an array",
				});
			}

			if (req.body.mealCount.length !== 3) {
				return res.status(400).json({
					success: false,
					message: "mealCount must contain exactly 3 values",
				});
			}

			if (
				!req.body.mealCount.every(
					(val) => typeof val === "number" && val >= 0,
				)
			) {
				return res.status(400).json({
					success: false,
					message:
						"All mealCount values must be non-negative numbers",
				});
			}
		}

		if (
			req.body.date !== undefined &&
			Number.isNaN(new Date(req.body.date).getTime())
		) {
			return res.status(400).json({
				success: false,
				message: "date must be a valid date",
			});
		}

		const meal = await Meal.findById(req.params.id);

		if (!meal) {
			return res.status(404).json({
				success: false,
				message: "Meal Not found",
			});
		}

		const group = await groupModel.findOne({
			_id: meal.groupID,
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to update this meal",
			});
		}

		const isManager = String(group.managerID) === String(req.user._id);
		const isOwner = String(meal.userID) === String(req.user._id);

		if (!isManager && !isOwner) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to update this meal",
			});
		}

		const updates = {};
		if (req.body.mealCount !== undefined) {
			updates.mealCount = Number(req.body.mealCount);
		}
		if (req.body.date !== undefined) {
			updates.date = req.body.date;
		}

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update",
			});
		}

		const updatedMeal = await Meal.findByIdAndUpdate(
			req.params.id,
			updates,
			{
				new: true,
			},
		);

		res.status(200).json({
			success: true,
			message: "Meal updated successfully",
			data: updatedMeal,
		});
	} catch (error) {
		logger.error("Error updating meal", {
			...logCtx,
			error: getErrorMeta(error),
		});

		res.status(500).json({
			success: false,
			message: "An error occurred while updating the meal",
		});
	}
};

//  DELETE MEAL
exports.deleteMeal = async (req, res) => {
	const logCtx = getLogContext(req);

	try {
		const meal = await Meal.findById(req.params.id);

		if (!meal) {
			return res
				.status(404)
				.json({ success: false, message: "Meal not found" });
		}

		const group = await groupModel.findOne({
			_id: meal.groupID,
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to delete this meal",
			});
		}

		const isManager = String(group.managerID) === String(req.user._id);
		const isOwner = String(meal.userID) === String(req.user._id);

		if (!isManager && !isOwner) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to delete this meal",
			});
		}

		await Meal.findByIdAndDelete(req.params.id);

		res.status(200).json({
			success: true,
			message: "Meal deleted successfully",
		});
	} catch (error) {
		logger.error("Error deleting meal", {
			...logCtx,
			error: getErrorMeta(error),
		});

		res.status(500).json({
			success: false,
			message: "An error occurred while deleting the meal",
		});
	}
};
