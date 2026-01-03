import { boolean, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export interface SystemConfig {
    maintenanceMode: boolean;
    environmentId: string;
    logLevel: 'info' | 'warn' | 'error' | 'debug';
    maxRetries: number;
    enableAuditLogging: boolean;
    show_gdpr_to_teams: boolean;
    smsCompressorProvider: 'risen' | 'gemini';
    smsCompressorMaxChars: 160 | 370;
    geminiApiKey: string;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
    maintenanceMode: false,
    environmentId: 'development',
    logLevel: 'info',
    maxRetries: 3,
    enableAuditLogging: true,
    show_gdpr_to_teams: false,
    smsCompressorProvider: 'risen',
    smsCompressorMaxChars: 160,
    geminiApiKey: '',
};

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
    role: text("role").default('user'),
    teamId: text("team_id"), // Added team_id field
    banned: boolean("banned"),
    banReason: text("banReason"),
    banExpires: timestamp("banExpires"),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    expiresAt: timestamp("expiresAt"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt"),
});

export const passkey = pgTable("passkey", {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("publicKey").notNull(),
    userId: text("userId").notNull().references(() => user.id),
    credentialID: text("credentialID").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("deviceType").notNull(),
    backedUp: boolean("backedUp").notNull(),
    transports: text("transports"),
    aaguid: text("aaguid"),
    createdAt: timestamp("createdAt"),
});

export const template = pgTable("template", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    content: text("content").notNull(),
    teamId: text("team_id"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const team = pgTable("team", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    manager: text("manager").notNull(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const smsLog = pgTable("sms_log", {
    id: text("id").primaryKey(),
    teamId: text("team_id").notNull(),
    userId: text("user_id").references(() => user.id),
    message: text("message").notNull(),
    recipient: text("recipient").notNull(),
    status: text("status").notNull(), // 'sent', 'failed', 'scheduled'
    scheduledFor: timestamp("scheduled_for"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const systemConfig = pgTable("system_config", {
    key: text("key").primaryKey(), // e.g., 'allowed_domains'
    value: text("value").notNull(), // e.g., 'nhsbsa.nhs.uk'
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const serviceAssessment = pgTable("service_assessment", {
    id: text("id").primaryKey(),
    serviceName: text("service_name"),
    volumeEmail: integer("volume_email"),
    volumeSms: integer("volume_sms"),
    volumeLetter: integer("volume_letter"),
    isUnique: boolean("is_unique"),
    hasMinTeam: boolean("has_min_team"),
    hasTemplates: boolean("has_templates"),
    fromName: text("from_name"),
    replyToEmail: text("reply_to_email"),
    senderId: text("sender_id"),
    updatedAt: timestamp("updated_at"),
    updatedBy: text("updated_by"),
});

export const apiKey = pgTable("api_key", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    key: text("key").notNull().unique(), // Storing plain text for MVP as per plan
    userId: text("user_id").references(() => user.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
});

export const userStory = pgTable("user_story", {
    id: text("id").primaryKey(), // e.g., 'US-001'
    role: text("role").notNull(),
    feature: text("feature").notNull(),
    story: text("story").notNull(),
    acceptanceCriteria: text("acceptance_criteria"), // JSON stringified array
    priority: text("priority").notNull(), // High, Medium, Low, Critical
    status: text("status").notNull(), // Pending, In Progress, Completed
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
