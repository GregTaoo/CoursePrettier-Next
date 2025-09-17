import crypto from 'crypto';
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

export async function get(url: string, cookies: string[]): Promise<ApiResponse> {
  const cookieHeader = cookies.join('; ');

  const res: AxiosResponse = await axios.get(url, {
    headers: {
      ...HEADERS,
      Cookie: cookieHeader,
    },
  });

  const setCookieHeader = res.headers['set-cookie'] || [];
  const updatedCookies = mergeCookies(cookies, setCookieHeader);

  return {
    data: res.data,
    cookies: updatedCookies,
  };
}

export async function post(url: string, data: any, cookies: string[]): Promise<ApiResponse> {
  const cookieHeader = cookies.join('; ');

  const res: AxiosResponse = await axios.post(url, data, {
    headers: {
      ...HEADERS,
      Cookie: cookieHeader,
      'Content-Type': 'application/json',
    },
  });

  const setCookieHeader = res.headers['set-cookie'] || [];
  const updatedCookies = mergeCookies(cookies, setCookieHeader);

  return {
    data: res.data,
    cookies: updatedCookies,
  };
}

export async function postForm(url: string, data: any, cookies: string[]): Promise<ApiResponse> {
  const cookieHeader = cookies.join('; ');

  const res: AxiosResponse = await axios.post(
    url,
    new URLSearchParams(data as Record<string, string>).toString(),
    {
      headers: {
        ...HEADERS,
        Cookie: cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  const setCookieHeader = res.headers['set-cookie'] || [];
  const updatedCookies = mergeCookies(cookies, setCookieHeader);

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
const aesChars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
const aesCharsLen = aesChars.length;

export function randomString(len: number): string {
  let ret = "";
  for (let i = 0; i < len; i++) {
    ret += aesChars.charAt(Math.floor(Math.random() * aesCharsLen));
  }
  return ret;
}

function getAesString(data: string, keyStr: string, ivStr: string): string {
  const key = CryptoJS.enc.Utf8.parse(keyStr.trim());
  const iv = CryptoJS.enc.Utf8.parse(ivStr);
  return CryptoJS.AES.encrypt(data, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString();
}

export function encryptAES(data: string, key?: string): string {
  if (!key) return data;
  const iv = randomString(16);
  return getAesString(randomString(64) + data, key, iv);
}

export function encodePassword(pwd: string, key?: string): string {
  try {
    return encryptAES(pwd, key);
  } catch (e) {
    console.log(e)
    return pwd;
  }
}
