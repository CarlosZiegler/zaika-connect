import { index, pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";

import { resources } from "./resources";

export const embeddings = pgTable(
  "embeddings",
  {
    id: text("id").primaryKey(),

    resourceId: text("resource_id").references(() => resources.id, {
      onDelete: "cascade",
    }),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
