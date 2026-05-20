import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { MealImageSummary } from "@logmyplate/domain";
import type { ApiConfig } from "../config.js";

export type UploadMealImageInput = {
  profileId: string;
  mealId: string;
  bytes: Buffer;
  mimeType: MealImageSummary["mimeType"];
};

export type UploadScanImageInput = {
  profileId: string;
  scanId: string;
  bytes: Buffer;
  mimeType: MealImageSummary["mimeType"];
};

export type StoredMealImage = Omit<MealImageSummary, "imageId" | "createdAt">;

export interface MealImageStorage {
  readonly enabled: boolean;
  uploadMealImage(input: UploadMealImageInput): Promise<StoredMealImage>;
  uploadScanImage(input: UploadScanImageInput): Promise<StoredMealImage>;
  createSignedReadUrl(image: MealImageSummary): Promise<string | undefined>;
  deleteMealImage(image: MealImageSummary): Promise<void>;
}

export class DisabledMealImageStorage implements MealImageStorage {
  readonly enabled = false;

  async uploadMealImage(): Promise<StoredMealImage> {
    throw new Error("Meal image storage is not configured.");
  }

  async uploadScanImage(): Promise<StoredMealImage> {
    throw new Error("Meal image storage is not configured.");
  }

  async createSignedReadUrl(): Promise<string | undefined> {
    return undefined;
  }

  async deleteMealImage(): Promise<void> {
    throw new Error("Meal image storage is not configured.");
  }
}

export class S3MealImageStorage implements MealImageStorage {
  readonly enabled = true;
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    config: {
      endpoint: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
    },
  ) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadMealImage(input: UploadMealImageInput): Promise<StoredMealImage> {
    const objectKey = mealImageObjectKey(input);
    await this.uploadImageObject(objectKey, input.bytes, input.mimeType);

    return {
      bucket: this.bucket,
      objectKey,
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
    };
  }

  async uploadScanImage(input: UploadScanImageInput): Promise<StoredMealImage> {
    const objectKey = scanImageObjectKey(input);
    await this.uploadImageObject(objectKey, input.bytes, input.mimeType);

    return {
      bucket: this.bucket,
      objectKey,
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
    };
  }

  async createSignedReadUrl(image: MealImageSummary): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: image.bucket,
        Key: image.objectKey,
      }),
      { expiresIn: 60 * 60 },
    );
  }

  async deleteMealImage(image: MealImageSummary): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: image.bucket,
        Key: image.objectKey,
      }),
    );
  }

  private async uploadImageObject(
    objectKey: string,
    bytes: Buffer,
    mimeType: MealImageSummary["mimeType"],
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: bytes,
        ContentType: mimeType,
        CacheControl: "private, max-age=31536000, immutable",
      }),
    );
  }
}

export const createMealImageStorage = (config: ApiConfig): MealImageStorage => {
  const { s3Endpoint, s3Region, s3AccessKeyId, s3SecretAccessKey, mealImagesBucket } =
    config.storage;
  if (!s3Endpoint || !s3Region || !s3AccessKeyId || !s3SecretAccessKey) {
    return new DisabledMealImageStorage();
  }

  return new S3MealImageStorage(mealImagesBucket, {
    endpoint: s3Endpoint,
    region: s3Region,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
  });
};

const mealImageObjectKey = (input: UploadMealImageInput): string => {
  const extension =
    input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
  return `profiles/${input.profileId}/meals/${input.mealId}/original.${extension}`;
};

const scanImageObjectKey = (input: UploadScanImageInput): string => {
  const extension =
    input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
  return `profiles/${input.profileId}/scans/${input.scanId}/original.${extension}`;
};
