import { NextRequest, NextResponse } from 'next/server';
import { routeErrorHandler } from '@/lib/utils';
import { createCredential } from '@/lib/login';
import { getTermBegin } from '@/lib/eams';

export interface StartDateParams {
  year: string;
  semester: string;
}

export async function POST(req: NextRequest) {
  try {
    const params: StartDateParams = await req.json();
    const date = await getTermBegin(
      createCredential(req),
      params.year,
      params.semester,
    );
    return NextResponse.json({ isSuccess: true, message: date });
  } catch (err: any) {
    return routeErrorHandler(err);
  }
}
