-- Allow the n8n data-sync workflow (using the anon/publishable key via PostgREST upsert)
-- to write F1 reference data. This is an internal single-tenant tool with no auth layer;
-- if this ever becomes multi-user or public-write-exposed, switch n8n to a service_role
-- key and drop these policies in favor of write access restricted to service_role only.
create policy "sync upsert constructors" on constructors for insert with check (true);
create policy "sync update constructors" on constructors for update using (true) with check (true);

create policy "sync upsert drivers" on drivers for insert with check (true);
create policy "sync update drivers" on drivers for update using (true) with check (true);

create policy "sync upsert races" on races for insert with check (true);
create policy "sync update races" on races for update using (true) with check (true);

create policy "sync upsert results" on results for insert with check (true);
create policy "sync update results" on results for update using (true) with check (true);

create policy "sync upsert qualifying" on qualifying_results for insert with check (true);
create policy "sync update qualifying" on qualifying_results for update using (true) with check (true);

create policy "sync upsert driver_standings" on driver_standings for insert with check (true);
create policy "sync update driver_standings" on driver_standings for update using (true) with check (true);

create policy "sync upsert constructor_standings" on constructor_standings for insert with check (true);
create policy "sync update constructor_standings" on constructor_standings for update using (true) with check (true);
