
alter table public.devices add column if not exists hardware_id text unique;
create index if not exists idx_devices_hardware_id on public.devices(hardware_id);
