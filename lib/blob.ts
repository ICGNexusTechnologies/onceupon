import { put } from "@vercel/blob";

const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Upload a print-ready PDF to Vercel Blob and return its public URL.
 *
 * The Gelato print file is ~19MB — too large for Cloudinary's free-tier raw
 * upload cap (10MB). Vercel Blob has no per-file size limit and a generous free
 * allowance, so the big print file lives here while images + the customer
 * download PDF stay on Cloudinary.
 */
export async function uploadPrintPdf(buffer: Buffer, name: string): Promise<string> {
  if (!blobConfigured) {
    throw new Error(
      "Vercel Blob is required for print-file storage. Create a Blob store in the Vercel dashboard (Storage → Create → Blob) to provision BLOB_READ_WRITE_TOKEN."
    );
  }

  const key = name.endsWith(".pdf") ? name : `${name}.pdf`;
  const { url } = await put(`print/${key}`, buffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return url;
}
