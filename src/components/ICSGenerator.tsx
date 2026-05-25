import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { getTermBegin } from '@/lib/frontend/client';
import { Loader2 } from 'lucide-react';

type StructuredLocation = {
  keyword: string;
  title: string;
  latitude: number;
  longitude: number;
};

interface ICSGeneratorProps {
  externalOpen: boolean;
  setExternalOpen: (open: boolean) => void;
  courseData: any;
  year: string | number;
  semester: string | number;
}

const STRUCTURED_LOCATIONS: StructuredLocation[] = [
  { keyword: '信息学院', title: '上海科技大学信息科学与技术学院', latitude: 31.18043, longitude: 121.5907 },
  { keyword: '创管学院', title: '上海科技大学创业与管理学院', latitude: 31.17872, longitude: 121.59061 },
  { keyword: '生命学院', title: '上海科技大学生命科学与技术学院', latitude: 31.1818, longitude: 121.59018 },
  { keyword: '物质学院', title: '上海科技大学物质科学与技术学院', latitude: 31.17894, longitude: 121.58821 },
  { keyword: '教学中心', title: '上海科技大学教学中心', latitude: 31.17772, longitude: 121.59093 },
  { keyword: '创艺学院', title: '上海科技大学创意与艺术学院', latitude: 31.17887, longitude: 121.58887 },
  { keyword: '生医工学院', title: '上海科技大学生物医学工程学院', latitude: 31.17997, longitude: 121.59122 },
];

const STRUCTURED_LOCATION_ADDRESS = '上海市浦东新区中科路1号';

export default function ICSGenerator({
                                       externalOpen,
                                       setExternalOpen,
                                       courseData,
                                       year,
                                       semester,
                                     }: ICSGeneratorProps) {

  const parseTimeFormat = (time: string) => {
    let [hour, minute] = time.split(':');
    hour = hour.padStart(2, '0');
    minute = minute.padStart(2, '0');
    return `${hour}${minute}`;
  };

  const getStructuredLocation = (classroom: string) => {
    return STRUCTURED_LOCATIONS.find((candidate) => classroom.includes(candidate.keyword));
  };

  const generateIcal = async () => {
    if (!courseData || !courseData.periods) return;

    const dateResp = await getTermBegin(year, semester);
    const date = new Date(dateResp.message + 'T00:00:00+08:00');

    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 调整到周一
    date.setDate(date.getDate() + diff);
    const firstMonday0 = date.getTime();

    let icsData = `BEGIN:VCALENDAR
VERSION:2.0
X-WR-CALNAME:课表
X-WR-TIMEZONE:Asia/Shanghai
`;

    const periodsData: Record<number, { start: string; end: string }> = {};
    Object.entries(courseData.periods).forEach(([index, timeObj]: any) => {
      const time = timeObj[index];
      periodsData[parseInt(index) + 1] = {
        start: time.split('-')[0],
        end: time.split('-')[1],
      };
    });

    courseData.courses.forEach((course: any) => {
      for (let i = 1; i <= 18; i++) {
        if (course.weeks[i] === '1') {
          const monday0 = firstMonday0 + (i - 1) * 7 * 24 * 60 * 60 * 1000;
          Object.entries(course.times).forEach(([day, periods]: [string, string] & any) => {
            const dateObj = new Date(monday0 + (parseInt(day) - 1) * 24 * 60 * 60 * 1000);
            const dateString =
              dateObj.getFullYear().toString() +
              String(dateObj.getMonth() + 1).padStart(2, '0') +
              String(dateObj.getDate()).padStart(2, '0');

            const periodsList = periods.split(',');
            const start = parseTimeFormat(periodsData[parseInt(periodsList[0])].start);
            const end = parseTimeFormat(periodsData[parseInt(periodsList[periodsList.length - 1])].end);
            const classroom = course.classroom ?? '';
            const structuredLocation = getStructuredLocation(classroom);
            const structuredLocationFields = structuredLocation
              ? `GEO:${structuredLocation.latitude};${structuredLocation.longitude}
X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-ADDRESS="${STRUCTURED_LOCATION_ADDRESS}";X-APPLE-RADIUS=200;X-TITLE="${structuredLocation.title}":geo:${structuredLocation.latitude},${structuredLocation.longitude}`
              : '';

            icsData += `BEGIN:VEVENT
UID:${dateString}-${start}-${end}-${course.name.length}-${course.classroom.length}-${i}
DTSTART:${dateString}T${start}00
DTEND:${dateString}T${end}00
SUMMARY:${course.name}
LOCATION-TYPE:SCHOOL
LOCATION:${classroom} 上海科技大学
${structuredLocationFields}
DESCRIPTION:${course.teachers}
SEQUENCE:0
END:VEVENT
`;
          });
        }
      }
    });

    icsData += `END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_table.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExternalOpen(false);
  };

  useEffect(() => {
    if (externalOpen) {
      generateIcal();
    }
  }, [externalOpen]);

  return (
    <Dialog open={externalOpen} onOpenChange={setExternalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>正在导出 iCal 日程</DialogTitle>
          <DialogDescription>
            正在生成课程表文件，请稍候...
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
