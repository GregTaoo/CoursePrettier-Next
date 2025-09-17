import { NextRequest, NextResponse } from 'next/server';
import { emptyCredential, login } from '@/lib/backend/login';
import { encodeBase64Cookies, routeErrorHandler } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const studentId = body.studentId;
  const password = body.password;

  // 校验 studentId
  if (!/^\d+$/.test(studentId)) {
    return NextResponse.json({ isSuccess: false, message: 'Invalid StudentID' });
  }

  try {
    const cred = await login(emptyCredential(studentId), password);

    if (cred.isLogin) {
      const res = NextResponse.json({ isSuccess: true });
      res.cookies.set('STUDENT_ID', studentId, { maxAge: 60 * 60 * 24 * 90 });
      res.cookies.set('LOGIN_SESSION', encodeBase64Cookies(cred.cookies), {
        maxAge: 60 * 60 * 24 * 90,
      });
      return res;
    }

    return NextResponse.json({ isSuccess: false, message: 'Login failed' });
  } catch (err: any) {
    return routeErrorHandler(err);
  }
}
