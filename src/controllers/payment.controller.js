const paymentModel = require("../models/payment.model");
const groupModel = require("../models/group.model");
const { getRedisClient } = require("../config/redis.config");
const envConfig = require("../config/env.config");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

let stripeClient;

function getConfiguredClientOrigins() {
	return String(envConfig.CLIENT_URL || "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function getSafeClientBaseUrl(redirectBaseUrl) {
	const defaultClientUrl = "http://localhost:5173";
	const configuredClientOrigins = getConfiguredClientOrigins();
	const fallbackClientUrl = configuredClientOrigins[0] || defaultClientUrl;

	if (!redirectBaseUrl) {
		return fallbackClientUrl;
	}

	try {
		const parsed = new URL(redirectBaseUrl);
		const normalizedOrigin = parsed.origin;
		const isConfigured = configuredClientOrigins.includes(normalizedOrigin);
		const isLocalhost = /^https?:\/\/localhost(?::\d+)?$/i.test(
			normalizedOrigin,
		);

		if (isConfigured || isLocalhost) {
			return normalizedOrigin;
		}
	} catch (_) {
		// Ignore invalid URL and use fallback origin.
	}

	return fallbackClientUrl;
}

function getStripeClient() {
	if (stripeClient) {
		return stripeClient;
	}

	if (!envConfig.STRIPE_SECRET_KEY) {
		throw new Error("STRIPE_SECRET_KEY is not configured");
	}

	stripeClient = require("stripe")(envConfig.STRIPE_SECRET_KEY);
	return stripeClient;
}

async function clearPaymentCache(logCtx) {
	let redisClient;

	try {
		redisClient = getRedisClient();
	} catch (error) {
		logger.warn("Payment cache clear skipped: redis unavailable", {
			...logCtx,
			error: getErrorMeta(error),
		});
		return;
	}

	const keysToDelete = [];

	try {
		for await (const key of redisClient.scanIterator({
			MATCH: "cache:payment:*",
			COUNT: 100,
		})) {
			keysToDelete.push(key);
		}

		if (keysToDelete.length === 0) {
			return;
		}

		await redisClient.del(keysToDelete);

		logger.info("Payment cache cleared", {
			...logCtx,
			deletedKeys: keysToDelete.length,
		});
	} catch (error) {
		logger.warn("Payment cache clear failed", {
			...logCtx,
			error: getErrorMeta(error),
		});
	}
}

/**
 * - create a payment entry for the authenticated user
 * - POST /api/payment
 * - requires user authentication
 */
async function createPayment(req, res) {
	const logCtx = getLogContext(req);
	const { amount, paymentMethod, transactionID, senderNumber } = req.body;
	const parsedAmount = Number(amount);
	const normalizedPaymentMethod = String(paymentMethod || "").trim();
	const normalizedPaymentMethodLower = normalizedPaymentMethod.toLowerCase();
	const isStripePayment = normalizedPaymentMethod.toLowerCase() === "stripe";
	const isSenderNumberRequired = ["bkash", "nagad"].includes(
		normalizedPaymentMethodLower,
	);
	const normalizedTransactionID = String(transactionID || "").trim();
	const normalizedSenderNumber = String(senderNumber || "").trim();
	const generatedStripeTransactionID = `STRIPE-${Date.now()}`;
	const finalTransactionID = isStripePayment
		? normalizedTransactionID || generatedStripeTransactionID
		: normalizedTransactionID;

	logger.info("Create payment attempt", {
		...logCtx,
		amount,
		paymentMethod,
		transactionID,
		senderNumber,
	});

	if (
		amount === undefined ||
		amount === null ||
		Number.isNaN(parsedAmount) ||
		parsedAmount < 0.01 ||
		!normalizedPaymentMethod ||
		(!isStripePayment &&
			(!normalizedTransactionID ||
				(isSenderNumberRequired && !normalizedSenderNumber)))
	) {
		logger.warn("Create payment failed: invalid payload", {
			...logCtx,
			amount,
			paymentMethod,
			transactionID,
			senderNumber,
		});

		const requirementMessage = isStripePayment
			? "amount and paymentMethod are required. Amount must be at least 0.01"
			: isSenderNumberRequired
				? "amount, paymentMethod, senderNumber and transactionID are required. Amount must be at least 0.01"
				: "amount, paymentMethod and transactionID are required. Amount must be at least 0.01";

		return res.status(400).json({
			success: false,
			message: requirementMessage,
		});
	}

	try {
		const group = await groupModel.findOne({
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			logger.warn("Create payment failed: user has no group", {
				...logCtx,
				userId: req.user._id,
			});

			return res.status(404).json({
				success: false,
				message: "User is not part of any group",
			});
		}

		logger.debug("Create payment creating document", {
			...logCtx,
			groupId: group._id,
			userId: req.user._id,
			amount: parsedAmount,
		});

		const payment = await paymentModel.create({
			groupID: group._id,
			userID: req.user._id,
			amount: parsedAmount,
			paymentMethod: normalizedPaymentMethod,
			senderNumber: isStripePayment ? "" : normalizedSenderNumber,
			transactionID: finalTransactionID,
		});

		logger.info("Create payment success", {
			...logCtx,
			paymentId: payment._id,
			groupId: group._id,
			userId: req.user._id,
			amount: parsedAmount,
		});

		await clearPaymentCache(logCtx);

		return res.status(201).json({
			success: true,
			message: "Payment created successfully",
			payment,
		});
	} catch (error) {
		if (error?.code === 11000) {
			logger.warn("Create payment failed: duplicate transactionID", {
				...logCtx,
				transactionID,
				error: getErrorMeta(error),
			});

			return res.status(409).json({
				success: false,
				message: "transactionID already exists",
			});
		}

		logger.error("Create payment failed", {
			...logCtx,
			amount,
			paymentMethod,
			transactionID,
			senderNumber,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to create payment",
		});
	}
}

/**
 * - create a stripe checkout session for the authenticated user
 * - POST /api/payment/stripe/checkout-session
 * - requires user authentication
 */
async function createStripeCheckoutSession(req, res) {
const logCtx = getLogContext(req);
	const parsedAmount = Number(req.body?.amount);
	const redirectBaseUrl = String(req.body?.redirectBaseUrl || "").trim();
    // 1. Platform check korun (Request body theke)
    const isMobile = req.body?.platform === 'mobile'; 

	logger.info("Create Stripe checkout session attempt", { ...logCtx, amount: req.body?.amount });

	if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
		return res.status(400).json({ success: false, message: "amount must be greater than 0" });
	}

	try {
		const stripe = getStripeClient();
		const clientBaseUrl = getSafeClientBaseUrl(redirectBaseUrl);

        // 2. Mobile hole custom scheme, nahole normal URL
        const success_url = isMobile 
            ? `smartbachelor://success?session_id={CHECKOUT_SESSION_ID}`
            : `${clientBaseUrl}/dashboard/payment?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
        
        const cancel_url = isMobile
            ? `smartbachelor://cancel`
            : `${clientBaseUrl}/dashboard/payment?stripe=cancelled`;

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			customer_email: req.user?.email || undefined,
			line_items: [{
                price_data: {
                    currency: (envConfig.STRIPE_CURRENCY || "bdt").toLowerCase(),
                    unit_amount: Math.round(parsedAmount * 100),
                    product_data: { name: `${isMobile ? 'Meal Khata' : 'SBL'}  Payment` },
                },
                quantity: 1,
            }],
			success_url: success_url, // Updated
			cancel_url: cancel_url,   // Updated
			metadata: {
				userId: String(req.user._id),
				userEmail: req.user.email || "",
				source: ` ${isMobile ? 'Meal Khata' : 'SBL'}  Payment`,
			},
		});

		logger.info("Create Stripe checkout session success", {
			...logCtx,
			sessionId: session.id,
			amount: parsedAmount,
		});

		return res.status(200).json({
			success: true,
			message: "Stripe checkout session created",
			sessionId: session.id,
			url: session.url,
		});
	} catch (error) {
		logger.error("Create Stripe checkout session failed", {
			...logCtx,
			amount: parsedAmount,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to create Stripe checkout session",
		});
	}
}

