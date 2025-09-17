"use client";

import React, { useState, useEffect } from "react";
import { login } from '@/lib/frontend/client';
import { Input, Button, Alert, Space, Typography, Card, Layout } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title } = Typography;

const LoginPage = () => {
  const [userId, setuserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter(); // 替换 useNavigate

  // 检查登录状态和学生 ID 的 cookie
  useEffect(() => {
    const cookies = document.cookie;
    const loginSession = cookies.split(";").some(c => c.trim().startsWith("LOGIN_SESSION="));
    const studentId = cookies.split(";").some(c => c.trim().startsWith("STUDENT_ID="));

    if (loginSession && studentId) {
      // 已登录，跳转到课程页面
      router.push("/courses");
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);

    try {
      const loginData = await login(userId, password);
      if (loginData && loginData?.isSuccess) {
        setError("");
        localStorage.setItem("user_data", JSON.stringify(loginData));
        router.push("/courses"); // Next.js 路由跳转
      } else {
        setError("登录失败，请检查学号和密码是否正确");
      }
    } catch (err) {
      setError("登录失败，请检查学号和密码是否正确");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Card
          style={{ width: 350, padding: "20px" }}
          title={<Title level={3} style={{ textAlign: "center" }}>登录</Title>}
          bordered={false}
        >
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

          <Space direction="vertical" style={{ width: "100%" }}>
            <Input
              prefix={<UserOutlined />}
              placeholder="学号"
              value={userId}
              onChange={(e) => setuserId(e.target.value)}
              size="large"
            />
            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="large"
            />
            <Button
              type="primary"
              onClick={handleLogin}
              size="large"
              style={{ width: "100%" }}
              loading={loading}
              disabled={loading}
              autoInsertSpace={false}
            >
              提交
            </Button>
            <Typography.Text style={{ color: "lightgray", fontSize: 12 }}>
              请使用上海科技大学统一身份认证登录
            </Typography.Text>
          </Space>
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
