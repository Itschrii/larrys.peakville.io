import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import PartsManagement from "@/pages/parts-management";
import CreateOrder from "@/pages/create-order";
import Activity from "@/pages/activity";
import Admin from "@/pages/admin";
import Restock from "@/pages/restock";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const currentUser = localStorage.getItem('currentUser');
  const [, navigate] = useLocation();
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/create-order" component={() => <ProtectedRoute component={CreateOrder} />} />
      <Route path="/parts" component={() => <ProtectedRoute component={PartsManagement} />} />
      <Route path="/activity" component={() => <ProtectedRoute component={Activity} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} />} />
      <Route path="/restock" component={() => <ProtectedRoute component={Restock} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
