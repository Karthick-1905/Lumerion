import { eq } from "drizzle-orm";
import { db } from "../drizzle";
import 'dotenv/config'
import { media, notes } from "../drizzle/schema";
import { v4 as uuidv4 } from "uuid";
import * as Minio from 'minio'

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number(process.env.MINIO_PORT!),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS!,
  secretKey: process.env.MINIO_SECRET!,
});

type UploadMediaParams = {
  noteId: number;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  userId: number;
};

export async function uploadMedia({
  noteId,
  buffer,
  originalName,
  mimeType,
  size,
  userId,
}: UploadMediaParams) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  const expirySeconds = Number(process.env.MINIO_URL_EXPIRY ?? 3600);

  const [note] = await db
    .select({ userId: notes.userId })
    .from(notes)
    .where(eq(notes.noteId, noteId))
    .limit(1);

  if (!note) {
    throw new Error("Note not found");
  }

  if (note.userId !== userId) {
    throw new Error("Access denied to note");
  }

  const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `notes/${noteId}/${uuidv4()}_${sanitizedName}`;

  await minioClient.putObject(bucketName, objectKey, buffer, size, {
    "Content-Type": mimeType,
  });

  const url = await minioClient.presignedUrl("GET", bucketName, objectKey, expirySeconds);

  const type = mimeType.startsWith("image/")
    ? "image"
    : mimeType.startsWith("video/")
      ? "video"
      : "file";

  const metadata = {
    originalName,
    mimeType,
    size,
  } as const;

  const [inserted] = await db
    .insert(media)
    .values({
      noteId,
      objectKey,
      bucketName,
      url,
      type,
      originalName,
      mimeType,
      size,
      metadata,
    })
    .returning({
      mediaId: media.mediaId,
      url: media.url,
      type: media.type,
      metadata: media.metadata,
    });

  return inserted;
}
