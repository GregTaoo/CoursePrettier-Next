export type ApiResponse<T = string> = {
  data: T;
  cookies: string[];
};

export type CredentialState = {
  studentId: string;
  cookies: string[];
  isLogin: boolean;
};

export type Semesters = Record<string, Record<string, string>>;

export interface CoursePeriod {
  [key: number]: string;
}

export interface Course {
  name: string;
  classroom: string;
  teachers: string;
  weeks: string;
  times: Record<number, string>;
}

export interface CourseTable {
  periods: CoursePeriod[];
  courses: Course[];
}

export class SessionExpiredError extends Error {}
