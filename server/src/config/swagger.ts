import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Registration API",
      version: "1.0.0",
      description: "API documentation for second assignment.",
      contact: {
        name: "Arbel & Nitzan",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["username", "email", "fullName"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated user ID",
            },
            username: {
              type: "string",
              description: "Unique username",
            },
            email: {
              type: "string",
              format: "email",
              description: "Unique email address",
            },
            fullName: {
              type: "string",
              description: "Full name of the user",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        UserRegistrationRequest: {
          type: "object",
          required: ["username", "email", "fullName", "password"],
          properties: {
            username: {
              type: "string",
              description: "Unique username",
              example: "awesome_user",
            },
            email: {
              type: "string",
              format: "email",
              description: "Unique email address",
              example: "user@example.com",
            },
            fullName: {
              type: "string",
              description: "Full name",
              example: "John Doe",
            },
            password: {
              type: "string",
              format: "password",
              description: "User password",
              example: "SecurePassword123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: {
              type: "string",
              description: "Username",
              example: "johndoe",
            },
            password: {
              type: "string",
              format: "password",
              description: "User password",
              example: "SecurePassword123",
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              description: "Refresh token",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        UserUpdateRequest: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "New username (3-50 characters)",
              example: "new_username",
            },
            email: {
              type: "string",
              format: "email",
              description: "New email address",
              example: "newemail@example.com",
            },
            fullName: {
              type: "string",
              description: "New full name (2-100 characters)",
              example: "Jane Doe",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
                accessToken: {
                  type: "string",
                  description: "JWT access token (valid for 30 minutes)",
                },
                refreshToken: {
                  type: "string",
                  description: "JWT refresh token (valid for 7 days)",
                },
              },
            },
          },
        },
        TokenPair: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  description: "New JWT access token",
                },
                refreshToken: {
                  type: "string",
                  description: "New JWT refresh token",
                },
              },
            },
          },
        },
        Post: {
          type: "object",
          required: ["title", "content", "ownerId"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated post ID",
            },
            title: {
              type: "string",
              description: "Post title",
            },
            content: {
              type: "string",
              description: "Post content",
            },
            ownerId: {
              type: "string",
              description: "ID of the user who created the post",
            },
            imageAttachmentUrl: {
              type: "string",
              description: "URL of attached image (optional)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        PostCreationRequest: {
          type: "object",
          required: ["title", "content", "ownerId"],
          properties: {
            title: {
              type: "string",
              description: "Post title (1-200 characters)",
              example: "My First Post",
            },
            content: {
              type: "string",
              description: "Post content (1-10000 characters)",
              example: "This is the content of my post...",
            },
            ownerId: {
              type: "string",
              description: "ID of the user creating the post",
              example: "507f1f77bcf86cd799439011",
            },
            imageAttachmentUrl: {
              type: "string",
              description: "URL of attached image (optional)",
              example: "https://example.com/image.jpg",
            },
          },
        },
        PostUpdateRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: {
              type: "string",
              description: "Updated post content (1-10000 characters)",
              example: "Updated content...",
            },
          },
        },
        Comment: {
          type: "object",
          required: ["content", "postId", "ownerId"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated comment ID",
            },
            content: {
              type: "string",
              description: "Comment content",
            },
            postId: {
              type: "string",
              description: "ID of the post this comment belongs to",
            },
            ownerId: {
              type: "string",
              description: "ID of the user who created the comment",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CommentCreationRequest: {
          type: "object",
          required: ["content", "postId", "ownerId"],
          properties: {
            content: {
              type: "string",
              description: "Comment content (1-5000 characters)",
              example: "Great post!",
            },
            postId: {
              type: "string",
              description: "ID of the post to comment on",
              example: "507f1f77bcf86cd799439011",
            },
            ownerId: {
              type: "string",
              description: "ID of the user creating the comment",
              example: "507f1f77bcf86cd799439012",
            },
          },
        },
        CommentUpdateRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: {
              type: "string",
              description: "Updated comment content (1-5000 characters)",
              example: "Updated comment...",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
            },
            status: {
              type: "number",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(
    "Swagger documentation available at http://localhost:3000/api-docs"
  );
};
