import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { MetadataSetting } from '../types';

const TAB_NAME = 'Metadata';

export async function getFactorySettings(): Promise<Record<string, string>> {
  const rows = await syncManager.getRows(TAB_NAME);
  const meta = rowsToObjects(rows, mappers.rowToMetadata);
  const settings: Record<string, string> = {
    company_name: 'PRESTON RETRO',
    company_logo: '',
    user_name: 'Aman Raj',
    app_pin: '1234',
    gst_number: '24ABIFP5127C1ZJ',
    factory_address: 'Hussain tekri, Palanpur highway, Kanodar, Gujarat',
    phone_number: '8758206574',
    billing_email: 'Pp321753@gmail.com',
    invoice_prefix: 'INV-',
    currency: '₹',
  };

  meta.forEach(item => {
    if (item.key) {
      if (item.key === 'app_pin') {
        // Ensure 4 digits, preserving leading zeroes if Google Sheets treated 0000 as 0
        settings[item.key] = String(item.value ?? '').padStart(4, '0');
      } else {
        settings[item.key] = String(item.value ?? '');
      }
    }
  });

  return settings;
}

export async function updateFactorySetting(key: string, value: string): Promise<void> {
  const rows = await syncManager.getRows(TAB_NAME);
  const meta = rowsToObjects(rows, mappers.rowToMetadata);
  const target = meta.find(m => m.key === key);

  // In Google Sheets USER_ENTERED, prefix with ' so strings with leading zeros like '0000' stay text
  const formattedValue = key === 'app_pin' ? `'${value}` : value;

  if (target) {
    await syncManager.updateRow(TAB_NAME, (target as any)._rowIndex, [key, formattedValue]);
  } else {
    await syncManager.appendRow(TAB_NAME, [key, formattedValue]);
  }
}
