// Live Google Apps Script Webhook Endpoint
    const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvhLRquyBHA1DFarnqbiqM5JlV-4dI_TpzOduKdSnubWCdcPI4n_YCN_b1wZeREIP3Gg/exec";
    const WA_NUMBER = "918619661325";
    const MERCHANT_UPI = "8619661325@upi";

    // Products Database (30 Proprietary Silhouettes, Exact Average COD Price ₹899)
    const PRODUCTS = [
  {
    "id": 1,
    "handle": "untitled-11apr_15-24",
    "title": "Aero Crystal Matte Frames blue cut lenses — Studio Lux Edition",
    "category": "Luxury Collection",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_705dcf3a-0743-4b68-958a-33d07983079e.jpg?v=1775901336",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8e426eed-f2f7-4b59-920c-174bb7d01d36.jpg?v=1775901337",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_018377c5-19d3-43c2-b648-516a39a780f4.jpg?v=1775901337",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_e737239d-d782-4f94-ae4c-a76a0dc3ecd6.jpg?v=1775901337",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_cc55dbc8-8940-4e1f-93a9-b21cad41fe4f.jpg?v=1775901337"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 2,
    "handle": "omni-flex-3-magnetic-clip-ons-shiv-shakti-versatile-series",
    "title": "Omni-Flex 3 Magnetic Clip-Ons — The Classic Co.",
    "category": "Magnetic Clip-Ons",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_36f4ffcc-4e59-47d8-9478-fdfbb163eb35.jpg?v=1776062370",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a0709c18-8504-433f-bcd5-046b0bc1250f.jpg?v=1776062370",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0272ca52-fb8d-45c2-9e99-5d3c81a6def9.jpg?v=1776062370",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_168acd25-6b7f-472e-97a7-0a06fb7ea572.jpg?v=1776062372",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_427e6247-6f5f-4867-be70-0263c04e04cf.jpg?v=1776062370",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_cdd0a14e-c321-4547-b52e-3aa1834d263c.jpg?v=1776062370"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 3,
    "handle": "royal-gilt-aviators-shiv-shakti-modern-lux-series",
    "title": "Royal Gilt Aviators — Studio Modern Series",
    "category": "Luxury Collection",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_1473c992-3b7d-4f09-aef0-2a3335926713.jpg?v=1776061514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d6d32d43-3501-40ed-99cf-dbe4072969b0.jpg?v=1776061514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_03711623-0533-4b91-860b-178349f586fc.jpg?v=1776061514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_39645ffc-f11d-4566-ad13-022441a8eaa7.jpg?v=1776061514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a57da4e3-2372-41fc-add2-57f8ca84d927.jpg?v=1776061514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_22d362d3-f6a3-4fa3-9c41-03567a4505f8.jpg?v=1776061514"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 4,
    "handle": "sepia-mist-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Sepia Mist Rounded Squares — Studio Modern Series",
    "category": "Luxury Collection",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8d1c8f25-1c77-446b-b451-7f48f194cf45.jpg?v=1776069430",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5cd914a5-e6ed-4afc-b1cc-1edfe6a80844.jpg?v=1776069430",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_1a17ed00-bb25-4381-a091-cd3eb163d9cd.jpg?v=1776069430",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_32d22ef4-de79-4714-b720-728d3156eeaf.jpg?v=1776069430",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a007d26d-461c-49a5-a846-0c11075a2b35.jpg?v=1776069430",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_bb178d53-c99e-4794-92d7-8f59a385956e.jpg?v=1776069433",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3dae09e8-bb87-4159-80f9-ea21cf6c2e9d.jpg?v=1776069697",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_42e4ad19-5e0f-4d58-a49f-b54bf07c0b08.jpg?v=1776069430",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_fc8cf1f6-89d0-4a73-9d64-dfc6cba1c3fc.jpg?v=1776069430"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 5,
    "handle": "the-mewar-maverick-4-in-1-magnetic-set-shiv-shakti-elite-series",
    "title": "The Mewar Maverick 4-in-1 Magnetic Set — The Classic Co.",
    "category": "Magnetic Clip-Ons",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_fe8e1885-07fa-4d22-a61e-fd067ca9c1a3.jpg?v=1776063093",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_60e69d93-a360-42f5-a5d3-80d3ecd6d9e6.jpg?v=1776063093",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_f3298aad-fa22-44b0-ab91-696c602531b0.jpg?v=1776063093",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_ffd32da3-73f2-4ebf-848c-f4e599afe4fa.jpg?v=1776063093",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d415527c-6cbc-4824-80c3-eb4088a9203b.jpg?v=1776063093",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3f7f1728-f314-419d-809b-ce15294bdb18.jpg?v=1776063093"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 6,
    "handle": "the-urban-bridge-shiv-shakti-signature",
    "title": "The Urban Bridge— The Classic Co.",
    "category": "Luxury Collection",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a7991f55-d4f2-4c05-9599-ba8e56dd63e3.jpg?v=1776061243",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_eae3fadc-6240-4340-800e-ced1a1021664.jpg?v=1776061243",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_1297ceff-db71-4623-bd67-15cea31b9f9c.jpg?v=1776061242",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_78dac9d4-e906-41d2-bfc2-d33f698b6a2b.jpg?v=1776061243",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a429f35b-307a-47a1-afc1-e57f87f52bc1.jpg?v=1776061243",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_242b8d4a-4164-4844-80ff-3efc3a16426d.jpg?v=1776061242"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 7,
    "handle": "vantage-3-in-1-magnetic-clip-ons-shiv-shakti-performance-series",
    "title": "Vantage 3-in-1 Magnetic Clip-Ons — Performance Series",
    "category": "Magnetic Clip-Ons",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_038ad405-7ce8-4e61-bbca-babce30f09be.jpg?v=1776062733",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_286460a6-3267-46d6-b33b-70cec549208e.jpg?v=1776062733",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4d77f619-2dbd-429c-9621-be2cd30431d0.jpg?v=1776062733",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_134d2282-2ae2-43c4-a530-2a8488b57624.jpg?v=1776062733",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_db22cddc-317e-40f7-bbbf-405a5292821a.jpg?v=1776062733",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_602d7e18-77d8-44a3-b1b0-ad56d9e3c9d8.jpg?v=1776062733"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 8,
    "handle": "aura-glow-night-vision-wayfarers-shiv-shakti-performance-series",
    "title": "Aura Glow Night-Vision Wayfarers — Performance Series",
    "category": "Polarized & Driving",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a23021b2-b13c-4740-8ac1-f7942b7fb9ab.jpg?v=1776064394",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_ca76fbce-f74a-48a9-9a6d-ada8dbc7c061.jpg?v=1776064394",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_26bf0680-ab6b-4365-836b-8792550bba57.jpg?v=1776064394",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5e4b06d0-013d-44d0-a361-596a6b8c7186.jpg?v=1776064394",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_69de604c-32e3-4f8c-a8cc-da0469174131.jpg?v=1776064394",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_bbd57d74-9c69-4414-acf3-0d75ec6429fb.jpg?v=1776064394",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_bcb38e0e-b0d5-41e1-9084-ab38ef0e4890.jpg?v=1776064394",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_634d2c37-eb41-444b-9665-06cd60bfab64.jpg?v=1776064394"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 9,
    "handle": "citrine-glow-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Knight Force polarized goggles — Studio Modern Series",
    "category": "Polarized & Driving",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_e10de9f8-40b4-4169-9ba7-957575e43552.jpg?v=1776067514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_ce9ec51d-2899-4a1f-b538-90a819b7d56c.jpg?v=1776067514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_16cdc1ed-4df0-4828-865c-dfcdf02d0659.jpg?v=1776067514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4257fb6f-cfe1-4a07-ab38-4821d61add98.jpg?v=1776067514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_41077d46-41d9-47b3-ab5f-d470e1943476.jpg?v=1776067514",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9ac520ff-a4ca-4ad2-b200-1b00bb2447d5.jpg?v=1776067514"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 10,
    "handle": "amber-estate-classic-frames-shiv-shakti-modern-lux",
    "title": "Amber Estate Classic Frames — Modern Lux Edition",
    "category": "Classic Lifestyle",
    "new_price": 999,
    "cod_price": 999,
    "compare_at": 2999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_e27fe7d3-7e80-45dd-afa5-bcbf460c0bf9.jpg?v=1776065470",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_7e7bc02b-69a9-4d6b-99e2-08832e7a9c68.jpg?v=1776065470",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a28bfdb0-a884-41cf-a5e6-c21d8a1763cf.jpg?v=1776065470",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_7198cce2-92b2-434b-826c-d7b9ad621f82.jpg?v=1776065470",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_97a1b62d-5973-4901-9866-c460e7373be5.jpg?v=1776065470"
    ],
    "price": 999,
    "upi_price": 899
  },
  {
    "id": 11,
    "handle": "arctic-circ-translucent-frames-shiv-shakti-modern-lux",
    "title": "Arctic Circ Translucent Frames — Modern Lux Edition",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_809aa693-4c6d-4563-a3dc-71e238accb94.jpg?v=1776064685",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_108e16bd-b7f2-4893-8bdb-ae1c6947bc89.jpg?v=1776064685",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_ebb9fb5f-c0cd-48ff-afdf-1d12bfc1dd4a.jpg?v=1776064685",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_dc08be74-5059-43b2-87d9-9e7f52f491f8.jpg?v=1776064686",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_11cf1c86-5808-43a5-92f4-d92c07dde3b1.jpg?v=1776064685"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 12,
    "handle": "azure-executive-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Azure Executive Rounded Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_1742cd45-b656-4148-bdc8-02c442f972aa.jpg?v=1776067214",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_020e0553-9ce5-4592-ab86-5c3ae6fd5ad3.jpg?v=1776067214",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_88e33222-5d35-4a2d-abac-09bffc7ef1f6.jpg?v=1776067214",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d450aec6-d375-479e-9d47-0c1326a6a053.jpg?v=1776067215",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_b25067fc-d32e-40a8-b9b1-1eed726c5082.jpg?v=1776067214",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5725458e-3544-4ecd-a504-c64b964886e4.jpg?v=1776067213",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5e171134-5346-4b1b-8b98-f88cd7d1f232.jpg?v=1776067214"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 13,
    "handle": "azure-stealth-professionals-shiv-shakti-modern-lux-series",
    "title": "Azure Stealth Professionals — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9bbfe356-dc1e-4064-8322-73c2193cea50.jpg?v=1776066253",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0c3e69fe-9118-4ca6-af14-2ab46c7ad1d3.jpg?v=1776066253",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4aa6f3ee-4305-41a1-8184-6f959804db2f.jpg?v=1776066253",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d8023e32-5dc7-43a5-b27f-6a9e637536fc.jpg?v=1776066253",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4e43a395-c333-4a9d-8c49-987c568972f1.jpg?v=1776066253",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_df15c27c-288b-4322-b76b-d9978b9e87d0.jpg?v=1776066253",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_b077a99d-c3e1-488f-ad41-7b918aff148c.jpg?v=1776066253"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 14,
    "handle": "carbon-stealth-geo-aviators-shiv-shakti-modern-lux-series",
    "title": "Carbon Stealth Geo-Aviators — Studio Modern Series",
    "category": "Aesthetic Trends",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8c0208d6-aaa3-426a-b6fc-f3fe505f7eb0.jpg?v=1776064153",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_ee219c00-8ea9-4270-be9a-4bb5ecfa6718.jpg?v=1776064151",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_964e7ee4-5d11-49a7-8fe4-08418eb91457.jpg?v=1776064151",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_99d6600a-df68-4711-b391-e9212f01c9e6.jpg?v=1776064151",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_f296fedd-8670-4907-a41e-c1332a5b2259.jpg?v=1776064151",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_95c08ee9-0b15-47cf-b4e6-8df67f10a3c3.jpg?v=1776064151",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8995775c-fd84-4e77-ad1f-9b293bb1c382.jpg?v=1776064151"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 15,
    "handle": "champagne-frost-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Champagne Frost Rounded Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_cebdaebf-95ab-4c9a-8136-0d0e9c89dbeb.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_2b31eb9d-e645-4513-8044-e583ffca5aac.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_bb34d4a4-f805-47ac-a8af-e6e5ed14e05b.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4c024c60-451c-413b-9350-5aff07025ae1.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9a5f3c51-f759-4e81-acaa-457184f2f1ef.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_44d9a35b-dc4b-4f41-81c7-d016d39cda42.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_aee9ac69-5da0-4ccd-b6ec-5dd48c0816e7.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_bf718af7-7f4a-485f-81d6-51b90a27c243.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4b19c9eb-fc4f-4289-b785-8f9392187f7e.jpg?v=1776068122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5a1e75b3-2755-4dda-a55d-0affaf015f21.jpg?v=1776068122"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 16,
    "handle": "diamond-clear-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Diamond Clear Rounded Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3bddf760-a65f-4ebd-be0f-dbf31f776476.jpg?v=1776068684",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_dface118-ae6e-45b5-8300-561daa57b34c.jpg?v=1776068684",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_13fea03c-6e82-461c-82d1-9cb3fc595393.jpg?v=1776068684",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_1ea08b47-c727-4d10-89cf-f40f473899ae.jpg?v=1776068684",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a898da47-51ae-447a-99af-533717ec1438.jpg?v=1776068684",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_fa07c9d6-4b1a-4349-8702-d82909602837.jpg?v=1776068686",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_511c4c2f-aef9-436b-99d6-1d3387679249.jpg?v=1776068684",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_2535e66b-7c42-4234-865f-ef1ec8acf0d8.jpg?v=1776068684"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 17,
    "handle": "icy-eyes-crystal-squares-shiv-shakti-modern-lux-series",
    "title": "Icy Eyes Crystal Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8e7d5479-1aa5-4726-98ce-d67d80dfe3d9.jpg?v=1776069183",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_46cc81ca-58a1-44ff-9d79-edd02086b5a8.jpg?v=1776069183",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0aa91089-22cb-44c0-a7e7-54ae9eb9b198.jpg?v=1776069183",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_b9b57ce4-ea35-4fe7-911e-a12c97bc3e84.jpg?v=1776069183"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 18,
    "handle": "lakeside-vogue-rimless-squares-shiv-shakti-modern-lux-series",
    "title": "Lakeside Vogue Rimless Squares — Studio Modern Series",
    "category": "Aesthetic Trends",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4956ff6a-ce70-4093-9d67-f19c931b51ea.jpg?v=1776063399",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_c5f47775-575a-483f-a172-a6114fac8d19.jpg?v=1776063399",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5ec4d413-a5bc-42a3-bdaa-5d6a3f1789b3.jpg?v=1776063400",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_dda7f953-0f65-40f0-b17a-de4a92315f8f.jpg?v=1776063400",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_7bbc6e31-1ffc-445d-9796-e1feb74f07e1.jpg?v=1776063400",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d180dde0-154a-4883-972f-5e7a7f1bdfbe.jpg?v=1776063400"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 19,
    "handle": "luna-frost-matte-translucents-shiv-shakti-modern-lux-series",
    "title": "Luna Frost Matte Translucents — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_46008640-a362-4098-8033-3c9021b2e2d0.jpg?v=1776066001",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_74a1febe-1ab3-4fad-88b8-9c5ce7b50e46.jpg?v=1776066001",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_437b7f04-fae5-4465-a7e3-4b8c38df7b9b.jpg?v=1776066001",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_7d10e23f-04a5-4507-99c5-8eaa754aca08.jpg?v=1776066001",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_340cec9d-9a87-4041-9935-e36c67e622ac.jpg?v=1776066001"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 20,
    "handle": "marine-crystal-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Marine Crystal Rounded Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 899,
    "cod_price": 899,
    "compare_at": 2499,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_ff0d24a7-410b-4044-9237-2a6ca8a82143.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9ba6824d-3e28-4989-a42a-0db33255ad1c.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_cf45c4ae-f792-4d81-a9e7-05aef25c16a4.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9d7666c2-87e2-4197-b3d6-fe4e7bc4859c.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_ca04dc98-3b9b-4e70-a4dc-5834fcf64cd8.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_442eab84-40a8-4a86-9ae4-c6050292ef81.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9a686855-89ad-4133-9ffd-b23d20ef5f59.jpg?v=1776067765",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_327a3b9a-7b2e-425a-85a9-fa26330b1d2f.jpg?v=1776067765",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3ba015c7-fdba-452f-ab9d-f6638c037430.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_575cb588-fec7-4a11-985f-b613c0133a09.jpg?v=1776067764",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3ae38457-eee0-4d55-9f02-904dde402d8e.jpg?v=1776067764"
    ],
    "price": 899,
    "upi_price": 799
  },
  {
    "id": 21,
    "handle": "obsidian-square-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Obsidian Square Rounded Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_e85b471e-5e8a-4a86-925d-29f2558f1cc6.jpg?v=1776068893",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_fad8c7f0-c4f8-4809-b1f4-aef838a01bbf.jpg?v=1776068893",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_065b446b-b909-4102-9868-299a252752bf.jpg?v=1776068893",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_eb32a2c5-eafa-41a4-a899-395ad3e9140f.jpg?v=1776068893",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8f00a682-de23-4f0b-9c36-ddd31ecaa83e.jpg?v=1776068893",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0b03083a-c9c3-4783-9864-bce1b943db5c.jpg?v=1776068893",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_07373885-d9fe-4b35-b620-027314cb1547.jpg?v=1776068893"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 22,
    "handle": "olive-frost-rounded-shiv-shakti-modern-lux-series",
    "title": "Olive Frost Rounded — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_643cde16-6d96-4bbc-846e-c65e055296a4.jpg?v=1776066942",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_05417830-ffed-4884-948c-9827f39e4f72.jpg?v=1776066943",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_041f217f-e16c-4867-89c6-4a576a89d003.jpg?v=1776066942",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9a6d697f-b671-4ba5-a646-f88bd6921271.jpg?v=1776066942",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_acb5ef13-d9ef-4a42-9065-036fa8a372d6.jpg?v=1776066942",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_17cb6297-a1df-4794-96c1-0d629e77c744.jpg?v=1776066942",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0b9cd53a-527c-44d9-a629-51aa114f393d.jpg?v=1776066942"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 23,
    "handle": "onyx-hex-geometric-frames-shiv-shakti-modern-lux-series",
    "title": "Onyx Hex Geometric Frames — Studio Modern Series",
    "category": "Aesthetic Trends",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_587703cf-b2b1-461a-9996-0d9c2da3d835.jpg?v=1776061872",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_676880bf-9860-41a3-94a4-13d7b41c45a3.jpg?v=1776061872",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_caad09f9-c097-45b5-99b7-7a7dc1488388.jpg?v=1776061872",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_e8c8e507-7d1b-4ffa-9b13-71b379e662fc.jpg?v=1776061872",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3bb471cf-14b1-4129-9aa2-d3492efb8b2b.jpg?v=1776061872",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_513d112b-634b-48c2-8b50-2c13e2dc2262.jpg?v=1776061872"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 24,
    "handle": "onyx-tortoise-classic-shiv-shakti-modern-lux-series",
    "title": "Onyx Tortoise Classic — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0069ab9d-6c59-4a31-99f8-8d8006319471.jpg?v=1776065735",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_319b396b-6e04-4e10-933d-920dcb6abcd3.jpg?v=1776065735",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_92a3c4b9-8bbb-41f0-ae80-8fb6457e98dc.jpg?v=1776065735",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_64f7215f-f144-4586-8c89-b5d3e7333bb8.jpg?v=1776065735",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_79693e45-187a-4d3a-ab80-4f786814c536.jpg?v=1776065735",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_693ae6c1-957e-449d-819a-07d7eca1fc1f.jpg?v=1776065735",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_2a27694d-2c86-4c21-b485-653188c3fbf7.jpg?v=1776065735"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 25,
    "handle": "royal-panther-rimless-gradients-shiv-shakti-modern-lux",
    "title": "Royal Panther Rimless Gradients — Modern Lux Edition",
    "category": "Aesthetic Trends",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_834aff56-6f41-4da3-93b2-40ef70dd1304.jpg?v=1776063910",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3e8888ef-1232-471a-ab93-faac4157d98a.jpg?v=1776063909",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_b1adbaf5-1e69-4843-8a9f-14951e7780fd.jpg?v=1776063909",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_6cbee7e9-63fb-40d3-a48f-d4a0b81d371e.jpg?v=1776063909",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_93750fdc-dd72-4b3c-82c1-aec9fca0eb21.jpg?v=1776063909",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4d049d09-2e6a-429b-85f4-e6944a6b2189.jpg?v=1776063909",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_395ea240-2762-4373-bc46-97c7cedb1352.jpg?v=1776063910"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 26,
    "handle": "ruby-crystal-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Ruby Crystal Rounded Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8c3af7b7-a311-4f32-af16-196bc941eff1.jpg?v=1776068613",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_25ae9577-e999-4a25-a995-b86188a6b614.jpg?v=1776068445",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d1d5269f-248a-4e19-8d7a-30efaef1e013.jpg?v=1776068445",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_62f6dfd3-082f-4299-bac2-fa8bec8440e8.jpg?v=1776068445",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_7758c58e-c324-4ed0-93b3-ea208d9031f0.jpg?v=1776068445",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4a949a60-eb38-4fe0-bf7b-068d8b6c0830.jpg?v=1776068445",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_eeb422e2-a43b-43d7-90c8-1dca684bfc72.jpg?v=1776068445"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 27,
    "handle": "shadow-edge-minimalist-acetates",
    "title": "Shadow Edge Minimalist Acetates — Studio Aesthetic",
    "category": "Classic Lifestyle",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/IMG-20260408_191604.jpg?v=1775656033",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/IMG-20260408_191637.jpg?v=1775656033",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/IMG-20260408_191630.jpg?v=1775656034",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_c64f7f00-e48d-415d-bf0d-7177ad403140.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_6c9979e4-9b4f-4106-8359-22513fe2051b.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_2cda2230-cbee-4062-9cd7-9091cc6f5c46.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8ade1bae-deac-4644-adc3-b7ff66020299.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_fde300da-d449-4807-b010-e50d2280721a.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_80fd06e9-59b5-4f08-9032-3a7349fdf4c5.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_207444d0-27ea-48e4-aa4c-f50520afd09b.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3fd0bb6f-66ec-4da0-8709-3e3e82552cf6.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_6a97b0d8-a208-4857-983f-dcec1cb23ade.jpg?v=1775660848",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_a15ebd4e-6742-4904-b286-23e0c0d8aec3.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_b82f8cdf-3fde-4087-ba37-7516eddc4628.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_9fbde594-ed28-42e2-b54d-0e8ce2f3a8f1.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_e0f356db-bd33-4ba6-949a-e66a2d940f96.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_4307691c-f22b-45ce-bea2-708e958a6f0d.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_af0e0716-d200-4027-91f3-59bcab167752.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_7bfb3ced-1541-4725-9d4a-8ca6d1c3dae8.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_6f596826-24a9-4bd4-a15e-49d7f00fbb9c.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8c79edbf-59b8-4ab2-af8b-eedeedcca76a.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_854856a2-9afc-4628-a40d-5010fc60b6c2.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_c6f38d56-a9cf-4e50-b86e-ff77fd03aa8a.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_6fd09b88-6e3c-43a6-bd05-854e92498aa3.jpg?v=1775660845",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d3641b00-5552-43b4-a298-3f4d9d337157.jpg?v=1775660844",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_98ab99dc-587e-4611-aedd-7fbd5b481015.jpg?v=1775660844"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 28,
    "handle": "shadow-mist-rounded-squares-shiv-shakti-modern-lux-series",
    "title": "Shadow Mist Rounded Squares — Studio Modern Series",
    "category": "Classic Lifestyle",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8506b9c9-7016-4fe4-a85a-8aba824c979c.jpg?v=1776066534",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_c9431552-47db-46ef-8808-dfe253f69b96.jpg?v=1776066534",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_02cc0d73-a9dd-4f22-b164-046189690c8f.jpg?v=1776066535",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_7163fadc-b4d4-41db-aeae-ee860a0bf0c9.jpg?v=1776066536",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_92e67e0d-0c7d-49d9-915c-5dcbc9aaf636.jpg?v=1776066534",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_2734cdff-8631-4870-a0bc-144f6df2a4db.jpg?v=1776066534"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 29,
    "handle": "silver-shadow-rimless-rectangles-shiv-shakti-modern-lux",
    "title": "Silver Shadow Rimless Rectangles — Modern Lux Edition",
    "category": "Aesthetic Trends",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_8d6b0f3d-b8c2-4bc7-b6d8-e0520f716e18.jpg?v=1776063695",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_fd36aaa9-faa2-4d7e-9e7e-4cf2ae32f0c6.jpg?v=1776063695",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5fab3a56-f97f-4556-a609-dd95a7224afd.jpg?v=1776063695",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0018ee68-8091-40c0-91cc-7d9d5c68e5b2.jpg?v=1776063697",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_786b3940-cbc1-4304-a9ee-6e32320b7c8a.jpg?v=1776063695",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_847b3f22-ecf2-44aa-8b28-0a36aa37efe5.jpg?v=1776063695"
    ],
    "price": 799,
    "upi_price": 699
  },
  {
    "id": 30,
    "handle": "the-mewar-vintages-shiv-shakti-modern-lux-series",
    "title": "The Mewar Vintages— Studio Modern Series",
    "category": "Aesthetic Trends",
    "new_price": 799,
    "cod_price": 799,
    "compare_at": 1999,
    "images": [
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_3ae241a8-c297-41fe-b995-2b93d858deb1.jpg?v=1776065121",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_f7df04ed-e0ed-45b9-a15a-c5ba8b8e9526.jpg?v=1776065122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_0c7ca629-126b-4459-9462-4c38117e876f.jpg?v=1776065122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_b12b1a57-4a0f-48ea-9bfe-c9597f49a03e.jpg?v=1776065122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_bc6d4214-3c4b-4ecd-bb43-36d4ee9c805f.jpg?v=1776065122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_d7755225-eb11-4a7e-9b92-ca0af6ccf0a0.jpg?v=1776065122",
      "https://cdn.shopify.com/s/files/1/0716/7636/2863/files/rn-image_picker_lib_temp_5e8ce7ff-4ab7-4075-8c84-41bce3301027.jpg?v=1776065122"
    ],
    "price": 799,
    "upi_price": 699
  }
];

    // State Variables