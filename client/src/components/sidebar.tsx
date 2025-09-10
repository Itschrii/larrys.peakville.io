import { Wrench, LayoutDashboard, Package, Activity, ShoppingCart, LogOut, User, Users, RotateCcw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location, navigate] = useLocation();
  
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'director' || currentUser.role === 'vice_director';
  
  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard", active: location === "/" },
    { href: "/create-order", icon: ShoppingCart, label: "Crea Ordine", active: location === "/create-order" },
    // { href: "/parts", icon: Package, label: "Gestione Pezzi", active: location === "/parts" }, // Nascosto per le evenienze
  ];

  const adminItems = isAdmin ? [
    { href: "/admin", icon: Users, label: "Gestione Dipendenti", active: location === "/admin" },
    { href: "/restock", icon: RotateCcw, label: "Restock Inventario", active: location === "/restock" },
  ] : [];

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 relative h-screen" data-testid="sidebar">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8" data-testid="sidebar-header">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="app-title">Larrys</h1>
            <div className="flex items-center gap-2">
              <div className="status-indicator online" data-testid="bot-status-indicator"></div>
              <span className="text-sm text-muted-foreground" data-testid="bot-status-text">Online</span>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2" data-testid="navigation">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                item.active 
                  ? 'bg-primary/10 text-primary' 
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
          
          {adminItems.length > 0 && (
            <>
              <div className="border-t border-border my-4"></div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                Amministrazione
              </div>
              {adminItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                    item.active 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 space-y-3" data-testid="bottom-panel">
        {/* User Panel */}
        <div className="bg-secondary p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <div>
                <p className="text-sm font-medium" data-testid="current-user-name">
                  {currentUser.fullName || 'Utente'}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{currentUser.username || 'unknown'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </aside>
  );
}
