import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  Mail,
  MessageSquare,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const NAV = [
  { to: "/", label: "Overview", icon: BarChart3 },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/notes", label: "Meeting Notes", icon: ClipboardList },
  { to: "/planner", label: "Task Planner", icon: CalendarClock },
  { to: "/research", label: "Research", icon: Search },
  { to: "/chat", label: "Assistant Chat", icon: MessageSquare },
] as const;

export function AiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground ${className}`}
    >
      <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>
        AI-generated content can be inaccurate or incomplete. Review and edit everything before you
        send, share or act on it, and never paste confidential data you are not permitted to share.
      </span>
    </p>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
              N
            </span>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="font-display text-sm font-semibold leading-tight">Northlight</p>
              <p className="text-xs text-sidebar-foreground/70">Workplace AI assistant</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:hidden">
          <p className="px-2 pb-2 text-xs leading-relaxed text-sidebar-foreground/60">
            Drafts stay in this browser. Always review AI output before sending.
          </p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <span className="font-display text-sm font-medium">
            {NAV.find((n) => n.to === pathname)?.label ?? "Northlight"}
          </span>
        </header>
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
