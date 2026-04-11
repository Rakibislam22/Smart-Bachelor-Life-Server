const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const port = process.env.PORT || 3000;
const serverUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

const options = {
	definition: {
		openapi: "3.0.3",
		info: {
			title: "Smart Bachelor Life API",
			version: "1.0.0",
			description:
				"Production-grade API documentation for Smart Bachelor Life server.",
		},
		servers: [
			{
				url: serverUrl,
				description: "Default server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "Firebase ID token in Authorization header",
				},
			},
			schemas: {
				ApiError: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: {
							type: "string",
							example: "Something went wrong",
						},
					},
					required: ["success", "message"],
				},
				User: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a111",
						},
						firebaseUid: {
							type: "string",
							example: "firebase_uid_123",
						},
						email: {
							type: "string",
							format: "email",
							example: "user@example.com",
						},
						displayName: { type: "string", example: "John Doe" },
						photoURL: {
							type: "string",
							example: "https://example.com/avatar.png",
						},
						role: {
							type: "string",
							enum: ["MANAGER", "USER"],
							example: "USER",
						},
						provider: { type: "string", example: "GOOGLE" },
						emailVerified: { type: "boolean", example: true },
						lastLoginAt: { type: "string", format: "date-time" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Group: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a222",
						},
						title: { type: "string", example: "Maple Street Flat" },
						address: { type: "string", example: "12 Maple Street" },
						managerID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a111",
						},
						userIDs: {
							type: "array",
							items: {
								type: "string",
								example: "67f2de9f4e4d9c7ad9a9a333",
							},
						},
						joinCode: { type: "string", example: "ABC12" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Expense: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a444",
						},
						groupID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a222",
						},
						userID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a111",
						},
						title: { type: "string", example: "Monthly groceries" },
						amount: { type: "number", example: 4500 },
						category: { type: "string", example: "GROCERY" },
						documentURL: {
							type: "string",
							example:
								"https://ik.imagekit.io/.../expenses_GROCERY_file.jpg",
						},
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Payment: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a555",
						},
						groupID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a222",
						},
						userID: {
							oneOf: [
								{
									type: "string",
									example: "67f2de9f4e4d9c7ad9a9a111",
								},
								{
									type: "object",
									properties: {
										_id: {
											type: "string",
											example: "67f2de9f4e4d9c7ad9a9a111",
										},
										displayName: {
											type: "string",
											example: "John Doe",
										},
										email: {
											type: "string",
											format: "email",
											example: "john@example.com",
										},
									},
								},
							],
						},
						amount: { type: "number", example: 1200 },
						paymentMethod: { type: "string", example: "bkash" },
						transactionID: {
							type: "string",
							example: "TXN_20260405001",
						},
						status: {
							type: "string",
							enum: ["PENDING", "COMPLETED", "FAILED"],
							example: "PENDING",
						},
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				AuthRegisterRequest: {
					type: "object",
					properties: {
						displayName: { type: "string" },
						photoURL: { type: "string" },
						provider: { type: "string" },
					},
				},
				ManagerRegisterRequest: {
					type: "object",
					properties: {
						email: { type: "string", format: "email" },
					},
					required: ["email"],
				},
				CreateGroupRequest: {
					type: "object",
					properties: {
						title: { type: "string" },
						address: { type: "string" },
					},
					required: ["title", "address"],
				},
				SendJoinCodeRequest: {
					type: "object",
					properties: {
						userList: {
							type: "array",
							items: { type: "string", format: "email" },
						},
					},
					required: ["userList"],
				},
				JoinGroupRequest: {
					type: "object",
					properties: {
						joinCode: { type: "string", example: "ABC12" },
					},
					required: ["joinCode"],
				},
				RemoveUserRequest: {
					type: "object",
					properties: {
						email: { type: "string", format: "email" },
					},
					required: ["email"],
				},
				ChangeRoleRequest: {
					type: "object",
					properties: {
						userId: { type: "string" },
					},
					required: ["userId"],
				},
				CreateExpenseMultipartRequest: {
					type: "object",
					properties: {
						title: { type: "string" },
						amount: { type: "number" },
						category: { type: "string" },
						file: {
							type: "string",
							format: "binary",
							description: "Expense receipt image/file",
						},
					},
					required: ["title", "amount", "category", "file"],
				},
				CreatePaymentRequest: {
					type: "object",
					properties: {
						amount: { type: "number", minimum: 0, example: 1200 },
						paymentMethod: { type: "string", example: "bkash" },
						transactionID: {
							type: "string",
							example: "TXN_20260405001",
						},
					},
					required: ["amount", "paymentMethod", "transactionID"],
				},
				ConfirmPaymentRequest: {
					type: "object",
					properties: {
						transactionID: {
							type: "string",
							example: "TXN_20260405001",
						},
					},
					required: ["transactionID"],
				},
				StripeCheckoutSessionRequest: {
					type: "object",
					properties: {
						amount: { type: "number", minimum: 0, example: 1200 },
						redirectBaseUrl: {
							type: "string",
							example: "https://app.example.com",
						},
					},
					required: ["amount"],
				},
				UpdateGroupTitleRequest: {
					type: "object",
					properties: {
						title: { type: "string", example: "Maple Street Flat" },
					},
					required: ["title"],
				},
				UpdateGroupPaymentNoticeRequest: {
					type: "object",
					properties: {
						paymentNotice: {
							type: "string",
							example: "Pay before the 5th of every month",
						},
					},
					required: ["paymentNotice"],
				},
				RevokeInviteRequest: {
					type: "object",
					properties: {
						email: { type: "string", format: "email" },
					},
					required: ["email"],
				},
				Meal: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a666",
						},
						groupID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a222",
						},
						userID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a111",
						},
						date: { type: "string", format: "date-time" },
						mealCount: { type: "number", example: 2 },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				CreateMealRequest: {
					type: "object",
					properties: {
						groupID: { type: "string" },
						date: { type: "string", format: "date-time" },
						mealCount: {
							type: "array",
							items: { type: "number", minimum: 0 },
							example: [1, 2, 1],
							minItems: 3,
							maxItems: 3,
						},
					},
					required: ["groupID", "mealCount"],
				},
				UpdateMealRequest: {
					type: "object",
					properties: {
						date: { type: "string", format: "date-time" },
						mealCount: {
							type: "array",
							items: { type: "number", minimum: 0 },
							example: [1, 2, 1],
							minItems: 3,
							maxItems: 3,
						},
					},
				},
				Menu: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a777",
						},
						groupID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a222",
						},
						userID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a111",
						},
						date: { type: "string", format: "date-time" },
						breakfast: {
							type: "string",
							example: "Eggs and toast",
						},
						lunch: { type: "string", example: "Rice and curry" },
						dinner: { type: "string", example: "Khichuri" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				CreateMenuRequest: {
					type: "object",
					properties: {
						groupID: { type: "string" },
						date: { type: "string", format: "date-time" },
						breakfast: { type: "string" },
						lunch: { type: "string" },
						dinner: { type: "string" },
					},
					required: ["groupID"],
				},
				UpdateMenuRequest: {
					type: "object",
					properties: {
						date: { type: "string", format: "date-time" },
						breakfast: { type: "string" },
						lunch: { type: "string" },
						dinner: { type: "string" },
					},
				},
				Bazar: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a888",
						},
						groupID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a222",
						},
						userID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a111",
						},
						date: { type: "string", format: "date-time" },
						item: { type: "array", items: { type: "string" } },
						quantity: { type: "array", items: { type: "number" } },
						price: { type: "array", items: { type: "number" } },
						documentURL: {
							type: "string",
							example: "https://example.com/file.pdf",
						},
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				CreateBazarMultipartRequest: {
					type: "object",
					properties: {
						groupID: { type: "string" },
						item: { type: "array", items: { type: "string" } },
						quantity: { type: "array", items: { type: "number" } },
						price: { type: "array", items: { type: "number" } },
						file: {
							type: "string",
							format: "binary",
							description: "Bazar document file",
						},
					},
					required: ["groupID", "file"],
				},
				UpdateBazarRequest: {
					type: "object",
					properties: {
						item: { type: "array", items: { type: "string" } },
						quantity: { type: "array", items: { type: "number" } },
						price: { type: "array", items: { type: "number" } },
						date: { type: "string", format: "date-time" },
						documentURL: { type: "string" },
					},
				},
				ChatMessage: {
					type: "object",
					properties: {
						_id: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a999",
						},
						groupID: {
							type: "string",
							example: "67f2de9f4e4d9c7ad9a9a222",
						},
						text: {
							type: "string",
							example: "Please pay before Friday",
						},
						userID: {
							oneOf: [
								{ type: "string" },
								{
									type: "object",
									properties: {
										_id: { type: "string" },
										displayName: { type: "string" },
										email: {
											type: "string",
											format: "email",
										},
										photoURL: { type: "string" },
									},
								},
							],
						},
						readBy: {
							type: "array",
							items: {
								type: "object",
								properties: {
									userID: { type: "string" },
									readAt: {
										type: "string",
										format: "date-time",
									},
								},
							},
						},
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				CreateChatMessageRequest: {
					type: "object",
					properties: {
						groupID: { type: "string" },
						text: { type: "string", maxLength: 2000 },
					},
					required: ["groupID", "text"],
				},
				MarkChatMessagesReadRequest: {
					type: "object",
					properties: {
						groupID: { type: "string" },
					},
					required: ["groupID"],
				},
				TypingStatusRequest: {
					type: "object",
					properties: {
						groupID: { type: "string" },
						isTyping: { type: "boolean", example: true },
					},
					required: ["groupID"],
				},
				TypingUser: {
					type: "object",
					properties: {
						userID: { type: "string" },
						email: { type: "string", format: "email" },
						displayName: { type: "string" },
					},
				},
				TestEmailRequest: {
					type: "object",
					properties: {
						email: { type: "string", format: "email" },
						displayName: { type: "string" },
					},
					required: ["email", "displayName"],
				},
				TestUploadRequest: {
					type: "object",
					properties: {
						catagory: { type: "string", example: "test" },
						file: { type: "string", format: "binary" },
					},
					required: ["file"],
				},
			},
		},
		tags: [
			{ name: "Health", description: "Service health check" },
			{ name: "Auth", description: "Authentication and user lifecycle" },
			{ name: "Group", description: "Group management" },
			{ name: "Expenses", description: "Group expense management" },
			{
				name: "Payment",
				description: "Payment submission and confirmation",
			},
			{ name: "Meal", description: "Meal tracking" },
			{ name: "Menu", description: "Meal menu management" },
			{ name: "Bazar", description: "Bazar receipt tracking" },
			{ name: "Chat", description: "Group chat and presence" },
			{ name: "Testing", description: "Development-only test routes" },
		],
		paths: {
			"/health": {
				get: {
					tags: ["Health"],
					summary: "Health check",
					responses: {
						200: {
							description: "API is healthy",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: {
												type: "string",
												example: "OK",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/api/auth/register": {
				post: {
					tags: ["Auth"],
					summary: "Register user",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/AuthRegisterRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "User registered",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											user: {
												$ref: "#/components/schemas/User",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						422: {
							description: "User already exists",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/auth/manager-register": {
				post: {
					tags: ["Auth"],
					summary: "Self-promote to manager once after registration",
					description:
						"Allows the authenticated user to choose manager once after registration.",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "User promoted to manager",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											user: {
												$ref: "#/components/schemas/User",
											},
										},
									},
								},
							},
						},
						403: {
							description: "Role choice already completed",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "User not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/auth/login": {
				post: {
					tags: ["Auth"],
					summary: "Login user using Firebase token",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "User logged in",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											user: {
												$ref: "#/components/schemas/User",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Missing email in token",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "User not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/auth/logout": {
				post: {
					tags: ["Auth"],
					summary: "Logout user and blacklist token",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "Logged out",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: {
												type: "string",
												example:
													"User logged out successfully",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Already logged out or missing token",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group": {
				post: {
					tags: ["Group"],
					summary: "Create new group (manager only)",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/CreateGroupRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Group created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												$ref: "#/components/schemas/Group",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/send-join-code": {
				post: {
					tags: ["Group"],
					summary: "Send join code invitations",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/SendJoinCodeRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Join codes processed",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											invalidEmails: {
												type: "array",
												items: {
													type: "string",
													format: "email",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/join": {
				post: {
					tags: ["Group"],
					summary: "Join group with join code",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/JoinGroupRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Joined group successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												$ref: "#/components/schemas/Group",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid request",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Not invited",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Invalid/expired join code",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/remove-user": {
				post: {
					tags: ["Group"],
					summary: "Remove user from group",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/RemoveUserRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "User removed",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												$ref: "#/components/schemas/Group",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid request",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "User not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/details": {
				get: {
					tags: ["Group"],
					summary: "Get manager group details",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "Group details returned",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												$ref: "#/components/schemas/Group",
											},
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Group not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/details/{groupId}": {
				get: {
					tags: ["Group"],
					summary: "Get member view of group details",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "groupId",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Group details returned",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											groupTitle: { type: "string" },
											groupAddress: { type: "string" },
											manager: {
												$ref: "#/components/schemas/User",
											},
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Group not found or not a member",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/change-role": {
				post: {
					tags: ["Group"],
					summary: "Transfer manager role to a member",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ChangeRoleRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Role transferred",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											newManager: {
												$ref: "#/components/schemas/User",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid request",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/revoke-invite": {
				post: {
					tags: ["Group"],
					summary: "Revoke an invited email",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/RevokeInviteRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Invite revoked",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												$ref: "#/components/schemas/Group",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Group not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/leave": {
				post: {
					tags: ["Group"],
					summary: "Leave current group",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "Left the group",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												type: ["object", "null"],
												nullable: true,
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid request",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Group not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/title": {
				patch: {
					tags: ["Group"],
					summary: "Update group title",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UpdateGroupTitleRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Group title updated",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												$ref: "#/components/schemas/Group",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Group not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/group/notice": {
				patch: {
					tags: ["Group"],
					summary: "Update group payment notice",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UpdateGroupPaymentNoticeRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Payment notice updated",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											group: {
												$ref: "#/components/schemas/Group",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Group not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/expenses": {
				post: {
					tags: ["Expenses"],
					summary: "Create expense with receipt upload",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"multipart/form-data": {
								schema: {
									$ref: "#/components/schemas/CreateExpenseMultipartRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Expense created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											expense: {
												$ref: "#/components/schemas/Expense",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				get: {
					tags: ["Expenses"],
					summary: "List expenses for current user group",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "dateFrom",
							in: "query",
							required: false,
							schema: { type: "string", format: "date" },
							description: "Start date (YYYY-MM-DD)",
						},
						{
							name: "dateTo",
							in: "query",
							required: false,
							schema: { type: "string", format: "date" },
							description: "End date (YYYY-MM-DD)",
						},
					],
					responses: {
						200: {
							description: "Expenses retrieved",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											expenses: {
												type: "array",
												items: {
													$ref: "#/components/schemas/Expense",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query params",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/meals": {
				post: {
					tags: ["Meal"],
					summary: "Create meal entry",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/CreateMealRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Meal created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											data: {
												$ref: "#/components/schemas/Meal",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "User not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				get: {
					tags: ["Meal"],
					summary: "List meals for a group",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "groupID",
							in: "query",
							required: true,
							schema: { type: "string" },
						},
						{
							name: "date",
							in: "query",
							required: false,
							schema: { type: "string", format: "date" },
						},
					],
					responses: {
						200: {
							description: "Meals fetched",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												type: "array",
												items: {
													$ref: "#/components/schemas/Meal",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/meals/{id}": {
				patch: {
					tags: ["Meal"],
					summary: "Update meal entry",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UpdateMealRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Meal updated",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												$ref: "#/components/schemas/Meal",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Meal not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				delete: {
					tags: ["Meal"],
					summary: "Delete meal entry",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Meal deleted",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Meal not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/menus": {
				post: {
					tags: ["Menu"],
					summary: "Create menu entry",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/CreateMenuRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Menu created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												$ref: "#/components/schemas/Menu",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				get: {
					tags: ["Menu"],
					summary: "List menus for a group",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "groupID",
							in: "query",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Menus fetched",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												type: "array",
												items: {
													$ref: "#/components/schemas/Menu",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/menus/{id}": {
				patch: {
					tags: ["Menu"],
					summary: "Update menu entry",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UpdateMenuRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Menu updated",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												$ref: "#/components/schemas/Menu",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Menu not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				delete: {
					tags: ["Menu"],
					summary: "Delete menu entry",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Menu deleted",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Menu not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/bazar": {
				post: {
					tags: ["Bazar"],
					summary: "Create bazar entry with document upload",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"multipart/form-data": {
								schema: {
									$ref: "#/components/schemas/CreateBazarMultipartRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Bazar created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												$ref: "#/components/schemas/Bazar",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				get: {
					tags: ["Bazar"],
					summary: "List bazar entries for a group",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "groupID",
							in: "query",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Bazar entries fetched",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												type: "array",
												items: {
													$ref: "#/components/schemas/Bazar",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/bazar/{id}": {
				patch: {
					tags: ["Bazar"],
					summary: "Update bazar entry",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UpdateBazarRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Bazar updated",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											data: {
												$ref: "#/components/schemas/Bazar",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Bazar not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				delete: {
					tags: ["Bazar"],
					summary: "Delete bazar entry",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Bazar deleted",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Bazar not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/chat/messages": {
				post: {
					tags: ["Chat"],
					summary: "Send chat message",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/CreateChatMessageRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Message sent",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												$ref: "#/components/schemas/ChatMessage",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				get: {
					tags: ["Chat"],
					summary: "Get chat messages",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "groupID",
							in: "query",
							required: true,
							schema: { type: "string" },
						},
						{
							name: "limit",
							in: "query",
							required: false,
							schema: {
								type: "number",
								minimum: 1,
								maximum: 200,
								default: 50,
							},
						},
					],
					responses: {
						200: {
							description: "Messages fetched",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											count: { type: "number" },
											data: {
												type: "array",
												items: {
													$ref: "#/components/schemas/ChatMessage",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/chat/messages/read": {
				patch: {
					tags: ["Chat"],
					summary: "Mark chat messages as read",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/MarkChatMessagesReadRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Messages marked as read",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											modifiedCount: {
												type: "number",
												example: 5,
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/chat/typing": {
				patch: {
					tags: ["Chat"],
					summary: "Update typing status",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/TypingStatusRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Typing status updated",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				get: {
					tags: ["Chat"],
					summary: "Get typing users",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "groupID",
							in: "query",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						200: {
							description: "Typing users fetched",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											data: {
												type: "array",
												items: {
													$ref: "#/components/schemas/TypingUser",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/payment/stripe/checkout-session": {
				post: {
					tags: ["Payment"],
					summary: "Create Stripe checkout session",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/StripeCheckoutSessionRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Checkout session created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											sessionId: { type: "string" },
											url: { type: "string" },
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/payment/stripe/confirm-session": {
				post: {
					tags: ["Payment"],
					summary: "Confirm Stripe checkout session",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										sessionId: { type: "string" },
									},
									required: ["sessionId"],
								},
							},
						},
					},
					responses: {
						200: {
							description: "Stripe payment confirmed",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											payment: {
												$ref: "#/components/schemas/Payment",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "User not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/payment/reject/{paymentID}": {
				post: {
					tags: ["Payment"],
					summary: "Reject payment (manager only)",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "paymentID",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ConfirmPaymentRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Payment rejected",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											payment: {
												$ref: "#/components/schemas/Payment",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Payment not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/test": {
				get: {
					tags: ["Testing"],
					summary: "Generate a test join code",
					responses: {
						200: {
							description: "Test response",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											code: { type: "string" },
											joinCode: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
				post: {
					tags: ["Testing"],
					summary: "Run auth/email/upload test helpers",
					requestBody: {
						required: false,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										email: {
											type: "string",
											format: "email",
										},
										displayName: { type: "string" },
										catagory: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						200: {
							description: "Test helper response",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											result: { type: "object" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/api/payment": {
				post: {
					tags: ["Payment"],
					summary: "Create payment entry",
					security: [{ bearerAuth: [] }],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/CreatePaymentRequest",
								},
							},
						},
					},
					responses: {
						201: {
							description: "Payment created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											payment: {
												$ref: "#/components/schemas/Payment",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "User group not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						409: {
							description: "Duplicate transaction ID",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
				get: {
					tags: ["Payment"],
					summary: "Get payments for manager group",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "transactionID",
							in: "query",
							required: false,
							schema: { type: "string" },
							description: "Filter by transaction ID",
						},
						{
							name: "userID",
							in: "query",
							required: false,
							schema: { type: "string" },
							description:
								"Filter by user ID (must belong to manager group)",
						},
						{
							name: "fromDate",
							in: "query",
							required: false,
							schema: { type: "string", format: "date" },
							description: "Start date (YYYY-MM-DD)",
						},
						{
							name: "toDate",
							in: "query",
							required: false,
							schema: { type: "string", format: "date" },
							description: "End date (YYYY-MM-DD)",
						},
					],
					responses: {
						200: {
							description: "Payments fetched",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											count: {
												type: "number",
												example: 2,
											},
											payments: {
												type: "array",
												items: {
													$ref: "#/components/schemas/Payment",
												},
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid query parameters",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Payment or user/group not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/payment/confirm/{paymentID}": {
				patch: {
					tags: ["Payment"],
					summary: "Confirm payment (manager only)",
					security: [{ bearerAuth: [] }],
					parameters: [
						{
							name: "paymentID",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ConfirmPaymentRequest",
								},
							},
						},
					},
					responses: {
						200: {
							description: "Payment confirmed",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											payment: {
												$ref: "#/components/schemas/Payment",
											},
										},
									},
								},
							},
						},
						400: {
							description: "Invalid payload",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						403: {
							description: "Forbidden",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						404: {
							description: "Payment not found",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
			"/api/payment/user": {
				get: {
					tags: ["Payment"],
					summary: "Get current user payments",
					security: [{ bearerAuth: [] }],
					responses: {
						200: {
							description: "User payments fetched",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: {
												type: "boolean",
												example: true,
											},
											message: { type: "string" },
											count: {
												type: "number",
												example: 2,
											},
											payments: {
												type: "array",
												items: {
													$ref: "#/components/schemas/Payment",
												},
											},
										},
									},
								},
							},
						},
						401: {
							description: "Unauthorized",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
						500: {
							description: "Server error",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/ApiError",
									},
								},
							},
						},
					},
				},
			},
		},
	},
	apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerUiOptions = {
	swaggerOptions: {
		docExpansion: "none",
		persistAuthorization: true,
	},
	customSiteTitle: "Smart Bachelor Life API Docs",
};

module.exports = {
	swaggerUi,
	swaggerSpec,
	swaggerUiOptions,
};
