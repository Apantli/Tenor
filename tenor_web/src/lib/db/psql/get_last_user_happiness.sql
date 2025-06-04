-- Get the last recorded happiness score for a user in a specific project
create or replace function get_last_user_happiness(
  user_id_input text,
  project_id_input text
)
returns table (
  user_id text,
  happiness int8
)
language plpgsql
as $$
begin
  return query
  select H.user_id, H.happiness
  from "Happiness" H
  join "Reviews" R on R.id = H.review_id
  where 
    H.user_id = user_id_input and
    R.project_id = project_id_input
  order by H.created_at desc
  limit 1;
end;
$$;