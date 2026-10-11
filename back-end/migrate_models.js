require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    const sql = `
    CREATE TABLE IF NOT EXISTS public.device_models (
      model_id serial PRIMARY KEY,
      brand_id integer REFERENCES public.brands(brand_id) ON DELETE CASCADE,
      device_type_id integer REFERENCES public.device_types(device_type_id) ON DELETE SET NULL,
      model_name text NOT NULL,
      CONSTRAINT uq_brand_model UNIQUE (brand_id, model_name)
    );

    INSERT INTO public.device_models (brand_id, device_type_id, model_name) VALUES
    -- ASUS (1)
    (1, 1, 'ROG Strix G15 / G16'),
    (1, 1, 'TUF Gaming A15 / F15'),
    (1, 1, 'ZenBook 14 OLED'),
    (1, 1, 'VivoBook 15 / S14'),
    (1, 2, 'ROG Strix GT35'),
    -- Acer (2)
    (2, 1, 'Nitro 5 / Nitro 16'),
    (2, 1, 'Predator Helios 300 / 16'),
    (2, 1, 'Aspire 3 / 5 / 7'),
    (2, 1, 'Swift Go 14 / Swift 3'),
    (2, 3, 'Aspire C24 All-in-One'),
    -- Dell (3)
    (3, 1, 'Inspiron 15 / 14'),
    (3, 1, 'XPS 13 / 15 / 16'),
    (3, 1, 'G15 / G16 Gaming'),
    (3, 1, 'Latitude 3420 / 5420'),
    (3, 2, 'OptiPlex 7090 Tower'),
    -- HP (4)
    (4, 1, 'Victus 15 / 16'),
    (4, 1, 'OMEN 16 / 17'),
    (4, 1, 'Pavilion 14 / 15'),
    (4, 1, 'Envy x360 14'),
    (4, 3, 'HP 24 All-in-One PC'),
    -- Lenovo (5)
    (5, 1, 'LOQ 15 / 16'),
    (5, 1, 'Legion 5 / Pro 7'),
    (5, 1, 'IdeaPad Gaming 3 / Slim 3'),
    (5, 1, 'ThinkPad E14 / X1 Carbon'),
    (5, 2, 'Legion Tower 5i'),
    -- Apple (6)
    (6, 1, 'MacBook Air M1 / M2 / M3'),
    (6, 1, 'MacBook Pro 14 / 16 (M-Series)'),
    (6, 3, 'iMac 24-inch (M-Series)'),
    (6, 2, 'Mac mini (M-Series)'),
    (6, 2, 'Mac Studio'),
    -- MSI (7)
    (7, 1, 'Katana 15 / GF63 Thin'),
    (7, 1, 'Stealth 16 / Raider GE78'),
    (7, 1, 'Modern 14 / 15'),
    -- Custom PC (14)
    (14, 2, 'Custom Gaming PC'),
    (14, 2, 'Custom Office Desktop')
    ON CONFLICT (brand_id, model_name) DO NOTHING;
    `;

    await pool.query(sql);
    console.log('✅ device_models created and seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