/**
 * - verify a stripe checkout session and persist payment entry
 * - POST /api/payment/stripe/confirm-session
 * - requires user authentication
 */
async function confirmStripeCheckoutSession(req, res) {
	const logCtx = getLogContext(req);
	const sessionId = String(req.body?.sessionId || "").trim();

	logger.info("Confirm Stripe checkout session attempt", {
		...logCtx,
		sessionId,
	});

	if (!sessionId) {
		return res.status(400).json({
			success: false,
			message: "sessionId is required",
		});
	}

	try {
		const stripe = getStripeClient();
		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ["payment_intent"],
		});

		if (!session || session.payment_status !== "paid") {
			return res.status(400).json({
				success: false,
				message: "Stripe session is not paid yet",
			});
		}

		if (session.metadata?.userId !== String(req.user._id)) {
			return res.status(403).json({
				success: false,
				message: "This Stripe session does not belong to this user",
			});
		}

		const transactionID =
			typeof session.payment_intent === "string"
				? session.payment_intent
				: session.payment_intent?.id || session.id;

		const existingPayment = await paymentModel.findOne({ transactionID });
		if (existingPayment) {
			if (String(existingPayment.userID) !== String(req.user._id)) {
				return res.status(403).json({
					success: false,
					message: "This Stripe payment does not belong to this user",
				});
			}

			await clearPaymentCache(logCtx);

			return res.status(200).json({
				success: true,
				message: "Stripe payment already confirmed",
				payment: existingPayment,
			});
		}

		const group = await groupModel.findOne({
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			return res.status(404).json({
				success: false,
				message: "User is not part of any group",
			});
		}

		const payment = await paymentModel.create({
			groupID: group._id,
			userID: req.user._id,
			amount: Number(session.amount_total || 0) / 100,
			paymentMethod: "Stripe",
			senderNumber: "",
			transactionID,
			status: "COMPLETED",
		});

		await clearPaymentCache(logCtx);

		logger.info("Confirm Stripe checkout session success", {
			...logCtx,
			sessionId,
			paymentId: payment._id,
			transactionID,
		});

		return res.status(200).json({
			success: true,
			message: "Stripe payment confirmed successfully",
			payment,
		});
	} catch (error) {
		logger.error("Confirm Stripe checkout session failed", {
			...logCtx,
			sessionId,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to confirm Stripe checkout session",
		});
	}
}

