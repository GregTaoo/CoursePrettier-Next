import { get, encodePassword, decodeBase64Cookies, postForm } from './utils';
import * as cheerio from 'cheerio';
import { CredentialState, SessionExpiredError } from '@/lib/types';
import { NextRequest } from 'next/server';

export function emptyCredential(studentId: string): CredentialState {
  return {
    studentId,
    cookies: [],
    isLogin: false,
  };
}

export function createCredential(req: NextRequest): CredentialState {
  const studentId = req.cookies.get('STUDENT_ID')?.value;
  const encodedCookies = req.cookies.get('LOGIN_SESSION')?.value;

  if (!studentId || !encodedCookies) {
    throw new SessionExpiredError();
  }

  const cookies = encodedCookies ? decodeBase64Cookies(encodedCookies) : [];

  return {
    studentId,
    cookies,
    isLogin: true,
  };
}

/**
 * 从 login 页面提取加密盐和 login token
 */
export async function getLoginToken(
  state: CredentialState,
): Promise<{ salt: string; token: any; cookies: string[] }> {
  const { data, cookies } = await get(
    'https://ids.shanghaitech.edu.cn/authserver/login',
    state.cookies,
  );
  const $ = cheerio.load(data);
  const pwdLogin = $('#pwdLoginDiv').first();

  const salt = pwdLogin.find('#pwdEncryptSalt').val() as string;

  const token = {
    captcha: '',
    lt: pwdLogin.find('input[name="lt"]').val() as string,
    cllt: 'userNameLogin',
    dllt: pwdLogin.find('input[name="dllt"]').val() as string,
    execution: pwdLogin.find('input[name="execution"]').val() as string,
    eventId: pwdLogin.find('input[name="_eventId"]').val() as string,
  };

  return { salt, token, cookies };
}

/**
 * 使用密码登录
 */
export async function login(state: CredentialState, password: string): Promise<CredentialState> {
  const { salt, token, cookies } = await getLoginToken(state);
  const encodedPassword = encodePassword(password, salt);

  const data = {
    username: state.studentId,
    password: encodedPassword,
    captcha: token?.captcha || '',
    lt: token?.lt || '',
    cllt: token?.cllt || '',
    dllt: token?.dllt || '',
    execution: token?.execution || '',
    _eventId: token?.eventId || '',
  };

  const { cookies: newCookies } = await postForm(
    'https://ids.shanghaitech.edu.cn/authserver/login',
    data,
    cookies,
  );

  // 判断是否登录成功（CASTGC cookie 存在）
  const hasCastgc = newCookies.some((c: string) => c.startsWith('CASTGC'));

  return {
    ...state,
    cookies: newCookies,
    isLogin: hasCastgc,
  };
}

/**
 * 注销
 */
export async function logout(state: CredentialState): Promise<CredentialState> {
  if (state.isLogin) {
    await get('https://egate.shanghaitech.edu.cn/logout', state.cookies);
  }
  return {
    ...state,
    cookies: [],
    isLogin: false,
  };
}
