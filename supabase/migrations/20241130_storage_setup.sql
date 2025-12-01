-- Create storage bucket for inventory photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('inventory-photos', 'inventory-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg']);

-- Create storage policies for inventory photos
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'inventory-photos');

CREATE POLICY "Allow authenticated users to upload" ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'inventory-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow users to update their own photos" ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'inventory-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Allow users to delete their own photos" ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'inventory-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Grant permissions for storage
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create user profile when auth.user is created
  INSERT INTO public.profiles (id, email, password_hash, profile_type, settings)
  VALUES (
    new.id,
    new.email,
    '', -- Password will be set separately
    'TAC', -- Default profile type
    '{}'::jsonb
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration (optional, since we're using custom auth)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();