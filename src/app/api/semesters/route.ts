import { NextRequest, NextResponse } from 'next/server';
import { routeErrorHandler } from '@/lib/utils';
import { createCredential } from '@/lib/login';
import { getSemesters } from '@/lib/eams';

export async function POST(req: NextRequest) {
  try {
    const semesters = await getSemesters(createCredential(req));
    return NextResponse.json({ isSuccess: true, message: semesters });
  } catch (err: any) {
    return routeErrorHandler(err);
  }
}
