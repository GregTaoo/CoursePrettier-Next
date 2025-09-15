import { NextRequest, NextResponse } from 'next/server';
import { routeErrorHandler } from '@/lib/utils';
import { createCredential, logout } from '@/lib/login';

export async function POST(req: NextRequest) {
  try {
    await logout(createCredential(req));
    const res = NextResponse.json({ isSuccess: true });
    res.cookies.set('STUDENT_ID', '', { maxAge: 0 });
    res.cookies.set('LOGIN_SESSION', '', { maxAge: 0 });
    return res;
  } catch (err: any) {
    routeErrorHandler(err);
  }
}
