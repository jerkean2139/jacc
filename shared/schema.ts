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

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("sales-agent"), // sales-agent, client-admin, dev-admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Folders for organizing documents and chats
export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references(() => folders.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 50 }).default("blue"),
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

export const adminSettings = pgTable("admin_settings", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by"),
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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  chats: many(chats),
  documents: many(documents),
  favorites: many(favorites),
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

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
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
