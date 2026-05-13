import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useLocation } from 'react-router';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
}

const instructorNav: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/instructor' },
  { title: 'My Classes', icon: BookOpen, href: '/instructor/classes' },
  { title: 'Settings', icon: Settings, href: '/settings' },
];

const studentNav: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/student' },
  { title: 'My Attendance', icon: BookOpen, href: '/student/history' },
  { title: 'Settings', icon: Settings, href: '/settings' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const role = localStorage.getItem('user_role') as 'instructor' | 'student' || 'student';
  
  const navItems = role === 'instructor' ? instructorNav : studentNav;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            A
          </div>
          Attendly
        </div>
      </div>
      
      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={location.pathname === item.href ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => navigate(item.href)}
          >
            <item.icon className="w-4 h-4" />
            {item.title}
          </Button>
        ))}
      </div>

      <div className="p-4 mt-auto">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 px-3 py-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">Demo User</p>
            <p className="text-xs text-muted-foreground truncate">{role}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-3 text-destructive hover:text-destructive" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 fixed inset-y-0 z-50">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${!isMobile ? 'ml-64' : ''}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4">
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              )}
              <h2 className="text-lg font-semibold capitalize">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}