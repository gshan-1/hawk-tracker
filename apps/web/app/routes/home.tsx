import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useAuth } from "../contexts/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import DashboardPage from "@/components/dashboardPage/DashboardPage";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to Hawk Tracker!" },
  ];
}

function HomeContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-900">Hawk Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Welcome />
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}