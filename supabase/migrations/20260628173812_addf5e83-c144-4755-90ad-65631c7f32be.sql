
CREATE POLICY "fotos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'demandas-fotos');
CREATE POLICY "fotos public insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'demandas-fotos');
