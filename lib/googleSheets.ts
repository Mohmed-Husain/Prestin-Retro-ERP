import { google } from "googleapis";

function getCredentials() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Missing Google Sheets configuration in environment variables");
  }

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  return { clientEmail, privateKey, spreadsheetId };
}

export async function getSheetsClient() {
  const { clientEmail, privateKey, spreadsheetId } = getCredentials();

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}

export async function readSheetRows(tabName: string): Promise<string[][]> {
  const { sheets, spreadsheetId } = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A1:Z`,
  });
  return (res.data.values as string[][]) || [];
}

export async function appendSheetRow(tabName: string, rowValues: (string | number | boolean)[]): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [rowValues.map(v => String(v))],
    },
  });
}

export async function updateSheetRow(
  tabName: string,
  rowIndex1Indexed: number,
  rowValues: (string | number | boolean)[]
): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A${rowIndex1Indexed}:Z${rowIndex1Indexed}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [rowValues.map(v => String(v))],
    },
  });
}

export async function batchUpdateSheetValues(
  data: { range: string; values: (string | number | boolean)[][] }[]
): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: data.map(d => ({
        range: d.range,
        values: d.values.map(r => r.map(v => String(v))),
      })),
    },
  });
}

export async function clearSheetData(tabName: string): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabName}!A2:Z`,
  });
}

export async function overwriteSheetRows(tabName: string, rows: (string | number | boolean)[][]): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabName}!A2:Z`,
  });
  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tabName}!A2`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rows.map(r => r.map(v => String(v))),
      },
    });
  }
}
