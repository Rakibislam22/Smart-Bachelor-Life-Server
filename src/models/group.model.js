const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			trim: true,
			default: "",
			required: [true, "title is required for creating a group"],
		},
		address: {
			type: String,
			trim: true,
			default: "",
		},
		managerID: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "user",
			required: [true, "managerID is required for creating a group"],
			unique: [true, "A user can only manage one group"],
			index: true,
		},
		userIDs: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: "user",
			default: [],
			// select: false,
		},
		joinCode: {
			type: String,
			trim: true,
			default: "",
			required: [true, "joinCode is required for creating a group"],
			unique: [true, "joinCode must be unique"],
		},
		invitedEmails: {
			type: [String],
			default: [],
			select: false, // Hide invitedEmails from query results by default
		},
		paymentNotice: {
			type: String,
			trim: true,
			default: "",
		},
	},
	{
		timestamps: true,
	},
);

const groupModel = mongoose.model("group", groupSchema);

module.exports = groupModel;
