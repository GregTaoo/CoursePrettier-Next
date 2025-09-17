"use client";

import React, { useEffect, useState } from 'react';
import { ConfigProvider, FloatButton, theme } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN';

export default function ThemeWrapper({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem("dark_mode") === "1";
    setIsDarkMode(dark);
  }, []);

  const toggleDarkMode = () => {
    const dark = !isDarkMode;
    setIsDarkMode(dark);
    localStorage.setItem("dark_mode", dark ? "1" : "0");
  };

  return (
    <ConfigProvider locale={zhCN}
                    theme={{
                      algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    }}>
      {children}
      <FloatButton onClick={toggleDarkMode} icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />} />
    </ConfigProvider>
  );
}
