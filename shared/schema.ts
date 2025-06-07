import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  uuid,
  real
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("sales-agent"), // sales-agent, client-admin, dev-admin
  isActive: boolean("is_active").default(true),
  // ISO Hub integration fields
  isoHubId: varchar("iso_hub_id"),
  isoHubToken: text("iso_hub_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User session tracking for admin analytics
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  firstMessage: text("first_message"),
  messageCount: integer("message_count").default(0),
  promptsUsed: integer("prompts_used").default(0),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prompt usage analytics
export const promptUsageLog = pgTable("prompt_usage_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => userSessions.id, { onDelete: "cascade" }),
  promptId: varchar("prompt_id").references(() => userPrompts.id, { onDelete: "set null" }),
  promptName: varchar("prompt_name").notNull(),
  promptCategory: varchar("prompt_category"),
  usedAt: timestamp("used_at").defaultNow(),
  executionTime: integer("execution_time_ms"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
});

// Admin settings and configurations
export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingKey: varchar("setting_key").unique().notNull(),
  settingValue: text("setting_value"),
  description: text("description"),
  category: varchar("category").default("general"),
  isActive: boolean("is_active").default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys for external tool integration
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  keyHash: varchar("key_hash").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permissions: text("permissions").array().default([]), // ['read', 'write', 'admin']
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Folders for organizing documents and chats with vector namespaces
export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references(() => folders.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 50 }).default("blue"),
  vectorNamespace: varchar("vector_namespace", { length: 255 }).notNull(), // Pinecone namespace
  folderType: varchar("folder_type", { length: 50 }).default("custom"), // processor, gateway, hardware, sales, custom
  priority: integer("priority").default(50), // For AI routing priority
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual messages within chats
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
  metadata: jsonb("metadata"), // For storing additional data like file references
  createdAt: timestamp("created_at").defaultNow(),
});

// Uploaded documents and files
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  isFavorite: boolean("is_favorite").default(false),
  contentHash: varchar("content_hash", { length: 64 }), // SHA256 hash for duplicate detection
  nameHash: varchar("name_hash", { length: 32 }), // MD5 hash of normalized filename
  // Permission settings
  isPublic: boolean("is_public").default(true), // Visible to all users
  adminOnly: boolean("admin_only").default(false), // Only admins can view
  managerOnly: boolean("manager_only").default(false), // Admins and managers can view
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User favorites (chats, documents, etc.)
export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'chat', 'document', 'folder'
  itemId: uuid("item_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Consolidated admin settings table that includes both analytics and system configuration
export const adminSettingsLegacy = pgTable("admin_settings_legacy", {
  id: varchar("id").primaryKey().notNull().default("default"),
  systemPrompt: text("system_prompt"),
  userInstructions: text("user_instructions"),
  assistantPrompt: text("assistant_prompt"),
  temperature: text("temperature").default("0.7"),
  maxTokens: integer("max_tokens").default(1500),
  topP: text("top_p").default("1.0"),
  frequencyPenalty: text("frequency_penalty").default("0.0"),
  presencePenalty: text("presence_penalty").default("0.0"),
  enableVoice: boolean("enable_voice").default(true),
  enableDocumentSearch: boolean("enable_document_search").default(true),
  enableRateComparisons: boolean("enable_rate_comparisons").default(true),
  googleDriveFolderId: varchar("google_drive_folder_id"),
  model: varchar("model").default("claude-3-7-sonnet-20250219"),
  enablePromptChaining: boolean("enable_prompt_chaining").default(true),
  enableSmartRouting: boolean("enable_smart_routing").default(true),
  folderRoutingThreshold: real("folder_routing_threshold").default(0.7),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
});

// Gamification - Achievements System
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(), // Lucide icon name
  category: varchar("category", { length: 50 }).notNull(), // 'chat', 'calculator', 'documents', 'social', 'streaks'
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
  points: integer("points").notNull().default(10),
  requirement: jsonb("requirement").notNull(), // JSON object defining unlock criteria
  isHidden: boolean("is_hidden").notNull().default(false), // Hidden until unlocked
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: jsonb("progress"), // Optional progress tracking
});

