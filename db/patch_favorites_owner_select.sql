-- Allow a user to read their own favorites OR a car owner to read favorites for their own cars
drop policy if exists "User favorites select" on public.favorites;
create policy "User favorites select"
on public.favorites
for select
using (
  user_id = auth.uid()
  OR exists (
    select 1
    from public.cars
    where public.cars.id = favorites.car_id
      and public.cars.owner_id = auth.uid()
  )
);
