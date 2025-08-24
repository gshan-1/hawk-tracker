// apps/web/app/projectsDetails/index.tsx
"use client";
import { Outlet, useParams } from "react-router-dom";
import { Sidebar } from "@/components/ui/sidebar"; // shadcn 侧边栏
import { Menu, MenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/utils"; // shadcn 工具函数

export default function ProjectsLayout() {
  const { projectId } = useParams(); // 获取项目ID（如 proj-123）

  return (
    <div className="flex h-screen">
      {/* 左侧固定侧边栏 */}
      <Sidebar className="w-64 bg-gray-900 text-white">
        <Menu className="p-4 space-y-2">
          <MenuItem asChild>
            <a 
              href={`/projects/${projectId}`} 
              className={cn("block px-4 py-2 rounded hover:bg-gray-700")}
            >
              概览
            </a>
          </MenuItem>
          <MenuItem asChild>
            <a 
              href={`/projects/${projectId}/error-logs`} 
              className={cn("block px-4 py-2 rounded hover:bg-gray-700")}
            >
              错误日志
            </a>
          </MenuItem>
          <MenuItem asChild>
            <a 
              href={`/projects/${projectId}/performance`} 
              className={cn("block px-4 py-2 rounded hover:bg-gray-700")}
            >
              性能监控
            </a>
          </MenuItem>
          <MenuItem asChild>
            <a 
              href={`/projects/${projectId}/behavior`} 
              className={cn("block px-4 py-2 rounded hover:bg-gray-700")}
            >
              行为监控
            </a>
          </MenuItem>
          <MenuItem asChild>
            <a 
              href={`/projects/${projectId}/custom-events`} 
              className={cn("block px-4 py-2 rounded hover:bg-gray-700")}
            >
              自定义事件
            </a>
          </MenuItem>
        </Menu>
      </Sidebar>

      {/* 右侧空白内容区（后续填充监控页面） */}
      <div className="flex-1 p-8 bg-gray-50 overflow-auto">
        <Outlet /> {/* 子路由内容渲染位置 */}
        {/* 可在此预留空白容器，后续动态加载页面 */}
        <div id="main-content" className="w-full h-full"></div>
      </div>
    </div>
  );
}