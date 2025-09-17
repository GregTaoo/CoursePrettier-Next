import {ApiResponse, SessionExpiredError} from '@/lib/types';
import axios, { AxiosResponse } from 'axios';
import {NextResponse} from "next/server";

const HEADERS = {
  'User-Agent': `Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164`,
};

function mergeCookies(oldCookies: string[], setCookieHeaders: string[]): string[] {
  const cookieMap: Record<string, string> = {};

  for (const cookie of oldCookies) {
    const [key, value] = cookie.split('=');
    cookieMap[key.trim()] = value.trim();
  }

  for (const setCookie of setCookieHeaders) {
    const [cookie] = setCookie.split(';');
    const [key, value] = cookie.split('=');
    cookieMap[key.trim()] = value.trim();
  }

  return Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`);
}

export async function get(
  url: string,
  cookies: string[],
  redirectTimes: number = 4
): Promise<ApiResponse> {
  const cookieHeader = cookies.join('; ');

  const res: AxiosResponse = await axios.get(url, {
    maxRedirects: 0,
    validateStatus: (status) => status < 400 || status === 302,
    headers: {
      ...HEADERS,
      Cookie: cookieHeader,
    },
  });

  const setCookieHeader = res.headers['set-cookie'] || [];
  const updatedCookies = mergeCookies(cookies, setCookieHeader);

  if (res.status === 302) {
    if (redirectTimes <= 0) {
      throw new Error(`Too many redirects: ${url}`);
    }

    const location = res.headers.location;
    if (!location) {
      throw new Error(`302 without Location header: ${url}`);
    }

    console.log(`[302 REDIRECT] ${url} -> ${location}`);
    return await get(location, updatedCookies, redirectTimes - 1);
  }

  console.log(`[${res.status} GET] ${url}`);
  return {
    data: res.data,
    cookies: updatedCookies,
  };
}

export async function post(url: string, data: any, cookies: string[], redirectTimes: number = 4): Promise<ApiResponse> {
  const cookieHeader = cookies.join('; ');

  const res: AxiosResponse = await axios.post(url, data, {
    maxRedirects: 0,
    validateStatus: (status) => status < 400 || status === 302,
    headers: {
      ...HEADERS,
      Cookie: cookieHeader,
      'Content-Type': 'application/json',
    },
  });

  const setCookieHeader = res.headers['set-cookie'] || [];
  const updatedCookies = mergeCookies(cookies, setCookieHeader);

  if (res.status === 302) {
    if (redirectTimes <= 0) {
      throw new Error(`Too many redirects: ${url}`);
    }

    const location = res.headers.location;
    if (!location) {
      throw new Error(`302 without Location header: ${url}`);
    }

    console.log(`[302 REDIRECT POST] ${url} -> ${location}`);
    return await post(location, data, updatedCookies, redirectTimes - 1);
  }

  console.log(`[${res.status} POST] ${url}: ${res.data}`);
  return {
    data: res.data,
    cookies: updatedCookies,
  };
}

export async function postForm(url: string, data: any, cookies: string[], redirectTimes: number = 4): Promise<ApiResponse> {
  const cookieHeader = cookies.join('; ');

  const res: AxiosResponse = await axios.post(
    url,
    new URLSearchParams(data as Record<string, string>).toString(),
    {
      maxRedirects: 0,
      validateStatus: (status) => status < 400 || status === 302,
      headers: {
        ...HEADERS,
        Cookie: cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  const setCookieHeader = res.headers['set-cookie'] || [];
  const updatedCookies = mergeCookies(cookies, setCookieHeader);

  if (res.status === 302) {
    if (redirectTimes <= 0) {
      throw new Error(`Too many redirects: ${url}`);
    }

    const location = res.headers.location;
    if (!location) {
      throw new Error(`302 without Location header: ${url}`);
    }

    console.log(`[302 REDIRECT POST FORM] ${url} -> ${location}`);
    return await postForm(location, data, updatedCookies, redirectTimes - 1);
  }

  console.log(`[${res.status} POST FORM] ${url}: ${res.data}`);
  return {
    data: res.data,
    cookies: updatedCookies,
  };
}

export function encodeBase64Cookies(cookies: string[]): string {
  const str = cookies.join('; ');
  return Buffer.from(str, 'utf-8').toString('base64');
}

export function decodeBase64Cookies(encoded: string): string[] {
  const str = Buffer.from(encoded, 'base64').toString('utf-8');
  return str
    .split('; ')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function routeErrorHandler(err: any): NextResponse {
  if (err instanceof SessionExpiredError) {
    return NextResponse.json({ isSuccess: false, message: 'Session expired' });
  }
  console.error(err);
  return NextResponse.json({ isSuccess: false, message: 'Internal server error' });
}
import CryptoJS from "crypto-js";

const AES_CHARS: string = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
const AES_CHARS_LEN: number = AES_CHARS.length;

function randomString(len: number): string {
  let retStr: string = "";
  for (let i = 0; i < len; i++) {
    retStr += AES_CHARS.charAt(Math.floor(Math.random() * AES_CHARS_LEN));
  }
  return retStr;
}

function getAesString(data: string, key0: string, iv0: string): string {
  key0 = key0.replace(/(^\s+)|(\s+$)/g, "");

  const key = CryptoJS.enc.Utf8.parse(key0);
  const iv = CryptoJS.enc.Utf8.parse(iv0);

  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
}

export function encodePassword(pwd0: string, key: string): string {
  try {
    const iv = randomString(16);
    const combinedPassword = randomString(64) + pwd0;
    return getAesString(combinedPassword, key, iv);
  } catch (e) {
    console.error("Error encrypting password:", e);
  }
  return pwd0;
}
