import fs from 'fs';
import crypto from 'crypto';

// Load .env
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/\\n/g, '\n');
    }
    env[match[1].trim()] = val;
  }
});

const clientEmail = env.GOOGLE_CLIENT_EMAIL;
const privateKey = env.GOOGLE_PRIVATE_KEY;
const spreadsheetId = env.GOOGLE_SHEET_ID || env.GOOGLE_SPREADSHEET_ID;

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${encode(header)}.${encode(claimSet)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

const SHEETS_SCHEMA = {
  Products: [
    ['product_id', 'sku', 'product_name', 'category', 'color', 'size', 'cost_price', 'selling_price', 'stock', 'min_stock', 'fabric_gsm', 'description', 'is_active', 'created_at', 'updated_at'],
    ['prod_ct001', 'CT-001', 'Cotton Heavy Crew Tee', 'T-Shirts', 'Matte Black', 'S, M, L, XL', 310, 899, 5, 20, '220 GSM', '100% Combed Compact Cotton', 'TRUE', '2025-01-10T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['prod_hd002', 'HD-002', 'Oversized Fleece Hoodie', 'Hoodies', 'Heather Grey', 'M, L, XL', 680, 1899, 184, 30, '380 GSM', 'French Terry Brushed Cotton', 'TRUE', '2025-01-10T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['prod_dj004', 'DJ-004', 'Raw Selvedge Denim Jacket', 'Denim & Jackets', 'Deep Indigo', 'S, M, L', 980, 2499, 12, 25, '14.5 Oz', 'Indigo Ring-Spun Twill', 'TRUE', '2025-01-10T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['prod_ls007', 'LS-007', 'Pure Linen Mandarin Shirt', 'Shirts', 'Sage Green', '38, 40, 42, 44', 520, 1599, 76, 25, '60 LEA', '100% Normandy Flax Linen', 'TRUE', '2025-01-10T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['prod_tp011', 'TP-011', 'Heavy Ribbed Track Pants', 'Track Pants', 'Dark Charcoal', 'S, M, L, XL', 410, 1199, 64, 20, '280 GSM', 'Combed Cotton Interlock', 'TRUE', '2025-01-10T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['prod_fs003', 'FS-003', 'Classic Oxford Formal Shirt', 'Shirts', 'Optical White', '39, 40, 42, 44', 470, 1399, 0, 30, '80/2 Twill', 'Giza Cotton Egyptian Weave', 'TRUE', '2025-01-10T10:00:00Z', '2025-05-26T10:00:00Z']
  ],
  StockMovements: [
    ['movement_id', 'product_id', 'sku', 'type', 'qty', 'reason', 'date', 'created_at'],
    ['mov_001', 'prod_ct001', 'CT-001', 'IN', 100, 'Initial Production Batch #B-38', '2025-05-01', '2025-05-01T10:00:00Z'],
    ['mov_002', 'prod_ct001', 'CT-001', 'OUT', 95, 'Order dispatch to wholesale buyers', '2025-05-20', '2025-05-20T14:30:00Z'],
    ['mov_003', 'prod_hd002', 'HD-002', 'IN', 200, 'Production Batch #B-40', '2025-05-10', '2025-05-10T09:00:00Z'],
    ['mov_004', 'prod_hd002', 'HD-002', 'OUT', 16, 'Invoice #INV-1043 fulfillment', '2025-05-26', '2025-05-26T11:00:00Z'],
    ['mov_005', 'prod_dj004', 'DJ-004', 'IN', 50, 'Denim Line Run #D-12', '2025-05-05', '2025-05-05T08:00:00Z']
  ],
  Customers: [
    ['customer_id', 'name', 'phone', 'gst', 'address', 'tier', 'credit_limit', 'is_active', 'created_at', 'updated_at'],
    ['cust_ut01', 'UrbanThreads Apparel Wholesalers', '+91 98201 44892', '27AAACU9821M1Z5', 'Warehouse #48, Bhiwandi Logistics Park, Mumbai, MH - 421302', 'Tier 1 Wholesale', 150000, 'TRUE', '2024-06-15T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['cust_rt02', 'Rohan Traders', '+91 94280 11920', '24AAGCR9802L1Z9', 'Surat, GJ', 'Wholesale', 200000, 'TRUE', '2024-07-20T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['cust_mf03', 'Metro Fashions', '+91 98110 55432', '07AAAFM1109N1Z2', 'New Delhi, DL', 'Retail Chain', 100000, 'TRUE', '2024-08-11T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['cust_sh04', 'StyleHub Retail', '+91 80234 56711', '29AABCS8823K1ZV', 'Bengaluru, KA', 'Retailer', 80000, 'TRUE', '2024-09-05T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['cust_ck05', 'ClothKart Online', '+91 79401 22890', '24AAECK7712P1ZN', 'Ahmedabad, GJ', 'E-Commerce', 50000, 'TRUE', '2024-10-18T10:00:00Z', '2025-05-26T10:00:00Z'],
    ['cust_tw06', 'TrendWear Boutiques', '+91 91234 56789', '27AABCT9981K1Z3', 'Pune, MH', 'Boutique', 100000, 'TRUE', '2024-11-22T10:00:00Z', '2025-05-26T10:00:00Z']
  ],
  Payments: [
    ['payment_id', 'customer_id', 'amount', 'method', 'date', 'notes', 'reference', 'created_at'],
    ['pay_001', 'cust_ut01', 100000, 'NEFT', '2025-05-03', 'NEFT Settlement', 'HDFC22991', '2025-05-03T11:00:00Z'],
    ['pay_002', 'cust_ut01', 42000, 'Cash', '2025-05-04', 'Factory Cash Counter payment received & logged', 'CASH-0504', '2025-05-04T15:30:00Z'],
    ['pay_003', 'cust_ut01', 78400, 'Bank NEFT', '2025-05-18', 'Bank NEFT Payment received', 'NEFT9812401', '2025-05-18T12:00:00Z'],
    ['pay_004', 'cust_rt02', 12400, 'UPI', '2025-05-26', 'Full settlement for invoice #INV-1042', 'UPI-982341', '2025-05-26T13:00:00Z'],
    ['pay_005', 'cust_ck05', 24450, 'Bank Transfer', '2025-05-25', 'Advance payment for summer lot', 'IMPS-77129', '2025-05-25T16:00:00Z']
  ],
  Sales: [
    ['invoice_id', 'invoice_number', 'customer_id', 'date', 'subtotal', 'gst', 'total', 'status', 'is_active', 'created_at', 'updated_at'],
    ['inv_1038', 'INV-1038', 'cust_ck05', '2025-05-20', 8990, 460, 9450, 'Paid', 'TRUE', '2025-05-20T10:00:00Z', '2025-05-20T10:00:00Z'],
    ['inv_1039', 'INV-1039', 'cust_tw06', '2025-05-22', 20857, 1043, 21900, 'Unpaid', 'TRUE', '2025-05-22T11:15:00Z', '2025-05-22T11:15:00Z'],
    ['inv_1040', 'INV-1040', 'cust_mf03', '2025-05-23', 6000, 300, 6300, 'Unpaid', 'TRUE', '2025-05-23T14:20:00Z', '2025-05-23T14:20:00Z'],
    ['inv_1041', 'INV-1041', 'cust_sh04', '2025-05-24', 17857, 893, 18750, 'Unpaid', 'TRUE', '2025-05-24T16:45:00Z', '2025-05-24T16:45:00Z'],
    ['inv_1042', 'INV-1042', 'cust_rt02', '2025-05-25', 11809, 591, 12400, 'Paid', 'TRUE', '2025-05-25T09:30:00Z', '2025-05-25T09:30:00Z'],
    ['inv_1043', 'INV-1043', 'cust_ut01', '2025-05-26', 55338, 2767, 58105, 'Unpaid', 'TRUE', '2025-05-26T10:00:00Z', '2025-05-26T10:00:00Z']
  ],
  SaleItems: [
    ['item_id', 'invoice_id', 'product_id', 'sku', 'quantity', 'cost_price', 'selling_price', 'created_at'],
    ['item_01', 'inv_1043', 'prod_ct001', 'CT-001', 50, 310, 899, '2025-05-26T10:00:00Z'],
    ['item_02', 'inv_1043', 'prod_hd002', 'HD-002', 20, 680, 1899, '2025-05-26T10:00:00Z'],
    ['item_03', 'inv_1043', 'prod_ls007', 'LS-007', 15, 520, 1599, '2025-05-26T10:00:00Z'],
    ['item_04', 'inv_1042', 'prod_tp011', 'TP-011', 10, 410, 1199, '2025-05-25T09:30:00Z'],
    ['item_05', 'inv_1041', 'prod_ls007', 'LS-007', 12, 520, 1599, '2025-05-24T16:45:00Z'],
    ['item_06', 'inv_1040', 'prod_ct001', 'CT-001', 7, 310, 899, '2025-05-23T14:20:00Z'],
    ['item_07', 'inv_1039', 'prod_dj004', 'DJ-004', 9, 980, 2499, '2025-05-22T11:15:00Z'],
    ['item_08', 'inv_1038', 'prod_tp011', 'TP-011', 8, 410, 1199, '2025-05-20T10:00:00Z']
  ],
  Expenses: [
    ['expense_id', 'title', 'category', 'amount', 'payment_method', 'date', 'notes', 'is_active', 'created_at', 'updated_at'],
    ['exp_001', 'Cotton Fabric Purchase', 'Fabric', 12500, 'Bank Transfer', '2025-05-26', '500m Raw 220 GSM Cotton roll', 'TRUE', '2025-05-26T09:00:00Z', '2025-05-26T09:00:00Z'],
    ['exp_002', 'Factory Electricity Bill', 'Electricity', 8400, 'UPI', '2025-05-25', 'Factory Floor Meter #902', 'TRUE', '2025-05-25T11:00:00Z', '2025-05-25T11:00:00Z'],
    ['exp_003', 'Worker Salary - May', 'Salary', 28000, 'Cash', '2025-05-24', 'Tailoring & cutting team advance', 'TRUE', '2025-05-24T14:00:00Z', '2025-05-24T14:00:00Z'],
    ['exp_004', 'Transport Charges', 'Transport', 3200, 'UPI', '2025-05-22', 'Bhiwandi dispatch tempo', 'TRUE', '2025-05-22T16:00:00Z', '2025-05-22T16:00:00Z'],
    ['exp_005', 'Packaging Material', 'Packaging', 4750, 'Cash', '2025-05-20', 'Poly bags & custom cardboard boxes', 'TRUE', '2025-05-20T12:00:00Z', '2025-05-20T12:00:00Z'],
    ['exp_006', 'Machine Maintenance', 'Maintenance', 6300, 'Bank Transfer', '2025-05-18', 'Juki 4-thread overlock service', 'TRUE', '2025-05-18T10:30:00Z', '2025-05-18T10:30:00Z']
  ],
  ExpenseCategories: [
    ['category_id', 'name', 'icon', 'is_active', 'created_at'],
    ['cat_01', 'Fabric', 'Shirt', 'TRUE', '2025-01-01T00:00:00Z'],
    ['cat_02', 'Thread', 'Box', 'TRUE', '2025-01-01T00:00:00Z'],
    ['cat_03', 'Packaging', 'Box', 'TRUE', '2025-01-01T00:00:00Z'],
    ['cat_04', 'Electricity', 'Zap', 'TRUE', '2025-01-01T00:00:00Z'],
    ['cat_05', 'Salary', 'Users', 'TRUE', '2025-01-01T00:00:00Z'],
    ['cat_06', 'Transport', 'Truck', 'TRUE', '2025-01-01T00:00:00Z'],
    ['cat_07', 'Machine Maintenance', 'Wrench', 'TRUE', '2025-01-01T00:00:00Z'],
    ['cat_08', 'Miscellaneous', 'DollarSign', 'TRUE', '2025-01-01T00:00:00Z']
  ],
  Metadata: [
    ['key', 'value'],
    ['last_invoice_number', '1043'],
    ['last_customer_number', '6'],
    ['company_name', 'Preston Retro Enterprise'],
    ['gst_number', '27AACCT9981K1Z3'],
    ['factory_address', 'Plot 42, Textile Industrial Estate, Bhiwandi, MH - 421302'],
    ['invoice_prefix', 'INV-'],
    ['currency', '₹']
  ]
};

async function initSheets() {
  const token = await getAccessToken();
  console.log('Got Google token. Fetching existing sheets...');

  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meta = await metaRes.json();
  const existingSheetTitles = (meta.sheets || []).map(s => s.properties.title);
  console.log('Existing sheets:', existingSheetTitles);

  const sheetsToCreate = Object.keys(SHEETS_SCHEMA).filter(title => !existingSheetTitles.includes(title));
  
  if (sheetsToCreate.length > 0) {
    console.log('Creating sheets:', sheetsToCreate);
    const addSheetRequests = sheetsToCreate.map(title => ({
      addSheet: { properties: { title } }
    }));
    const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests: addSheetRequests })
    });
    if (!batchRes.ok) {
      const err = await batchRes.json();
      throw new Error(`Failed to add sheets: ${JSON.stringify(err)}`);
    }
    console.log('Added sheets successfully.');
  }

  // Populate or update data for each sheet
  for (const [title, rows] of Object.entries(SHEETS_SCHEMA)) {
    // Check if sheet has data already
    const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!A1:B1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const checkData = await checkRes.json();
    if (!checkData.values || checkData.values.length === 0) {
      console.log(`Writing seed data to ${title} (${rows.length} rows)...`);
      const putRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(title)}!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
      });
      if (!putRes.ok) {
        console.error(`Error populating ${title}:`, await putRes.text());
      } else {
        console.log(`Successfully populated ${title}`);
      }
    } else {
      console.log(`Sheet "${title}" already has headers/data. Preserving existing data.`);
    }
  }

  console.log('\nAll sheets initialized and ready!');
}

initSheets().catch(err => {
  console.error('Initialization error:', err);
  process.exit(1);
});
