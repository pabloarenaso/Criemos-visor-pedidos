import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell, User } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                onCloseMobile={() => setSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                    <div className="flex items-center justify-between h-14 px-4 lg:px-6">
                        {/* Left: Mobile Menu + Title */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                                <Menu size={22} />
                            </button>

                            <div>
                                <h1 className="text-lg font-semibold text-gray-800">
                                    Gestión de Pedidos
                                </h1>
                                <p className="text-xs text-gray-500 hidden sm:block">
                                    Criemos - Tienda Shopify
                                </p>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {/* Notifications */}
                            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                                <Bell size={20} />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                            </button>

                            {/* User Avatar */}
                            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-purple-500 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-white" />
                                </div>
                                <span className="hidden sm:block text-sm font-medium text-gray-700">
                                    Admin
                                </span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
