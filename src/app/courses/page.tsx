"use client";

import React, { useEffect, useState } from "react";
import ICSGenerator from "@/components/ICSGenerator";
import { getSemesters, getCourseTable, logout } from "@/lib/frontend/client";
import {
  Table,
  Select,
  Spin,
  Alert,
  Typography,
  Row,
  Col,
  Card,
  Space,
  List,
  Layout,
  Button
} from "antd";
import { LoadingOutlined, UserOutlined, HomeOutlined, CalendarOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const CourseTablePage = () => {
  const [semesters, setSemesters] = useState(new Map());
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [courseTable, setCourseTable] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [currentSemester, setCurrentSemester] = useState<number>(1);

  const router = useRouter();

  // 获取学期数据
  useEffect(() => {
    const cookies = document.cookie;
    const loginSession = cookies.split(";").some(c => c.trim().startsWith("LOGIN_SESSION="));
    const studentId = cookies.split(";").some(c => c.trim().startsWith("STUDENT_ID="));

    if (!loginSession || !studentId) {
      router.push("/"); // Next.js 路由跳转
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

    fetchSemesters();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await logout();
      if (response.isSuccess) {
        router.push("/"); // Next.js 路由跳转
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
        setCurrentYear(year);
        setCurrentSemester(term);
      }
    } catch {}
  }, [selectedSemesterId, semesters]);

  // 合并表格逻辑和列渲染（略，与原逻辑相同）
  const onColCell = (col: number, record: any, index: number) => {
    if (!courseTable[index]) return {};
    if (courseTable[index][col] === "") return { rowSpan: 1 };
    else if (index > 0 && courseTable[index][col].key === courseTable[index - 1][col].key)
      return { rowSpan: 0 };
    else {
      let p = index + 1;
      while (p < courseTable.length && courseTable[p][col].key === courseTable[index][col].key) p++;
      return { rowSpan: p - index };
    }
  };

  const onRender = (col: number, record: any) => {
    const originalName = record[col].name;
    const match = originalName ? originalName.match(/(.*)\(([\w.]+)\)/) : null;
    const name = match ? match[1].trim() : originalName;
    const code = match ? match[2].trim() : null;

    return record[col] !== "" ? (
      <>
        <Row>
          <Space direction="horizontal">
            <Typography.Text strong>{name}</Typography.Text>
            {code && <Typography.Text type="secondary">{code}</Typography.Text>}
          </Space>
        </Row>
        <List
          itemLayout="horizontal"
          dataSource={record[col].weeks}
          renderItem={(week: any) => (
            <List.Item>
              <Col>
                <Row>
                  <Space>
                    <CalendarOutlined />
                    <Typography.Text>
                      第
                      {week.minWeek === week.maxWeek
                        ? week.minWeek
                        : `${week.minWeek}~${week.maxWeek}`}
                      周
                    </Typography.Text>
                  </Space>
                </Row>
                <Row>
                  <Space>
                    <HomeOutlined />
                    {week.classroom}
                  </Space>
                </Row>
                <Row>
                  <Space>
                    <UserOutlined />
                    {week.teachers}
                  </Space>
                </Row>
              </Col>
            </List.Item>
          )}
        />
      </>
    ) : (
      ""
    );
  };

  const columns = [
    { title: "时间", dataIndex: "time", key: "time", width: 90 },
    ...Array.from({ length: 7 }, (_, i) => ({
      title: `周${i + 1}`,
      dataIndex: `${i + 1}`,
      key: `${i + 1}`,
      onCell: (record: any, index: number) => onColCell(i + 1, record, index),
      render: (_: any, record: any) => onRender(i + 1, record)
    }))
  ];

  const generateTableData = (data: any) => {
    const table: any[] = [];
    if (!data?.periods) return table;

    const periodsData = data.periods;
    for (let i = 1; i <= periodsData.length; i++) {
      table.push({
        key: i,
        time: (
          <>
            <Col>第 {i} 节</Col>
            <Col>{periodsData[i - 1][i - 1]}</Col>
          </>
        ),
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
        segments.push({ start, end });
      }

      segments.forEach(({ start, end }) => {
        // @ts-ignore
        // TODO
        Object.entries(times).forEach(([day, periods]: [string, string]) => {
          periods.split(",").forEach((periodStr) => {
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
    <Layout style={{ minHeight: "100vh" }}>
      <div style={{ padding: "20px" }}>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: "20px" }} />}
        <Card style={{ marginBottom: "20px" }}>
          <Row align="middle" justify="space-around">
            <Col span={12}>
              <Space>
                <Typography.Text>选择学期</Typography.Text>
                <Select
                  disabled={loading}
                  value={selectedSemesterId}
                  style={{ width: "250px" }}
                  onChange={handleSemesterChange}
                  placeholder="选择学期"
                  options={Array.from(semesters)
                    .reverse()
                    .map(([id, { year, term }]) => ({
                      label: `${year} 学年, 第 ${term} 学期`,
                      value: id
                    }))}
                />
              </Space>
            </Col>
            <Col span={4}>
              <Space>
                <Button type="primary" onClick={() => setModalOpen(true)} disabled={loading}>
                  导出 iCal 日程
                </Button>
                <ICSGenerator
                  externalOpen={modalOpen}
                  setExternalOpen={setModalOpen}
                  courseData={courseData}
                  year={currentYear}
                  semester={currentSemester}
                />
                <Button danger onClick={handleLogout} autoInsertSpace={false}>
                  登出
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {loading ? (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
          </div>
        ) : (
          // @ts-ignore
          // TODO
          <Table columns={columns} dataSource={courseTable} pagination={false} bordered size="middle" style={{ marginTop: "20px" }} />
        )}
      </div>
    </Layout>
  );
};

export default CourseTablePage;
