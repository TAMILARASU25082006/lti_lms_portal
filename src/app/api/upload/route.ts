import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { generateUploadSignature, validateFileTypeAndSize } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { fileName, fileSize, purpose = 'assignment_submission' } = body;

    if (!fileName || !fileSize) {
      return NextResponse.json({ error: 'fileName and fileSize are required' }, { status: 400 });
    }

    // Role-based folder and validation
    let folder = `company_academy/${purpose}`;
    let maxMB = 25;
    let allowedExts = ['pdf', 'doc', 'docx', 'zip', 'png', 'jpg', 'jpeg'];

    if (purpose === 'lesson_video' || purpose === 'course_media') {
      if (user.role !== 'TUTOR' && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only tutors and admins can upload course lesson materials' }, { status: 403 });
      }
      maxMB = 100; // 100MB for media
      allowedExts = ['mp4', 'webm', 'mov', 'pdf', 'zip', 'png', 'jpg'];
    }

    const validation = validateFileTypeAndSize(fileName, fileSize, allowedExts, maxMB);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          configured: false,
          error:
            'Cloudinary is not yet configured on this environment. Please provide CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local to enable real media storage.',
        },
        { status: 503 }
      );
    }

    const signData = generateUploadSignature(folder);

    return NextResponse.json({
      configured: true,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      ...signData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication required' }, { status: 401 });
  }
}
