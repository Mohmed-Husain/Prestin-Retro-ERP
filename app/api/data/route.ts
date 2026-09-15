import { NextResponse } from "next/server";
import { syncManager } from "@/lib/sync";
import { mappers, rowsToObjects } from "@/lib/sheetMappings";
import * as XLSX from "xlsx";

const TRANSACTION_TABS = [
  "Products",
  "StockMovements",
  "Customers",
  "Payments",
  "Sales",
  "SaleItems",
  "Expenses",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "clear_all") {
      for (const tab of TRANSACTION_TABS) {
        await syncManager.clearTab(tab);
      }
      return NextResponse.json({
        success: true,
        message: "All transaction and mock data cleared successfully. Table headers preserved in Google Sheets.",
      });
    }

    if (action === "import") {
      const { module, rows } = body;
      if (!module || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Module name and valid rows array are required" },
          { status: 400 }
        );
      }

      let tabName = "";
      let formattedRows: (string | number | boolean)[][] = [];

      if (module === "products") {
        tabName = "Products";
        formattedRows = rows.map((r: any, idx: number) => {
          const sku = r.sku || r.SKU || "SKU-" + Date.now().toString().slice(-4) + "-" + (idx + 1);
          return [
            r.product_id || "prod_" + Date.now() + "_" + (idx + 1),
            sku,
            r.product_name || r.name || r["Product Name"] || "New Product",
            r.category || r["Category"] || "General",
            r.color || r["Color"] || "Standard",
            r.size || r["Size"] || "M",
            Number(r.cost_price || r["Cost Price"] || 0),
            Number(r.selling_price || r["Selling Price"] || 0),
            Number(r.stock || r["Stock"] || 0),
            Number(r.min_stock || r["Min Stock"] || 5),
            r.fabric_gsm || r["Fabric GSM"] || "",
            r.description || r["Description"] || "",
            "TRUE",
            r.created_at || new Date().toISOString(),
            new Date().toISOString(),
          ];
        });
      } else if (module === "customers") {
        tabName = "Customers";
        formattedRows = rows.map((r: any, idx: number) => [
          r.customer_id || "cust_" + Date.now() + "_" + (idx + 1),
          r.name || r.customer_name || r["Customer Name"] || "Customer",
          r.phone || r["Phone"] || "",
          r.gst || r.GST || r["GST"] || "",
          r.address || r["Address"] || "",
          r.tier || r["Tier"] || "Regular",
          Number(r.credit_limit || r["Credit Limit"] || 50000),
          "TRUE",
          r.created_at || new Date().toISOString(),
          new Date().toISOString(),
        ]);
      } else if (module === "expenses") {
        tabName = "Expenses";
        formattedRows = rows.map((r: any, idx: number) => [
          r.expense_id || "exp_" + Date.now() + "_" + (idx + 1),
          r.title || r["Title"] || r["Description"] || "Expense Item",
          r.category || r["Category"] || "Other",
          Number(r.amount || r["Amount"] || 0),
          r.payment_method || r["Payment Method"] || "Cash",
          r.date || r["Date"] || new Date().toISOString().split("T")[0],
          r.notes || r["Notes"] || "",
          "TRUE",
          r.created_at || new Date().toISOString(),
          new Date().toISOString(),
          String(r.type || r["Type"] || "OUTGOING").toUpperCase() === "INCOMING" ? "INCOMING" : "OUTGOING",
        ]);
      } else if (module === "sales") {
        tabName = "Sales";
        formattedRows = rows.map((r: any, idx: number) => [
          r.invoice_id || "inv_" + Date.now() + "_" + (idx + 1),
          r.invoice_number || r["Invoice Number"] || "INV-" + Date.now().toString().slice(-4),
          r.customer_id || r["Customer ID"] || "",
          r.date || r["Date"] || new Date().toISOString().split("T")[0],
          Number(r.subtotal || r["Subtotal"] || 0),
          Number(r.gst || r["GST"] || 0),
          Number(r.total || r["Total"] || 0),
          r.status || r["Status"] || "Paid",
          "TRUE",
          r.created_at || new Date().toISOString(),
          new Date().toISOString(),
        ]);
      } else {
        return NextResponse.json({ success: false, error: "Unsupported module: " + module }, { status: 400 });
      }

      await syncManager.appendRows(tabName, formattedRows);
      syncManager.invalidateCache(tabName);

      return NextResponse.json({
        success: true,
        count: formattedRows.length,
        message: "Successfully imported " + formattedRows.length + " records into " + tabName,
      });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Data route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const [productRows, customerRows, saleRows, expenseRows] = await Promise.all([
      syncManager.getRows("Products"),
      syncManager.getRows("Customers"),
      syncManager.getRows("Sales"),
      syncManager.getRows("Expenses"),
    ]);

    const products = rowsToObjects(productRows, mappers.rowToProduct);
    const customers = rowsToObjects(customerRows, mappers.rowToCustomer);
    const sales = rowsToObjects(saleRows, mappers.rowToSale);
    const expenses = rowsToObjects(expenseRows, mappers.rowToExpense);

    if (format === "excel") {
      const wb = XLSX.utils.book_new();

      const prodSheetData = products.map(p => ({
        "Product ID": p.product_id,
        "SKU": p.sku,
        "Product Name": p.product_name,
        "Category": p.category,
        "Color": p.color,
        "Size": p.size,
        "Cost Price": p.cost_price,
        "Selling Price": p.selling_price,
        "Stock": p.stock,
        "Min Stock": p.min_stock,
        "Fabric GSM": p.fabric_gsm,
      }));
      const wsProducts = XLSX.utils.json_to_sheet(prodSheetData);
      XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

      const custSheetData = customers.map(c => ({
        "Customer ID": c.customer_id,
        "Customer Name": c.name,
        "Phone": c.phone,
        "GST": c.gst,
        "Address": c.address,
        "Tier": c.tier,
        "Credit Limit": c.credit_limit,
      }));
      const wsCustomers = XLSX.utils.json_to_sheet(custSheetData);
      XLSX.utils.book_append_sheet(wb, wsCustomers, "Customers");

      const salesSheetData = sales.map(s => ({
        "Invoice ID": s.invoice_id,
        "Invoice Number": s.invoice_number,
        "Customer ID": s.customer_id,
        "Date": s.date,
        "Subtotal": s.subtotal,
        "GST": s.gst,
        "Total": s.total,
        "Status": s.status,
      }));
      const wsSales = XLSX.utils.json_to_sheet(salesSheetData);
      XLSX.utils.book_append_sheet(wb, wsSales, "Sales");

      const expenseSheetData = expenses.map(e => ({
        "Expense ID": e.expense_id,
        "Date": e.date,
        "Type": e.type || "OUTGOING",
        "Title": e.title,
        "Category": e.category,
        "Amount": e.amount,
        "Payment Method": e.payment_method,
        "Notes": e.notes || "",
      }));
      const wsExpenses = XLSX.utils.json_to_sheet(expenseSheetData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");

      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=Preston_Retro_ERP_Export_" + new Date().toISOString().split("T")[0] + ".xlsx",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        products,
        customers,
        sales,
        expenses,
      },
    });
  } catch (error: any) {
    console.error("Data export error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
