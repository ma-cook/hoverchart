DO $$
DECLARE
  fk_name text;
BEGIN
  IF to_regclass('plan_tasks') IS NULL THEN
    RETURN;
  END IF;

  FOR fk_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'plan_tasks'::regclass
      AND confrelid = 'spaces'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[
        (SELECT attnum
         FROM pg_attribute
         WHERE attrelid = 'plan_tasks'::regclass
           AND attname = 'space_id')
      ]
  LOOP
    EXECUTE format('ALTER TABLE plan_tasks DROP CONSTRAINT %I', fk_name);
  END LOOP;

  ALTER TABLE plan_tasks
    ADD CONSTRAINT plan_tasks_space_id_fkey
    FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE;
END $$;
