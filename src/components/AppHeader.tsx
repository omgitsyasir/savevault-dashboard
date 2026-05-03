import { Vault, Activity, Cpu, Library, Settings as SettingsIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSyncthing } from "@/hooks/useSyncthing";

export const AppHeader = () => {
  const { status } = useSyncthing();
  const connected = status?.connected ?? false;

  return (
    <header className="sticky top-0 z-30 glass border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-aurora animate-aurora-shift bg-[length:200%_200%] aurora-ring">
            <Vault className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-semibold tracking-tight">
              Save<span className="aurora-text">Vault</span>
            </h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Game Save Management
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full glass px-1.5 py-1 text-xs sm:flex">
          {[
            { to: "/", label: "Library", icon: Library },
            { to: "/devices", label: "Devices", icon: Cpu },
            { to: "/settings", label: "Settings", icon: SettingsIcon },
          ].map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/settings"
          className="flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-mono hover:border-primary/40 transition-colors"
        >
          <Activity
            className={`h-3.5 w-3.5 ${connected ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-muted-foreground">Syncthing</span>
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              connected ? "bg-primary shadow-glow" : "bg-muted-foreground/60"
            }`}
          />
          <span className={connected ? "text-primary" : "text-muted-foreground"}>
            {connected ? "online" : "offline"}
          </span>
        </NavLink>
      </div>
    </header>
  );
};