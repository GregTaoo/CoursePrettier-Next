'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { login } from '@/lib/frontend/client';
import { UserIcon, LockIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';
import { useRouter } from "next/navigation";

export default function App() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Check login status and student ID cookies on component mount
  useEffect(() => {
    const cookies = document.cookie;
    const loginSession = cookies.split(";").some(c => c.trim().startsWith("LOGIN_SESSION="));
    const studentId = cookies.split(";").some(c => c.trim().startsWith("STUDENT_ID="));

    if (loginSession && studentId) {
      // Already logged in, redirect to courses page
      setIsLoggedIn(true);
      setError("登录成功，正在跳转...");
      router.push("/courses");
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const loginData = await login(userId, password);
      if (loginData && loginData?.isSuccess) {
        setError("");
        localStorage.setItem("user_data", JSON.stringify(loginData));
        setIsLoggedIn(true);
        setError("登录成功，正在跳转...");
        router.push("/courses");
      } else {
        setError("登录失败，请检查学号和密码是否正确");
      }
    } catch (err) {
      setError("登录失败，请检查学号和密码是否正确");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center">登录</CardTitle>
          <CardDescription className="text-center">
            请使用上海科技大学统一身份认证登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant={isLoggedIn ? "default" : "destructive"}>
              {isLoggedIn ? <CheckCircle2Icon/> : <AlertCircleIcon/>}
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="userId"
                  type="text"
                  placeholder="学号"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button
              variant="outline"
              type="submit"
              className="w-full hover:cursor-pointer"
              disabled={loading}
            >
              {loading ? "登录中..." : "提交"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