/**
 * - confirm a payment by transactionID for the authenticated user
 * - PATCH /api/payment/confirm/:paymentID
 * - requires user authentication
 * - only users who are part of the same group as the payment can confirm it
 */
async function confirmPayment(req, res) {
	const logCtx = getLogContext(req);
	const { paymentID } = req.params;
	const { transactionID } = req.body;

	logger.info("Confirm payment attempt", {
		...logCtx,
		paymentID,
		transactionID,
	});

	if (!transactionID || String(transactionID).trim() === "" || !paymentID) {
		logger.warn("Confirm payment failed: missing paymentID/transactionID", {
			...logCtx,
			paymentID,
			transactionID,
		});

		return res.status(400).json({
			success: false,
			message: "transactionID and paymentID are required",
		});
	}

	try {
		const payment = await paymentModel.findOne({
			_id: paymentID,
			transactionID,
		});

		if (!payment) {
			logger.warn("Confirm payment failed: payment not found", {
				...logCtx,
				paymentID,
				transactionID,
			});

			return res.status(404).json({
				success: false,
				message: "Payment not found for the user",
			});
		}

		const isManagerOfPaymentGroup = await groupModel.findOne({
			_id: payment.groupID,
			managerID: req.user._id,
		});

		if (!isManagerOfPaymentGroup) {
			logger.warn("Confirm payment failed: unauthorized", {
				...logCtx,
				paymentID,
				paymentUserId: payment.userID,
				requestUserId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "User is not authorized to confirm this payment",
			});
		}

		if (payment.status !== "PENDING") {
			logger.warn("Confirm payment failed: invalid state transition", {
				...logCtx,
				paymentID,
				currentStatus: payment.status,
				attemptedStatus: "COMPLETED",
			});

			return res.status(400).json({
				success: false,
				message: `Cannot confirm payment with status ${payment.status}. Only PENDING payments can be confirmed.`,
			});
		}

		payment.status = "COMPLETED";
		await payment.save();

		logger.info("Confirm payment success", {
			...logCtx,
			paymentId: payment._id,
			paymentUserId: payment.userID,
			confirmedBy: req.user._id,
		});

		await clearPaymentCache(logCtx);

		return res.status(200).json({
			success: true,
			message: "Payment confirmed successfully",
			payment,
		});
	} catch (error) {
		logger.error("Confirm payment failed", {
			...logCtx,
			paymentID,
			transactionID,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to confirm payment",
		});
	}
}

