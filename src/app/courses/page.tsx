'use client'

import { ReactNode, useEffect, useState } from 'react';
import ICSGenerator from "@/components/ICSGenerator";
import CourseTable from "@/components/CourseTable";
import { getSemesters, getCourseTable, logout } from "@/lib/frontend/client";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import ContentPreview from '@/components/ContentPreview';

export default function CourseTablePage() {
  const [semesters, setSemesters] = useState(new Map());
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [courseTable, setCourseTable] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewModalContent, setPreviewModalContent] = useState<null | string | ReactNode>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const router = useRouter();

  // Check authentication and fetch semesters
  useEffect(() => {
    const cookies = document.cookie;
    const loginSession = cookies.split(";").some(c => c.trim().startsWith("LOGIN_SESSION="));
    const studentId = cookies.split(";").some(c => c.trim().startsWith("STUDENT_ID="));

    if (!loginSession || !studentId) {
      router.push("/");
      return;
    }

    const fetchSemesters = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getSemesters();
        if (response.isSuccess) {
          const semesterData = response.message.semesters;
          const semestersMap = new Map<string, { year: string; term: number }>();

          Object.keys(semesterData).forEach((year) => {
            Object.entries(semesterData[year]).forEach(([term, id]) => {
              semestersMap.set(id as string, { year: String(year), term: Number(term) });
            });
          });
          setSemesters(semestersMap);

          const defaultSemester = response.message.defaultSemester;
          await handleSemesterChange(defaultSemester);
        } else if (response.message === "Session expired") {
          setError("登录失效，请重新登录");
          await handleLogout();
        } else {
          setError("获取学期数据失败: " + response.message);
        }
      } catch (err) {
        console.error(err);
        setError("获取学期数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchSemesters().catch(() => setError("获取学期数据失败"));
  }, []);

  const handleLogout = async () => {
    try {
      const response = await logout();
      if (response.isSuccess) {
        router.push("/");
      } else {
        setError("登出失败: " + response.message);
      }
    } catch (err) {
      setError("登出失败");
    }
  };

  const handleSemesterChange = async (id: string) => {
    setSelectedSemesterId(id);
    setLoading(true);
    setError("");

    try {
      const courses = await getCourseTable(id);
      if (courses.isSuccess) {
        setCourseData(courses.message);
        setCourseTable(generateTableData(courses.message));
      } else if (courses.message === "Session expired") {
        setError("登录失效，请重新登录");
        handleLogout();
      } else {
        setError("获取课程表失败: " + courses.message);
      }
    } catch (err) {
      console.error(err);
      setError("获取课程表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const item = Array.from(semesters).reverse().find(([semesterId]) => semesterId === selectedSemesterId);
      if (item) {
        const { year, term } = item[1];
        setCurrentYear(parseInt(year));
        setCurrentSemester(term);
      }
    } catch {}
  }, [selectedSemesterId, semesters]);

  const generateTableData = (data: any) => {
    const table: any[] = [];
    if (!data?.periods) return table;

    const periodsData = data.periods;
    for (let i = 1; i <= periodsData.length; i++) {
      table.push({
        key: i,
        time: `第 ${i} 节`,
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: ""
      });
    }

    data.courses.forEach((course: any) => {
      const { weeks, times, name, teachers, classroom } = course;
      const segments: { start: number; end: number }[] = [];
      for (const match of weeks.matchAll(/1+/g)) {
        const start = match.index!;
        const end = start + match[0].length - 1;
        segments.push({ start: start, end: end });
      }

      segments.forEach(({ start, end }) => {
        Object.entries(times).forEach(([day, periods]: [string, string] & any) => {
          periods.split(",").forEach((periodStr: string) => {
            const period = Number(periodStr);
            const cell = table[period - 1][day] || { key: "", name: "", weeks: [] };
            if (!cell.key) {
              table[period - 1][day] = {
                key: name + classroom + teachers + day,
                name,
                weeks: [{ minWeek: start, maxWeek: end, classroom, teachers }]
              };
            } else {
              cell.weeks.push({ minWeek: start, maxWeek: end, classroom, teachers });
            }
          });
        });
      });
    });

    table.forEach((entry) => {
      for (let i = 1; i <= 7; i++) {
        if (entry[i]?.weeks) {
          entry[i].weeks.sort((a: any, b: any) => a.minWeek - b.minWeek);
        }
      }
    });

    return table;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {error && (
        <Alert className="mb-6" variant="destructive">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">选择学期</label>
              <Select
                disabled={loading}
                value={selectedSemesterId || undefined}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger className="w-[250px] hover:cursor-pointer">
                  <SelectValue placeholder="选择学期" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(semesters)
                    .reverse()
                    .map(([id, { year, term }]) => (
                      <SelectItem key={id} value={id} className="hover:cursor-pointer">
                        {year} 学年, 第 {term} 学期
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setModalOpen(true)}
                disabled={loading || !courseData}
                className="flex items-center gap-2 hover:cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
                导出 iCal 日程
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                登出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 96 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
        </Card>
      ) : courseData ? (
        <CourseTable
          courseTable={courseTable}
          periodsData={courseData.periods}
          setPreviewModalContent={(content) => {
            setPreviewModalContent(content);
            setPreviewModalOpen(true);
          }}
        />
      ) : null}

      <ICSGenerator
        externalOpen={modalOpen}
        setExternalOpen={setModalOpen}
        courseData={courseData}
        year={currentYear}
        semester={currentSemester}
      />
      <ContentPreview
        externalOpen={previewModalOpen}
        setExternalOpen={setPreviewModalOpen}
        data={previewModalContent}
      />
    </div>
  );
}
