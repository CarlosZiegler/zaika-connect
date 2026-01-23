export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface UploadResult {
  key: string;
  url?: string;
  size: number;
  contentType?: string;
}

export interface DownloadResult {
  data: Uint8Array;
  contentType?: string;
  size: number;
}

export interface PresignOptions {
  expiresIn: number;
  method?: "GET" | "PUT" | "DELETE";
  contentType?: string;
}

export interface ListOptions {
  prefix?: string;
  limit?: number;
  startAfter?: string;
}

export interface ListResult {
  files: Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag?: string;
    contentType?: string;
  }>;
  isTruncated: boolean;
  nextMarker?: string;
}
