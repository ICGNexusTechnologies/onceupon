import { v2 as cloudinary } from "cloudinary";

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Store an image permanently in Cloudinary when configured. During local
 * testing, fall back to the provider URL so successful generations are still
 * attached to the book instead of being discarded.
 */
export async function uploadImage(src: string, publicId: string): Promise<string> {
  if (!cloudinaryConfigured) {
    console.warn("Cloudinary is not configured; using the temporary fal.ai image URL.");
    return src;
  }

  const res = await cloudinary.uploader.upload(src, {
    public_id: publicId,
    folder: "once-upon",
    overwrite: true,
    resource_type: "image",
  });
  return res.secure_url;
}

/** Upload a PDF buffer; returns the secure URL. */
export async function uploadPdf(buffer: Buffer, publicId: string): Promise<string> {
  if (!cloudinaryConfigured) {
    throw new Error(
      "Cloudinary is required for PDF storage. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId.endsWith(".pdf") ? publicId : `${publicId}.pdf`,
        folder: "once-upon/pdfs",
        resource_type: "raw",
        overwrite: true,
      },
      (err, result) => (err || !result ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

/** Create a short-lived signed URL for a raw PDF that public delivery may block. */
export function getPrivatePdfDownloadUrl(pdfUrl: string): string {
  if (!cloudinaryConfigured) throw new Error("Cloudinary is not configured");

  const pathname = new URL(pdfUrl).pathname;
  const marker = "/raw/upload/";
  const uploadIndex = pathname.indexOf(marker);
  if (uploadIndex === -1) throw new Error("Invalid Cloudinary PDF URL");

  const afterUpload = pathname.slice(uploadIndex + marker.length);
  const publicId = decodeURIComponent(afterUpload.replace(/^v\d+\//, ""));
  return cloudinary.utils.private_download_url(publicId, "", {
    resource_type: "raw",
    type: "upload",
    attachment: true,
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
  });
}