export const userStats = pgTable("user_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalMessages: integer("total_messages").notNull().default(0),
  totalChats: integer("total_chats").notNull().default(0),
  calculationsPerformed: integer("calculations_performed").notNull().default(0),
  documentsAnalyzed: integer("documents_analyzed").notNull().default(0),
  proposalsGenerated: integer("proposals_generated").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: timestamp("last_active_date"),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  weeklyMessages: integer("weekly_messages").default(0),
  monthlyMessages: integer("monthly_messages").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat ratings and feedback system
export const chatRatings = pgTable("chat_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  feedback: text("feedback"), // Optional user feedback
  sessionNotes: text("session_notes"), // Admin notes about why rating was low
  improvementAreas: text("improvement_areas").array(), // Areas flagged for improvement
  messageCount: integer("message_count").default(0),
  sessionDuration: integer("session_duration_minutes"),
  wasHelpful: boolean("was_helpful"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily usage tracking for streaks and engagement
export const dailyUsage = pgTable("daily_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  messagesCount: integer("messages_count").default(0),
  chatsCreated: integer("chats_created").default(0),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  featuresUsed: text("features_used").array(), // ['calculator', 'documents', 'proposals']
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboard periods (weekly, monthly, all-time)
export const leaderboards = pgTable("leaderboards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  period: varchar("period").notNull(), // 'weekly', 'monthly', 'all_time'
  rank: integer("rank").notNull(),
  score: integer("score").notNull(),
  metric: varchar("metric").notNull(), // 'messages', 'rating', 'streak', 'points'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Q&A Knowledge Base Management
export const qaKnowledgeBase = pgTable("qa_knowledge_base", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").notNull(),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document Tags
export const documentTags = pgTable("document_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  color: varchar("color").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Tag Relationships
export const documentTagRelations = pgTable("document_tag_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id),
  tagId: uuid("tag_id").notNull().references(() => documentTags.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Chunks for Search
export const documentChunks = pgTable("document_chunks", {
  id: varchar("id").primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ISO AMP Integration Data
export const merchantApplications = pgTable("merchant_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: varchar("business_name").notNull(),
  contactName: varchar("contact_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  businessType: varchar("business_type").notNull(),
  monthlyVolume: text("monthly_volume").notNull(),
  averageTicket: text("average_ticket").notNull(),
  status: varchar("status").notNull(),
  applicationData: jsonb("application_data"),
  proposalData: jsonb("proposal_data"),
  assignedAgent: varchar("assigned_agent").references(() => users.id),
  priority: varchar("priority").default("medium"),
  notes: text("notes").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Help Content for Contextual Bubbles
export const helpContent = pgTable("help_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageRoute: varchar("page_route").notNull(),
  elementSelector: varchar("element_selector").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  position: varchar("position").default("bottom"),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Web Search Log for Admin Notifications
export const webSearchLogs = pgTable("web_search_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  userQuery: text("user_query").notNull(),
  webResponse: text("web_response").notNull(),
  reason: varchar("reason").notNull(),
  shouldAddToDocuments: boolean("should_add_to_documents").default(false),
  adminReviewed: boolean("admin_reviewed").default(false),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// FAQ Knowledge Base for structured Q&A content
export const faqKnowledgeBase = pgTable("faq_knowledge_base", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").notNull(), // pos, integration, support, contact, etc.
  tags: text("tags").array().default([]),
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin logging table for tracking all first user chat requests
export const userChatLogs = pgTable("user_chat_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"),
  firstMessage: text("first_message").notNull(),
  chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  userRole: varchar("user_role"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// AI Training & Feedback Management Tables
export const aiTrainingFeedback = pgTable("ai_training_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
  userQuery: text("user_query").notNull(),
  aiResponse: text("ai_response").notNull(),
  correctResponse: text("correct_response"),
  feedbackType: varchar("feedback_type").notNull(), // "incorrect", "incomplete", "good", "needs_training"
  adminNotes: text("admin_notes"),
  sourceDocs: jsonb("source_docs"), // Documents that were referenced
  knowledgeGaps: text("knowledge_gaps").array(), // What information was missing
  suggestedPromptChanges: text("suggested_prompt_changes"),
  status: varchar("status").default("pending"), // "pending", "reviewed", "trained", "resolved"
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  priority: integer("priority").default(1), // 1=low, 2=medium, 3=high, 4=critical
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiPromptTemplates = pgTable("ai_prompt_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // "system", "user", "document_analysis", "business_intelligence"
  template: text("template").notNull(),
  variables: jsonb("variables"), // Variables that can be substituted
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  temperature: real("temperature").default(0.3),
  maxTokens: integer("max_tokens").default(300),
  createdBy: varchar("created_by").references(() => users.id),
  lastModifiedBy: varchar("last_modified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiKnowledgeCorrections = pgTable("ai_knowledge_corrections", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedbackId: uuid("feedback_id").references(() => aiTrainingFeedback.id, { onDelete: "cascade" }),
  incorrectInformation: text("incorrect_information").notNull(),
  correctInformation: text("correct_information").notNull(),
  sourceDocuments: text("source_documents").array(),
  category: varchar("category").notNull(), // "processor_info", "pricing", "equipment", "compliance"
  appliedToSystem: boolean("applied_to_system").default(false),
  adminVerified: boolean("admin_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiTrainingMaterials = pgTable("ai_training_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  materialType: varchar("material_type").notNull(), // "faq", "procedure", "policy", "rate_sheet"
  category: varchar("category").notNull(),
  tags: text("tags").array(),
  priority: integer("priority").default(1),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  sourceDocument: varchar("source_document"),
  lastReviewed: timestamp("last_reviewed"),
  reviewNotes: text("review_notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Add missing columns to userStats table
export const userStatsExtended = pgTable("user_stats_extended", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  averageRating: real("average_rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  averageResponseTime: real("average_response_time").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  folders: many(folders),
  chats: many(chats),
  documents: many(documents),
  stats: one(userStats, { fields: [users.id], references: [userStats.userId] }),
  userAchievements: many(userAchievements),
  favorites: many(favorites),
  trainingFeedback: many(aiTrainingFeedback),
  promptTemplates: many(aiPromptTemplates),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
  children: many(folders),
  chats: many(chats),
  documents: many(documents),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  folder: one(folders, { fields: [chats.folderId], references: [folders.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  folder: one(folders, { fields: [documents.folderId], references: [folders.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
}));

// Insert schemas
export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for new tables
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Chat monitoring table for admin oversight
export const chatMonitoring = pgTable("chat_monitoring", {
  id: varchar("id").primaryKey().notNull(),
  chatId: varchar("chat_id").notNull().references(() => chats.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  firstUserQuery: text("first_user_query").notNull(),
  aiResponse: text("ai_response").notNull(),
  responseTime: integer("response_time").notNull(), // milliseconds
  tokensUsed: integer("tokens_used").notNull(),
  model: varchar("model").notNull(),
  confidence: real("confidence").notNull(), // 0-1 scale
  timestamp: timestamp("timestamp").defaultNow(),
  isAccurate: boolean("is_accurate"), // null = pending review
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User prompt customization table
export const userPrompts = pgTable("user_prompts", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(), // e.g., "Email Writing", "Marketing Ideas"
  content: text("content").notNull().default(""), // Legacy field for compatibility
  writingStyle: text("writing_style"), // User's personal writing style description
  systemRules: text("system_rules"), // Rules for how AI should respond
  promptTemplate: text("prompt_template"), // The actual prompt template
  isDefault: boolean("is_default").default(false),
  category: varchar("category").default("general"), // "writing", "marketing", "communication", etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserPrompt = typeof userPrompts.$inferSelect;
export type InsertUserPrompt = typeof userPrompts.$inferInsert;
// Removed duplicate InsertUser definition
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// New admin analytics types
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type PromptUsageLog = typeof promptUsageLog.$inferSelect;
export type InsertPromptUsageLog = typeof promptUsageLog.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

// Insert schemas for admin tables
export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPromptUsageLogSchema = createInsertSchema(promptUsageLog).omit({
  id: true,
  usedAt: true,
});

// Enhanced AI Model Configuration
export const aiModels = pgTable("ai_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  provider: varchar("provider").notNull(), // 'openai', 'anthropic'
  modelId: varchar("model_id").notNull(),
  isActive: boolean("is_active").default(true),
  maxTokens: integer("max_tokens").default(4000),
  costPerToken: real("cost_per_token").default(0.0),
  isDefault: boolean("is_default").default(false),
  capabilities: jsonb("capabilities"), // {vision: true, functions: true, etc}
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Model Performance Tracking
export const modelPerformance = pgTable("model_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelId: uuid("model_id").references(() => aiModels.id),
  date: varchar("date").notNull(),
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  averageResponseTime: real("average_response_time").default(0),
  averageTokensUsed: real("average_tokens_used").default(0),
  totalCost: real("total_cost").default(0),
  userSatisfactionScore: real("user_satisfaction_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vector Database Management
export const vectorIndices = pgTable("vector_indices", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  description: text("description"),
  dimensions: integer("dimensions").default(1536),
  indexType: varchar("index_type").default('cosine'), // cosine, euclidean, dot_product
  documentCount: integer("document_count").default(0),
  lastOptimized: timestamp("last_optimized"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document Processing Pipeline
export const documentProcessingJobs = pgTable("document_processing_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id),
  status: varchar("status").default('pending'), // pending, processing, completed, failed
  jobType: varchar("job_type").notNull(), // extract, vectorize, analyze, reindex
  priority: integer("priority").default(1),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  errorMessage: text("error_message"),
  processingTime: integer("processing_time_ms"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prompt Template Versioning
export const promptVersions = pgTable("prompt_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: varchar("template_id").notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(),
  changes: text("changes"),
  performanceScore: real("performance_score"),
  isActive: boolean("is_active").default(false),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Response Quality Tracking
export const responseQuality = pgTable("response_quality", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id").references(() => chats.id),
  messageId: uuid("message_id").references(() => messages.id),
  modelUsed: varchar("model_used").notNull(),
  promptVersion: varchar("prompt_version"),
  relevanceScore: real("relevance_score"),
  accuracyScore: real("accuracy_score"),
  helpfulnessScore: real("helpfulness_score"),
  responseTime: integer("response_time_ms"),
  tokenCount: integer("token_count"),
  userFeedback: varchar("user_feedback"), // positive, negative, neutral
  adminReview: text("admin_review"),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Analytics
export const systemAnalytics = pgTable("system_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: varchar("date").notNull(),
  metric: varchar("metric").notNull(), // daily_users, document_uploads, ai_requests, etc
  value: real("value").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document Retrieval Configuration
export const retrievalConfigs = pgTable("retrieval_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  similarityThreshold: real("similarity_threshold").default(0.7),
  maxResults: integer("max_results").default(10),
  chunkSize: integer("chunk_size").default(1000),
  chunkOverlap: integer("chunk_overlap").default(200),
  searchStrategy: varchar("search_strategy").default('hybrid'),
  embeddingModel: varchar("embedding_model").default('text-embedding-3-large'),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Filtering Rules
export const contentFilters = pgTable("content_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  filterType: varchar("filter_type").notNull(), // profanity, bias, compliance
  pattern: text("pattern").notNull(),
  severity: varchar("severity").default('medium'), // low, medium, high, critical
  action: varchar("action").default('flag'), // flag, block, modify
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports for new tables
export type AIModel = typeof aiModels.$inferSelect;
export type InsertAIModel = typeof aiModels.$inferInsert;
export type ModelPerformance = typeof modelPerformance.$inferSelect;
export type InsertModelPerformance = typeof modelPerformance.$inferInsert;
export type VectorIndex = typeof vectorIndices.$inferSelect;
export type InsertVectorIndex = typeof vectorIndices.$inferInsert;
export type DocumentProcessingJob = typeof documentProcessingJobs.$inferSelect;
export type InsertDocumentProcessingJob = typeof documentProcessingJobs.$inferInsert;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type InsertPromptVersion = typeof promptVersions.$inferInsert;
export type ResponseQuality = typeof responseQuality.$inferSelect;
export type InsertResponseQuality = typeof responseQuality.$inferInsert;
export type SystemAnalytics = typeof systemAnalytics.$inferSelect;
export type InsertSystemAnalytics = typeof systemAnalytics.$inferInsert;
export type RetrievalConfig = typeof retrievalConfigs.$inferSelect;
export type InsertRetrievalConfig = typeof retrievalConfigs.$inferInsert;
export type ContentFilter = typeof contentFilters.$inferSelect;
export type InsertContentFilter = typeof contentFilters.$inferInsert;

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});
export type Document = typeof documents.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertQAKnowledgeBaseSchema = createInsertSchema(qaKnowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentTagSchema = createInsertSchema(documentTags).omit({
  id: true,
  createdAt: true,
});

export const insertMerchantApplicationSchema = createInsertSchema(merchantApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Gamification Schema Exports
export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

// Consolidated Gamification Types (removing first set of duplicates)
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Chat Rating Types
export type ChatRating = typeof chatRatings.$inferSelect;
export type InsertChatRating = typeof chatRatings.$inferInsert;

// Daily Usage Types
export type DailyUsage = typeof dailyUsage.$inferSelect;
export type InsertDailyUsage = typeof dailyUsage.$inferInsert;

// Leaderboard Types
export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboard = typeof leaderboards.$inferInsert;

export const insertChatRatingSchema = createInsertSchema(chatRatings).omit({
  id: true,
  createdAt: true,
});

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
  id: true,
  createdAt: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboards).omit({
  id: true,
  createdAt: true,
});

export const insertFaqSchema = createInsertSchema(faqKnowledgeBase).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// Removed duplicate gamification types
export type FaqEntry = typeof faqKnowledgeBase.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;

export const insertHelpContentSchema = createInsertSchema(helpContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertQAKnowledgeBase = z.infer<typeof insertQAKnowledgeBaseSchema>;
export type QAKnowledgeBase = typeof qaKnowledgeBase.$inferSelect;
export type InsertDocumentTag = z.infer<typeof insertDocumentTagSchema>;
export type DocumentTag = typeof documentTags.$inferSelect;
export type InsertMerchantApplication = z.infer<typeof insertMerchantApplicationSchema>;
export type MerchantApplication = typeof merchantApplications.$inferSelect;
export type InsertHelpContent = z.infer<typeof insertHelpContentSchema>;
export type HelpContent = typeof helpContent.$inferSelect;

export const insertUserChatLogSchema = createInsertSchema(userChatLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUserChatLog = z.infer<typeof insertUserChatLogSchema>;
export type UserChatLog = typeof userChatLogs.$inferSelect;

// Vendor Intelligence Tables
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  baseUrl: varchar("base_url").notNull(),
  active: boolean("active").default(true),
  crawlFrequency: varchar("crawl_frequency").notNull(), // 'hourly', 'daily', 'weekly'
  selectors: jsonb("selectors"), // CSS selectors for document discovery
  documentPaths: jsonb("document_paths"), // Array of paths to check
  lastScan: timestamp("last_scan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vendorDocuments = pgTable("vendor_documents", {
  id: varchar("id").primaryKey().notNull(),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  url: varchar("url").notNull(),
  title: varchar("title").notNull(),
  contentHash: varchar("content_hash").notNull(),
  content: text("content"),
  discoveredAt: timestamp("discovered_at").defaultNow(),
  lastChecked: timestamp("last_checked").defaultNow(),
  lastModified: timestamp("last_modified"),
  isActive: boolean("is_active").default(true),
});

export const documentChanges = pgTable("document_changes", {
  id: varchar("id").primaryKey().notNull(),
  documentId: varchar("document_id").notNull().references(() => vendorDocuments.id),
  changeType: varchar("change_type").notNull(), // 'new', 'updated', 'removed'
  changeDetails: jsonb("change_details"), // Detailed diff information
  detectedAt: timestamp("detected_at").defaultNow(),
  notified: boolean("notified").default(false),
});

export const vendorRelations = relations(vendors, ({ many }) => ({
  documents: many(vendorDocuments),
}));

export const vendorDocumentRelations = relations(vendorDocuments, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [vendorDocuments.vendorId],
    references: [vendors.id],
  }),
  changes: many(documentChanges),
}));

export const documentChangeRelations = relations(documentChanges, ({ one }) => ({
  document: one(vendorDocuments, {
    fields: [documentChanges.documentId],
    references: [vendorDocuments.id],
  }),
}));

// Vendor Intelligence Schema Types
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorDocumentSchema = createInsertSchema(vendorDocuments).omit({
  id: true,
  discoveredAt: true,
  lastChecked: true,
});

export const insertDocumentChangeSchema = createInsertSchema(documentChanges).omit({
  id: true,
  detectedAt: true,
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type VendorDocument = typeof vendorDocuments.$inferSelect;
export type InsertVendorDocument = z.infer<typeof insertVendorDocumentSchema>;
export type DocumentChange = typeof documentChanges.$inferSelect;
export type InsertDocumentChange = z.infer<typeof insertDocumentChangeSchema>;
