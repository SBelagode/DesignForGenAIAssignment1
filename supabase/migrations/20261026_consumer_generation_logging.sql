-- Lets the consumer app (signed-in user, anon key — no service role) record
-- its own caption generations in the admin logging tables.
-- Existing superadmin policies are untouched; these are additional, own-row only.

-- Catalog lookups: the default prompt chain, its step, and the Gemini model row.
-- prompt_text is the same instruction already stored in generations.generation_prompt.
drop policy if exists llm_models_authenticated_select on public.llm_models;
create policy llm_models_authenticated_select on public.llm_models
  for select to authenticated using (true);

drop policy if exists prompt_chains_authenticated_select on public.prompt_chains;
create policy prompt_chains_authenticated_select on public.prompt_chains
  for select to authenticated using (true);

drop policy if exists prompt_chain_steps_authenticated_select on public.prompt_chain_steps;
create policy prompt_chain_steps_authenticated_select on public.prompt_chain_steps
  for select to authenticated using (true);

-- images: users record metadata for objects in their own storage folder, and may
-- remove that row when the app discards an unused upload.
drop policy if exists images_own_insert on public.images;
create policy images_own_insert on public.images
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and storage_bucket = 'meme-images'
    and storage_path like (select auth.uid())::text || '/%'
  );

drop policy if exists images_own_select on public.images;
create policy images_own_select on public.images
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists images_own_delete on public.images;
create policy images_own_delete on public.images
  for delete to authenticated using (user_id = (select auth.uid()));

-- generation_requests: created as pending, then finalized exactly once.
-- Only status, error_message and completed_at are updatable.
grant insert on public.generation_requests to authenticated;
grant update (status, error_message, completed_at) on public.generation_requests to authenticated;

drop policy if exists generation_requests_own_select on public.generation_requests;
create policy generation_requests_own_select on public.generation_requests
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists generation_requests_own_insert on public.generation_requests;
create policy generation_requests_own_insert on public.generation_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and completed_at is null);

drop policy if exists generation_requests_own_finalize on public.generation_requests;
create policy generation_requests_own_finalize on public.generation_requests
  for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status in ('succeeded', 'failed', 'blocked'));

-- llm_responses: insert-only, and only against the user's own pending request.
grant insert on public.llm_responses to authenticated;

drop policy if exists llm_responses_own_insert on public.llm_responses;
create policy llm_responses_own_insert on public.llm_responses
  for insert to authenticated
  with check (
    exists (
      select 1 from public.generation_requests r
      where r.id = generation_request_id
        and r.user_id = (select auth.uid())
        and r.status = 'pending'
    )
  );
