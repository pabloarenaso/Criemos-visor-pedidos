import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Users,
    Truck,
    X,
    ChevronLeft,
} from 'lucide-react';

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/pedidos', label: 'Pedidos', icon: <ShoppingBag size={20} /> },
    { to: '/preparar-envio', label: 'Preparar Envío', icon: <Truck size={20} /> },
    { to: '/productos', label: 'Productos', icon: <Package size={20} /> },
    { to: '/clientes', label: 'Clientes', icon: <Users size={20} /> },
];

interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onCloseMobile: () => void;
}

export default function Sidebar({
    isOpen,
    isCollapsed,
    onToggleCollapse,
    onCloseMobile,
}: SidebarProps) {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
                    onClick={onCloseMobile}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:sticky top-0 left-0 z-50 h-screen
                    bg-white border-r border-gray-100 shadow-lg lg:shadow-none
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                    ${isCollapsed ? 'lg:w-20' : 'lg:w-60'}
                    w-64 flex-shrink-0
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
                        <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
                            <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-white font-bold">C</span>
                            </div>
                            <span className={`font-semibold text-lg text-gray-800 transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : ''}`}>
                                Criemos
                            </span>
                        </div>

                        {/* Mobile Close Button */}
                        <button
                            onClick={onCloseMobile}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={onCloseMobile}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                                    transition-all duration-200 group
                                    ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}
                                    ${isActive
                                        ? 'bg-gradient-to-r from-rose-50 to-purple-50 text-rose-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                    }
                                `}
                            >
                                <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                                    {item.icon}
                                </span>
                                <span className={`font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : ''}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Collapse Toggle (Desktop only) */}
                    <div className="hidden lg:block p-3 border-t border-gray-100">
                        <button
                            onClick={onToggleCollapse}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                                       text-gray-500 hover:text-gray-700 hover:bg-gray-50
                                       transition-all duration-200"
                        >
                            <ChevronLeft
                                size={18}
                                className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
                            />
                            <span className={`text-sm ${isCollapsed ? 'hidden' : ''}`}>Colapsar</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
