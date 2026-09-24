  SELECT
      table_schema AS esquema,
      table_name AS tabla,
      column_name AS columna,
      data_type AS tipo,
      is_nullable AS permite_nulos
  FROM information_schema.columns
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema, table_name, ordinal_position;