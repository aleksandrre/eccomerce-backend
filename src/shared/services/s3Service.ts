import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { ProductType } from "../../types";

/**
 * S3 object-key layout keeps files grouped and self-describing:
 *   products/<animal|food>/<productId>/<uuid>-<name>   — product images
 *   categories/<animal|food>/<uuid>-<name>             — category image
 * Because a product's images all share the `products/<type>/<id>/` prefix, they
 * can be deleted knowing only the product type and id (no stored keys needed).
 */

// Categories are discriminated by the same animal|food union as products.
type CategoryType = ProductType;

// S3 DeleteObjects accepts at most 1000 keys per request.
const DELETE_BATCH_SIZE = 1000;

const s3Client = new S3Client({
  region: env.BUCKET_REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
});

/** Uploads product images under `products/<type>/<productId>/` and returns their keys. */
export const uploadProductImages = async (
  productType: ProductType,
  productId: string,
  files: Express.Multer.File[]
): Promise<string[]> => {
  const prefix = `products/${productType}/${productId}/`;
  return Promise.all(
    files.map(async (file) => {
      const key = `${prefix}${uuidv4()}-${file.originalname}`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
      return key;
    })
  );
};

/** Uploads a single category image under `categories/<type>/` and returns its key. */
export const uploadCategoryImage = async (
  categoryType: CategoryType,
  file: Express.Multer.File
): Promise<string> => {
  const key = `categories/${categoryType}/${uuidv4()}-${file.originalname}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );
  return key;
};

/**
 * Deletes the given keys using the fewest requests possible: one
 * `DeleteObjectsCommand` per batch of up to 1000 keys (vs. one request per key).
 */
export const deleteFilesFromS3 = async (keys: string[]): Promise<void> => {
  const valid = keys.filter(Boolean);
  for (let i = 0; i < valid.length; i += DELETE_BATCH_SIZE) {
    const chunk = valid.slice(i, i + DELETE_BATCH_SIZE);
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: env.BUCKET_NAME,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      })
    );
  }
};

/** Lists everything under `prefix` (paginated) and batch-deletes it. */
const deleteByPrefix = async (prefix: string): Promise<void> => {
  let continuationToken: string | undefined;
  do {
    const listed = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: env.BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    const keys = (listed.Contents ?? [])
      .map((obj) => obj.Key)
      .filter((key): key is string => Boolean(key));
    await deleteFilesFromS3(keys);
    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined;
  } while (continuationToken);
};

/**
 * Deletes all images of a product knowing only its type and id — everything
 * under `products/<type>/<productId>/` (also sweeps any orphaned partial uploads).
 */
export const deleteProductImages = async (
  productType: ProductType,
  productId: string
): Promise<void> => {
  await deleteByPrefix(`products/${productType}/${productId}/`);
};
