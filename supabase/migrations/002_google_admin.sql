-- ido@wisy.co.il הוא אדמין אוטומטית בכניסה ראשונה עם Google; כל השאר ללא גישה עד ששויכו ללקוח
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    case when lower(new.email) = 'ido@wisy.co.il' then 'admin' else 'client' end
  );
  return new;
end $$;

-- אם המשתמש כבר קיים (נכנסת בעבר):
update profiles set role = 'admin'
where id in (select id from auth.users where lower(email) = 'ido@wisy.co.il');
