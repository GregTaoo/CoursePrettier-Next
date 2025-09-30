import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarIcon, MapPinIcon, UserIcon } from 'lucide-react';

interface CourseSlot {
  key: string;
  name: string;
  weeks: Array<{
    minWeek: number;
    maxWeek: number;
    classroom: string;
    teachers: string;
  }>;
}

interface CourseTableProps {
  courseTable: any[];
  periodsData: string[][];
}

export default function CourseTable({ courseTable, periodsData }: CourseTableProps) {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // Calculate rowspan for each cell
  const calculateRowSpan = (periodIndex: number, dayIndex: number) => {
    const courseSlot = courseTable[periodIndex]?.[dayIndex + 1];
    if (!courseSlot || courseSlot === "" || typeof courseSlot === 'string') {
      return 1;
    }

    // Check if this is the first occurrence of this course
    if (periodIndex > 0 &&
      courseTable[periodIndex - 1]?.[dayIndex + 1]?.key === courseSlot.key) {
      return 0; // This cell should be hidden (part of merged cell above)
    }

    // Calculate how many periods this course spans
    let spanCount = 1;
    for (let i = periodIndex + 1; i < courseTable.length; i++) {
      if (courseTable[i]?.[dayIndex + 1]?.key === courseSlot.key) {
        spanCount++;
      } else {
        break;
      }
    }

    return spanCount;
  };

  const renderCourseContent = (courseSlot: CourseSlot | string) => {
    if (!courseSlot || courseSlot === "" || typeof courseSlot === 'string') {
      return null;
    }

    // Parse course name
    const originalName = courseSlot.name;
    const match = originalName ? originalName.match(/(.*)\(([\w.]+)\)/) : null;
    const name = match ? match[1].trim() : originalName;
    const code = match ? match[2].trim() : null;

    return (
      <div className="flex flex-col p-3 justify-items-start items-start">
        <div className="font-medium text-sm leading-tight text-foreground mb-1">
          {name}
        </div>
        {code && (
          <Badge variant="secondary" className="mb-2 max-w-fit">
            {code}
          </Badge>
        )}

        <div className="space-y-2 flex-1">
          {courseSlot.weeks.map((week, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                <span>
                  第{week.minWeek === week.maxWeek
                  ? week.minWeek
                  : `${week.minWeek}~${week.maxWeek}`}周
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{week.classroom}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{week.teachers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-3 overflow-auto">
      <table className="w-full border-collapse table-fixed min-w-[600px]">
        <thead>
          <tr>
            <th className="bg-muted p-3 border text-center text-sm align-center">
              时间
            </th>
            {days.map((day) => (
              <th key={day} className="bg-muted p-3 border text-center text-sm align-center">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
        {courseTable.map((row, periodIndex) => (
          <tr key={periodIndex}>
            {/* Time column */}
            <td className="bg-muted/50 p-3 border text-center text-sm align-center h-[80px]">
              <div className="font-medium">第 {periodIndex + 1} 节</div>
              <div className="text-xs text-muted-foreground mt-1">
                {periodsData[periodIndex]?.[periodIndex] || ''}
              </div>
            </td>

            {/* Course columns */}
            {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
              const rowSpan = calculateRowSpan(periodIndex, dayIndex - 1);

              if (rowSpan === 0) {
                return null; // This cell is part of a merged cell above
              }

              const courseSlot = row[dayIndex];
              const isEmpty = !courseSlot || courseSlot === "";

              return (
                <td
                  key={`${periodIndex}-${dayIndex}`}
                  rowSpan={rowSpan}
                  className={`border align-center overflow-hidden ${
                    isEmpty
                      ? 'bg-card'
                      : 'bg-blue-50 dark:bg-blue-950/30'
                  }`}
                  style={{
                    minHeight: `${40 * rowSpan}px`,
                    height: `${40 * rowSpan}px`
                  }}
                >
                  {renderCourseContent(courseSlot)}
                </td>
              );
            })}
          </tr>
        ))}
        </tbody>
      </table>
    </Card>
  );
}
