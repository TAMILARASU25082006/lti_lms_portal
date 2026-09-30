import crypto from 'crypto';

export interface CloudinarySignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export function generateUploadSignature(folder = 'company_academy'): CloudinarySignatureResult {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const timestamp = Math.round(new Date().getTime() / 1000);

  // String to sign: folder=xxx&timestamp=xxx
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  };
}

export function validateFileTypeAndSize(
  fileName: string,
  fileSize: number,
  allowedExtensions = ['pdf', 'doc', 'docx', 'zip', 'png', 'jpg', 'jpeg', 'mp4'],
  maxSizeMB = 25
): { valid: boolean; error?: string } {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: `File type .${ext} is not supported. Allowed: ${allowedExtensions.join(', ')}` };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (fileSize > maxBytes) {
    return { valid: false, error: `File size exceeds maximum permitted limit of ${maxSizeMB}MB.` };
  }

  return { valid: true };
}
