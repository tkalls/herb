import { internalAction, action } from "./_generated/server";
import { v } from "convex/values";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const BUCKET = process.env.R2_BUCKET_NAME ?? "herb-blobs";
const EXPIRY_SECONDS = 300;

// Called by Lane 2 after GPS capture — returns a PUT URL valid for 5 min.
export const presignUpload = action({
  args: {
    key: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (_ctx, { key, contentType }) => {
    const client = r2Client();
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType ?? "application/geo+json",
      }),
      { expiresIn: EXPIRY_SECONDS },
    );
    return { url, key, expiresIn: EXPIRY_SECONDS };
  },
});

// Internal — used by buyer worker to generate a short-lived read URL.
export const presignDownload = internalAction({
  args: { key: v.string() },
  handler: async (_ctx, { key }) => {
    const client = r2Client();
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: EXPIRY_SECONDS },
    );
    return { url, expiresIn: EXPIRY_SECONDS };
  },
});
