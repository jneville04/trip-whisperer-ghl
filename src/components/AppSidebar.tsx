import { LayoutDashboard, Map, Library } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Trips", url: "/trips", icon: Map },
  { title: "Section Library", url: "/section-library", icon: Library },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { settings } = useAppSettings();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`px-4 py-4 ${collapsed ? "px-2" : ""}`}>
          <h2 className={`font-display font-semibold text-foreground truncate ${collapsed ? "text-xs text-center" : "text-sm"}`}>
            {collapsed ? "" : settings.app_name}
          </h2>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:bg-muted/50 transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
