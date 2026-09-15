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
      settings[item.key] = item.value;
    }
  });

  return settings;
}

export async function updateFactorySetting(key: string, value: string): Promise<void> {
  const rows = await syncManager.getRows(TAB_NAME);
  const meta = rowsToObjects(rows, mappers.rowToMetadata);
  const target = meta.find(m => m.key === key);

  if (target) {
    await syncManager.updateRow(TAB_NAME, (target as any)._rowIndex, [key, value]);
  } else {
    await syncManager.appendRow(TAB_NAME, [key, value]);
  }
}
