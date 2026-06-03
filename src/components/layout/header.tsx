"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Menu, Settings as SettingsIcon, User } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inbox": "Inbox",
  "/contacts": "Contacts",
  "/pipelines": "Pipelines",
  "/broadcasts": "Broadcasts",
  "/automations": "Automations",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path),
  );
  return match ? match[1] : "Dashboard";
}

interface HeaderProps {
  /** Wired to the shell's drawer state. Used only on mobile — the
   *  hamburger button is hidden on lg+. */
  onOpenSidebar?: () => void;
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { profile, signOut, refreshProfile } = useAuth();
  const title = getPageTitle(pathname);

  const handleToggleOnline = async () => {
    if (!profile) return;
    const nextStatus = !profile.is_online;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ is_online: nextStatus })
        .eq("id", profile.id);

      if (error) throw error;
      await refreshProfile();
      toast.success(`You are now ${nextStatus ? "Online" : "Offline"}`);
    } catch (err) {
      console.error("[Header] failed to toggle online status:", err);
      toast.error("Failed to update availability status");
    }
  };

  const initial =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    profile?.email?.charAt(0)?.toUpperCase() ??
    "U";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {/* Hamburger — mobile only. 44×44 hit target per Apple HIG. */}
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-base font-semibold text-white sm:text-lg">
          {title}
        </h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-800/70 focus:bg-slate-800/70 focus:outline-none data-popup-open:bg-slate-800/70 sm:gap-3 sm:pl-1 sm:pr-3"
          aria-label="Open account menu"
        >
          <div className="relative">
            <Avatar className="size-8">
              {profile?.avatar_url ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Avatar"}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 transition-colors duration-200 ${
                profile?.is_online ? "bg-emerald-500" : "bg-slate-500"
              }`}
            />
          </div>
          <span className="hidden text-sm font-medium text-white sm:inline">
            {profile?.full_name ?? "User"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="min-w-56 bg-slate-900 text-slate-100 ring-slate-700"
        >
          <div className="px-2 py-1.5 flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {profile?.full_name ?? "User"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {profile?.email ?? ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 rounded-full bg-slate-950/40 px-2 py-0.5 border border-slate-800">
                <span className={`inline-block h-2 w-2 rounded-full ${profile?.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {profile?.is_online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-slate-800" />
          <div className="px-2 py-1.5 flex items-center justify-between">
            <span className="text-xs text-slate-300">Availability</span>
            <button
              type="button"
              onClick={handleToggleOnline}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary ${
                profile?.is_online ? "bg-emerald-500" : "bg-slate-700"
              }`}
              aria-label={profile?.is_online ? "Set offline" : "Set online"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  profile?.is_online ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <DropdownMenuSeparator className="bg-slate-800" />
          <DropdownMenuItem
            render={
              <Link
                href="/settings?tab=profile"
                className="text-slate-200 focus:bg-slate-800 focus:text-white"
              />
            }
          >
            <User className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <Link
                href="/settings?tab=whatsapp"
                className="text-slate-200 focus:bg-slate-800 focus:text-white"
              />
            }
          >
            <SettingsIcon className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-800" />
          <DropdownMenuItem
            onClick={signOut}
            className="text-slate-200 focus:bg-slate-800 focus:text-white"
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
