const firebaseAdmin = require("firebase-admin");

const envConfig = require("./env.config");

const { logger } = require("../utils/logger.util");

// Initialize Firebase Admin SDK
try {
	firebaseAdmin.initializeApp({
		credential: firebaseAdmin.credential.cert({
			projectId: envConfig.FIREBASE_PROJECT_ID,
			clientEmail: envConfig.FIREBASE_CLIENT_EMAIL,
			privateKey: envConfig.FIREBASE_PRIVATE_KEY,
		}),
		databaseURL: envConfig.FIREBASE_DATABASE_URL,
	});
	logger.info("✔️  Firebase Admin SDK initialized successfully");
} catch (err) {
	logger.error("Error initializing Firebase Admin SDK:", err.message);
	process.exit(1);
}

module.exports = firebaseAdmin;