/**
 * - reject a pending payment by transactionID for the authenticated manager
 * - POST /api/payment/reject/:paymentID
 * - requires manager authentication
 */
async function rejectPayment(req, res) {
	const logCtx = getLogContext(req);
	const { paymentID } = req.params;
	const { transactionID } = req.body;

	logger.info("Reject payment attempt", {
		...logCtx,
		paymentID,
		transactionID,
	});

	if (!transactionID || String(transactionID).trim() === "" || !paymentID) {
		logger.warn("Reject payment failed: missing paymentID/transactionID", {
			...logCtx,
			paymentID,
			transactionID,
		});

		return res.status(400).json({
			success: false,
			message: "transactionID and paymentID are required",
		});
	}

	try {
		const payment = await paymentModel.findOne({
			_id: paymentID,
			transactionID,
		});

		if (!payment) {
			logger.warn("Reject payment failed: payment not found", {
				...logCtx,
				paymentID,
				transactionID,
			});

			return res.status(404).json({
				success: false,
				message: "Payment not found for the user",
			});
		}

		const isManagerOfPaymentGroup = await groupModel.findOne({
			_id: payment.groupID,
			managerID: req.user._id,
		});

		if (!isManagerOfPaymentGroup) {
			logger.warn("Reject payment failed: unauthorized", {
				...logCtx,
				paymentID,
				paymentUserId: payment.userID,
				requestUserId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "User is not authorized to reject this payment",
			});
		}

		if (payment.status !== "PENDING") {
			logger.warn("Reject payment failed: invalid state transition", {
				...logCtx,
				paymentID,
				currentStatus: payment.status,
				attemptedStatus: "FAILED",
			});

			return res.status(400).json({
				success: false,
				message: `Cannot reject payment with status ${payment.status}. Only PENDING payments can be rejected.`,
			});
		}

		payment.status = "FAILED";
		await payment.save();

		logger.info("Reject payment success", {
			...logCtx,
			paymentId: payment._id,
			paymentUserId: payment.userID,
			rejectedBy: req.user._id,
		});

		await clearPaymentCache(logCtx);

		return res.status(200).json({
			success: true,
			message: "Payment rejected successfully",
			payment,
		});
	} catch (error) {
		logger.error("Reject payment failed", {
			...logCtx,
			paymentID,
			transactionID,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to reject payment",
		});
	}
}

/**
 * - get payments for the authenticated user's group
 * - GET /api/payment
 * - requires manager authentication
 * - supports filtering by transactionID, userID, fromDate, toDate
 */
