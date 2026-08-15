const mongoose = require("mongoose");

// Firebase Admin handles authentication; this model stores app-level user data.
const userSchema = new mongoose.Schema(
	{
		firebaseUid: {
			type: String,
			required: [true, "firebaseUid is required for creating a user"],
			unique: [
				true,
				"firebaseUid already exists, please use a different firebaseUid",
			],
			index: true,
			trim: true,
		},
		email: {
			type: String,
			required: [true, "email is required for creating a user"],
			unique: [
				true,
				"Email already exists, please use a different email",
			],
			index: true,
			trim: true,
			lowercase: true,
			match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
		},
		displayName: {
			type: String,
			trim: true,
			default: "",
		},
		photoURL: {
			type: String,
			trim: true,
			default: "",
		},
		role: {
			type: String,
			enum: {
				values: ["MANAGER", "USER"],
				message: "Role must be either 'MANAGER' or 'USER'",
			},
			select: false,
			default: "USER",
		},
		roleSelectionCompleted: {
			type: Boolean,
			select: false,
			default: false,
		},
		canBePromoted: {
			type: Boolean,
			select: false,
			default: true,
		},
		provider: {
			type: String,
			trim: true,
			select: false,
			default: "PASSWORD",
		},
		emailVerified: {
			type: Boolean,
			default: false,
		},
		lastLoginAt: {
			type: Date,
			default: null,
		},
		fcmTokens: {
			type: [String],
			default: [],
			validate: {
				validator: function (tokens) {
					return Array.isArray(tokens)
						? tokens.every((token) => typeof token === "string" && token.trim().length > 0)
						: true;
				},
				message: "FCM tokens must be strings",
			},
		},
	},
	{
		timestamps: true,
	},
);

userSchema.index({ firebaseUid: 1, email: 1 });

userSchema.pre("save", function () {
	if (Array.isArray(this.fcmTokens)) {
		this.fcmTokens = [...new Set(
			this.fcmTokens
				.filter((token) => typeof token === "string")
				.map((token) => token.trim())
				.filter(Boolean),
		)];
	}
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
