import { useEffect, useState } from "react";
import { Loader2, MonitorSmartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDeviceFingerprint, getHardwareId } from "@/lib/hardwareId";
import { toast } from "@/hooks/use-toast";

const OS_OPTIONS = ["Windows", "macOS", "Linux", "SteamOS", "iOS", "Android", "Unknown"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (name: string, os: string) => Promise<unknown>;
  onSkip?: () => void;
}

export const RegisterDeviceDialog = ({ open, onOpenChange, onRegister, onSkip }: Props) => {
  const [name, setName] = useState("");
  const [os, setOs] = useState("Windows");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      const fp = getDeviceFingerprint();
      setName(fp.suggested_name);
      setOs(fp.os === "Unknown" ? "Windows" : fp.os);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onRegister(name.trim(), os);
      toast({ title: "Device registered", description: name.trim() });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-aurora animate-aurora-shift bg-[length:200%_200%] aurora-ring">
            <MonitorSmartphone className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center font-display text-2xl">
            Register this Device
          </DialogTitle>
          <DialogDescription className="text-center">
            We don't recognize this machine. Register it so every save you upload is tagged
            with the device it came from.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dev-name">Device name</Label>
            <Input
              id="dev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted/40 border-border/60"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Operating system</Label>
            <Select value={os} onValueChange={setOs}>
              <SelectTrigger className="bg-muted/40 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OS_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 font-mono text-[11px] text-muted-foreground">
            <span className="text-foreground">Hardware ID:</span> {getHardwareId()}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {onSkip && (
              <Button type="button" variant="ghost" onClick={onSkip}>
                Not now
              </Button>
            )}
            <Button
              type="submit"
              disabled={busy}
              className="bg-aurora animate-aurora-shift bg-[length:200%_200%] text-primary-foreground hover:opacity-90"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Register Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};