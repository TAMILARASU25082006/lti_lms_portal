import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { ContactEnquiry } from '@/models/ContactEnquiry';

const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(150),
  courseInterest: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || 'unknown';

    const enquiry = await ContactEnquiry.create({
      ...parsed.data,
      ipAddress,
      status: 'NEW',
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for reaching out. An academy admissions officer will contact you shortly.',
      enquiryId: enquiry._id,
    });
  } catch (error: any) {
    console.error('[Contact API Error]:', error);
    return NextResponse.json({ error: 'Failed to process inquiry. Please try again later.' }, { status: 500 });
  }
}