async function getPayments(req, res) {
	const logCtx = getLogContext(req);
	const transactionID = req.query.transactionID || req.query.transactionId;
	const userID = req.query.userID || req.query.userId || req.query.uid;
	const fromDate =
		req.query.fromDate || req.query.formDate || req.query.dateFrom;
	const toDate = req.query.toDate || req.query.dateTo;

	logger.info("Get payments attempt", {
		...logCtx,
		transactionID,
		userID,
		fromDate,
		toDate,
	});

	const normalizeDate = (value) => {
		if (!value) {
			return null;
		}

		const parsedDate = new Date(value);
		return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
	};

	try {
		const normalizedFromDate = normalizeDate(fromDate);
		if (fromDate && !normalizedFromDate) {
			logger.warn("Get payments failed: invalid fromDate", {
				...logCtx,
				fromDate,
			});

			return res.status(400).json({
				success: false,
				message: "Invalid fromDate",
			});
		}

		const normalizedToDate = normalizeDate(toDate);
		if (toDate && !normalizedToDate) {
			logger.warn("Get payments failed: invalid toDate", {
				...logCtx,
				toDate,
			});

			return res.status(400).json({
				success: false,
				message: "Invalid toDate",
			});
		}

		const group = await groupModel.findOne({
			managerID: req.user._id,
		});

		if (!group) {
			logger.warn("Get payments failed: user not group manager", {
				...logCtx,
				userId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "User is not part of any group",
			});
		}

		if (transactionID) {
			const payment = await paymentModel.findOne({
				groupID: group._id,
				transactionID: transactionID,
			});

			if (!payment) {
				logger.warn("Get payments failed: transactionID not found", {
					...logCtx,
					groupId: group._id,
					transactionID,
				});

				return res.status(404).json({
					success: false,
					message: "Payment not found",
				});
			}

			logger.info("Get payments success: single payment", {
				...logCtx,
				groupId: group._id,
				paymentId: payment._id,
				transactionID,
			});

			return res.status(200).json({
				success: true,
				message: "Payment fetched successfully",
				payment,
			});
		}

		const startDate =
			normalizedFromDate ||
			(() => {
				const now = new Date();
				const thirtyDaysAgo = new Date(now);
				thirtyDaysAgo.setDate(now.getDate() - 30);
				thirtyDaysAgo.setHours(0, 0, 0, 0);
				return thirtyDaysAgo;
			})();

		const endDate = normalizedToDate || new Date();
		if (startDate > endDate) {
			logger.warn("Get payments failed: invalid date range", {
				...logCtx,
				fromDate,
				toDate,
			});

			return res.status(400).json({
				success: false,
				message: "fromDate cannot be greater than toDate",
			});
		}

		endDate.setHours(23, 59, 59, 999);

		const createdAtFilter = {
			$gte: startDate,
			$lte: endDate,
		};

		const paymentFilter = {
			groupID: group._id,
			createdAt: createdAtFilter,
		};

		if (userID) {
			const isUserInGroup =
				String(group.managerID) === String(userID) ||
				group.userIDs.some((id) => String(id) === String(userID));

			if (!isUserInGroup) {
				logger.warn("Get payments failed: user not in group filter", {
					...logCtx,
					groupId: group._id,
					userID,
				});

				return res.status(404).json({
					success: false,
					message: "User is not part of this group",
				});
			}

			paymentFilter.userID = userID;
		}

		const payments = await paymentModel
			.find(paymentFilter)
			.sort({ createdAt: -1 })
			.populate("userID", "displayName email");

		logger.info("Get payments success", {
			...logCtx,
			groupId: group._id,
			count: payments.length,
			filters: {
				transactionID: !!transactionID,
				userID: userID || null,
				fromDate: startDate,
				toDate: endDate,
			},
		});

		return res.status(200).json({
			success: true,
			message: "Payments fetched successfully",
			count: payments.length,
			payments,
		});
	} catch (error) {
		logger.error("Get payments failed", {
			...logCtx,
			transactionID,
			userID,
			fromDate,
			toDate,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to fetch payments",
		});
	}
}

/**
 * - get payments for the authenticated user's group
 * - GET /api/payment/user
 * - requires user authentication
 * - returns only payments made by the authenticated user
 */
async function getUserPayments(req, res) {
	const logCtx = getLogContext(req);

	logger.info("Get user payments attempt", {
		...logCtx,
		userId: req.user._id,
	});

	try {
		const payments = await paymentModel
			.find({
				userID: req.user._id,
			})
			.sort({ createdAt: -1 });

		logger.info("Get user payments success", {
			...logCtx,
			userId: req.user._id,
			count: payments.length,
		});

		return res.status(200).json({
			success: true,
			message: "User payments fetched successfully",
			count: payments.length,
			payments,
		});
	} catch (error) {
		logger.error("Get user payments failed", {
			...logCtx,
			userId: req.user._id,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to fetch user payments",
		});
	}
}

module.exports = {
	createPayment,
	createStripeCheckoutSession,
	confirmStripeCheckoutSession,
	confirmPayment,
	rejectPayment,
	getPayments,
	getUserPayments,
};
