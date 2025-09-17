import { NextRequest, NextResponse } from 'next/server';
import { routeErrorHandler } from '@/lib/utils';
import { createCredential } from '@/lib/backend/login';
import { getCourseTable } from '@/lib/backend/eams';

export interface CourseTableParams {
  semester_id: string;
  table_id?: string;
  start_week?: number;
}

export async function POST(req: NextRequest) {
  try {
    const params: CourseTableParams = await req.json();
    const table = await getCourseTable(
      createCredential(req),
      params.semester_id,
      params.table_id,
      params.start_week,
    );
    return NextResponse.json({ isSuccess: true, message: table });
  } catch (err: any) {
    return routeErrorHandler(err);
  }
}
