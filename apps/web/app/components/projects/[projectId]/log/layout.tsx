import { Outlet, useParams, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MockAPI, Project } from '../../../../api/mockAPI';

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 获取项目信息
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const projectData = await MockAPI.getProject(projectId);
        setProject(projectData);
      } catch (error) {
        console.error('获取项目信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // 导航菜单配置 - 只包含需要共享导航的页面
  const navItems = [
    { path: `/projects/${projectId}/overview`, label: '概览', icon: '' },
    { path: `/projects/${projectId}/errors-log`, label: '错误日志', icon: '❌' },
    { path: `/projects/${projectId}/performance`, label: '性能日志', icon: '⚡' },
    { path: `/projects/${projectId}/users`, label: '用户日志', icon: '👩‍💻' },
    { path: `/projects/${projectId}/custom`, label: '自定义埋点', icon: '' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 左侧导航栏 */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">项目导航</h2>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
