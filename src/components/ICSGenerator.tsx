"use client";

import { useEffect } from "react";
import { Modal, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { getTermBegin } from '@/lib/frontend/client';

interface ICSGeneratorProps {
  externalOpen: boolean;
  setExternalOpen: (open: boolean) => void;
  courseData: any;
  year: string | number;
  semester: string | number;
}

export default function ICSGenerator({ externalOpen, setExternalOpen, courseData, year, semester }: ICSGeneratorProps) {

  const parseTimeFormat = (time: string) => {
    let [hour, minute] = time.split(":");
    hour = hour.padStart(2, "0");
    minute = minute.padStart(2, "0");
    return `${hour}${minute}`;
  };

  const generateIcal = async () => {
    if (!courseData || !courseData.periods) return;

    const dateResp = await getTermBegin(year, semester);
    const date = new Date(dateResp.message + "T00:00:00+08:00");

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
        start: time.split("-")[0],
        end: time.split("-")[1],
      };
    });

    courseData.courses.forEach((course: any) => {
      for (let i = 1; i <= 18; i++) {
        if (course.weeks[i] === "1") {
          const monday0 = firstMonday0 + (i - 1) * 7 * 24 * 60 * 60 * 1000;
          // @ts-ignore
          Object.entries(course.times).forEach(([day, periods]: [string, string]) => {
            const dateObj = new Date(monday0 + (parseInt(day) - 1) * 24 * 60 * 60 * 1000);
            const dateString =
              dateObj.getFullYear().toString() +
              String(dateObj.getMonth() + 1).padStart(2, "0") +
              String(dateObj.getDate()).padStart(2, "0");

            const periodsList = periods.split(",");
            const start = parseTimeFormat(periodsData[parseInt(periodsList[0])].start);
            const end = parseTimeFormat(periodsData[parseInt(periodsList[periodsList.length - 1])].end);

            icsData += `BEGIN:VEVENT
UID:${dateString}-${start}-${end}-${course.name.length}-${course.classroom.length}-${i}
DTSTART:${dateString}T${start}00
DTEND:${dateString}T${end}00
SUMMARY:${course.name}
LOCATION:${course.classroom}
DESCRIPTION:${course.teachers}
SEQUENCE:0
END:VEVENT\n`;
          });
        }
      }
    });

    icsData += `END:VCALENDAR`;

    const blob = new Blob([icsData], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "course_table.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setExternalOpen(false);
  };

  useEffect(() => {
    if (externalOpen) generateIcal();
  }, [externalOpen]);

  return (
    <Modal
      title="正在导出 iCal 日程"
      open={externalOpen}
      onCancel={() => setExternalOpen(false)}
      footer={null}
    >
      <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
    </Modal>
  );
}
