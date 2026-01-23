/**
 * Upload dist/client assets to MinIO/S3
 *
 * This script uploads the built client assets to an S3-compatible storage bucket.
 * Run after `bun run bun:build` to sync static assets to MinIO.
 *
 * Usage:
 *   bun run --env-file=.env scripts/upload-to-minio.ts
 *
 * Required environment variables:
 *   S3_ACCESS_KEY_ID - MinIO/S3 access key
 *   S3_SECRET_ACCESS_KEY - MinIO/S3 secret key
 *   S3_BUCKET - Bucket name
 *   S3_ENDPOINT - MinIO endpoint (e.g., http://localhost:9000)
 *   S3_REGION - Region (default: us-east-1)
 */

import { S3Client } from "bun";
import path from "node:path";

const requiredEnvVars = [
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_BUCKET",
  "S3_ENDPOINT",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const s3 = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  bucket: process.env.S3_BUCKET?.toLowerCase(),
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "us-east-1",
});

const CLIENT_DIR = "./dist/client";
const S3_PREFIX = "client/";

async function uploadAssets() {
  console.info(
    `Uploading assets from ${CLIENT_DIR} to bucket ${process.env.S3_BUCKET}...`
  );

  // TanStack Start outputs _shell.html, not index.html at root
  const hasIndex = await Bun.file(path.join(CLIENT_DIR, "index.html")).exists();
  const hasShell = await Bun.file(
    path.join(CLIENT_DIR, "_shell.html")
  ).exists();
  if (!hasIndex && !hasShell) {
    console.error(`Client directory not found or empty: ${CLIENT_DIR}`);
    console.error("Run 'bun run bun:build' first to generate client assets.");
    process.exit(1);
  }

  // Use onlyFiles: true to skip directories automatically
  const glob = new Bun.Glob("**/*");
  let uploadedCount = 0;
  let totalBytes = 0;

  for await (const relativePath of glob.scan({
    cwd: CLIENT_DIR,
    onlyFiles: true,
  })) {
    const filepath = path.join(CLIENT_DIR, relativePath);
    const file = Bun.file(filepath);

    // Skip empty files
    if (file.size === 0) {
      continue;
    }

    const key = `${S3_PREFIX}${relativePath}`;
    const contentType = file.type || "application/octet-stream";

    try {
      const data = await file.arrayBuffer();
      await s3.file(key).write(data, { type: contentType });
      uploadedCount++;
      totalBytes += file.size;
      console.info(`  ${key} (${formatBytes(file.size)}, ${contentType})`);
    } catch (error) {
      console.error(`Failed to upload ${key}:`, error);
      process.exit(1);
    }
  }

  console.info("");
  console.info(
    `Upload complete: ${uploadedCount} files, ${formatBytes(totalBytes)} total`
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

uploadAssets().catch((error) => {
  console.error("Upload failed:", error);
  process.exit(1);
});
