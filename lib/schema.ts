
import { boolean, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

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
    updatedAt: timestamp("updated_at").defaultNow(),
});
