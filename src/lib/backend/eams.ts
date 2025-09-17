import * as cheerio from 'cheerio';
import { get, postForm } from '@/lib/utils';
import {
  ApiResponse,
  Course,
  CoursePeriod,
  CourseTable,
  CredentialState,
  Semesters,
  SessionExpiredError,
} from '@/lib/types';

export async function getSemesters(cred: CredentialState): Promise<{
  semesters: Semesters;
  defaultSemester: string;
  tableId: string;
}> {
  const res1: ApiResponse = await get(
    'https://eams.shanghaitech.edu.cn/eams/courseTableForStd.action',
    cred.cookies,
  );
  const data1: string = res1.data;

  if (data1.includes('统一身份认证')) {
    throw new SessionExpiredError();
  }

  // mystery_id
  const mysteryId = data1.split('"></div>')[0].slice(-11);

  // 默认学期
  const defaultMatch = data1.match(/\{empty:"false",value:"(\d+)"},"searchTable\(\)"\);/);
  if (!defaultMatch) throw new Error('Default semester not found');
  const defaultSemester = defaultMatch[1];

  // table_id
  const $ = cheerio.load(data1);
  const tableId = $('#courseTable').attr('id') || '';

  // 第二次 POST 获取学期列表
  const res2: ApiResponse = await postForm(
    'https://eams.shanghaitech.edu.cn/eams/dataQuery.action',
    {
      tagId: `semesterBar${mysteryId}Semester`,
      dataType: 'semesterCalendar',
      value: 6,
      empty: false,
    },
    res1.cookies,
  );
  const data2: string = res2.data;

  // 匹配所有学期
  const matches = [...data2.matchAll(/\{id:(\d+),schoolYear:"(\d+-\d+)",name:"(.*?)"}/g)];
  const semesters: Semesters = {};

  for (const m of matches) {
    const [id, year, name] = m.slice(1);
    if (!semesters[year]) semesters[year] = {};
    semesters[year][name] = id;
  }

  return { semesters, defaultSemester, tableId };
}

export async function getCourseTable(
  cred: CredentialState,
  semesterId: string,
  tableId?: string,
  startWeek?: number,
): Promise<CourseTable> {
  if (!tableId) {
    const res1: ApiResponse = await get(
      'https://eams.shanghaitech.edu.cn/eams/courseTableForStd.action',
      cred.cookies,
    );
    const data1: string = res1.data;

    if (data1.includes('统一身份认证')) throw new SessionExpiredError();

    const $ = cheerio.load(data1);
    const scriptTags = $('script');

    for (let i = 0; i < scriptTags.length; i++) {
      const text = $(scriptTags[i]).text();
      const match = text.match(/bg\.form\.addInput\(form,"ids","(\d+)"\)/);
      if (match) {
        tableId = match[1];
        break;
      }
    }
  }

  if (!tableId)
    throw new Error('tableId not found');

  const res2: ApiResponse = await postForm(
    `https://eams.shanghaitech.edu.cn/eams/courseTableForStd!courseTable.action?ignoreHead=1&setting.kind=std&startWeek=${startWeek ?? ''}&semester.id=${semesterId}&ids=${tableId}&tutorRedirectstudentId=${tableId}`,
    {},
    cred.cookies,
  );
  const data2: string = res2.data;

  if (data2.includes('统一身份认证'))
    throw new SessionExpiredError();

  // 解析课时段
  const [periodString, ...courseStrings] = data2.split('var teachers');
  const periodMatches = [
    ...periodString.matchAll(/<br>\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*<\/font>/g),
  ];
  const periods: CoursePeriod[] = periodMatches.map((m, i) => ({ [i]: `${m[1]}-${m[2]}` }));

  const courses: Course[] = courseStrings.map((courseStr) => {
    const match0 = courseStr.match(
      /\),"[0-9A-Za-z().]+","(.*?\([0-9A-Za-z().]+\))","[\d,-]+","(.*?)","([01]+)",/,
    );
    const match1 = [...courseStr.matchAll(/index =(\d+)\*unitCount\+(\d+);/g)];
    const match2 = courseStr.match(/var actTeachers = \[([\s\S]*?)];/);

    const teachers = match2
      ? [...match2[1].matchAll(/name:"([^"]+)"/g)].map((m) => m[1]).join(',')
      : '';

    const timesDict: Record<number, string[]> = {};
    for (const m of match1) {
      const weekday = parseInt(m[1]) + 1;
      const clazz = parseInt(m[2]) + 1;
      if (!timesDict[weekday]) timesDict[weekday] = [];
      timesDict[weekday].push(clazz.toString());
    }

    const times: Record<number, string> = {};
    for (const k in timesDict) times[parseInt(k)] = timesDict[parseInt(k)].join(',');

    return {
      name: match0?.[1] ?? '',
      classroom: match0?.[2] ?? '',
      teachers,
      weeks: match0?.[3] ?? '',
      times,
    };
  });

  return { periods, courses };
}

export async function getTermBegin(
  cred: CredentialState,
  year: string,
  semester: string,
): Promise<string> {
  const res: ApiResponse = await get(
    `https://egate.shanghaitech.edu.cn/publicapp/sys/mykbxt/api/getSchoolCalendar.do?termJump=prev&schoolYearTerm=${year}-${parseInt(semester) + 1}`,
    cred.cookies,
  );

  if (typeof res.data !== 'object') throw new SessionExpiredError();

  return res.data?.['termBegin'];
}
