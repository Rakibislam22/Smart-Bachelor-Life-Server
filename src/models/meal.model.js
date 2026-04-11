const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
	{
		groupID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "group",
			required: [true, "groupID is required for creating a meal"],
		},
		userID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "user",
			required: [true, "userID is required for creating a meal"],
		},
		date: {
			type: Date,
			required: [true, "date is required for creating a meal"],
		},
		mealCount: {
			type: [Number],
			required: [true, "mealCount is required for creating a meal"],
			validate: {
				validator: function (v) {
					return (
						Array.isArray(v) &&
						v.length === 3 &&
						v.every((val) => typeof val === "number" && val >= 0)
					);
				},
				message:
					"mealCount must be an array of exactly 3 non-negative numbers",
			},
		},
	},
	{
		timestamps: true,
	},
);

const mealModel = mongoose.model("meal", mealSchema);

module.exports = mealModel;
