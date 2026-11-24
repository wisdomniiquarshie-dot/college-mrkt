-- Create or update function for automatic user role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.seller_profiles (
    id, full_name, campus_area, whatsapp_number, account_type, is_contact_public, role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Campus seller'),
    NEW.raw_user_meta_data ->> 'campus_area',
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp_number', ''),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'account_type' IN (
        'student_seller', 'student_business', 'campus_business',
        'accommodation_advertiser', 'regular_advertiser'
      ) THEN NEW.raw_user_meta_data ->> 'account_type'
      ELSE 'student_seller'
    END,
    COALESCE(NEW.raw_user_meta_data ->> 'is_contact_public', 'false') = 'true',
    CASE
      WHEN LOWER(COALESCE(NEW.email, '')) = 'wisdomniiquarshie@gmail.com' THEN 'admin'
      ELSE 'student'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();