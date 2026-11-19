#!/usr/bin/env python3
"""
Generate an editable, formula-driven 12-month Excel financial model (.xlsx)
for AI-Powered Business Challenge 2026 and sync canonical KPIs to brief/NUMBERS.json.
"""

import argparse
import json
import math
import sys
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter


NAVY = "1B2A4A"
SLATE = "334155"
LIGHT_BG = "F1F5F9"
INPUT_BG = "E0F2FE"
ACCENT_BG = "ECFDF5"
WARN_BG = "FEF3C7"
BORDER_GRAY = "CBD5E1"

thin_side = Side(style="thin", color=BORDER_GRAY)
cell_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)


def style_header(ws, row: int, max_col: int, fill_hex: str = NAVY):
    fill = PatternFill("solid", fgColor=fill_hex)
    font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    for col in range(1, max_col + 1):
        c = ws.cell(row=row, column=col)
        c.fill = fill
        c.font = font
        c.alignment = Alignment(horizontal="center" if col > 1 else "left", vertical="center")
        c.border = cell_border
    ws.row_dimensions[row].height = 24


def auto_fit_columns(ws, min_width: int = 12, max_width: int = 44):
    for col_cells in ws.columns:
        col_idx = col_cells[0].column
        length = min_width
        for cell in col_cells:
            val = "" if cell.value is None else str(cell.value)
            if val.startswith("="):
                val = "123,456.00"
            length = max(length, min(max_width, len(val) + 4))
        ws.column_dimensions[get_column_letter(col_idx)].width = length


def build_workbook(cfg: dict, out_xlsx: Path) -> dict:
    project_name = cfg.get("project_name", "Startup Demo")
    currency = cfg.get("currency", "RON")
    pricing_model = cfg.get("pricing_model", "Abonament lunar")
    unit_price = float(cfg["unit_price"])
    unit_label = cfg.get("unit_label", f"{currency} / lună")
    variable_cost = float(cfg["variable_cost_per_unit"])
    cac = float(cfg["cac"])
    churn = float(cfg["monthly_churn_rate"])
    initial_setup = float(cfg.get("initial_setup_cost", 0))
    fixed_costs_items = cfg.get("fixed_costs_breakdown", [
        {"name": "Infrastructură Cloud & AI", "monthly_amount": 1500, "note": "Hosting, API, mentenanță"},
        {"name": "Marketing & Comunicare de bază", "monthly_amount": 2000, "note": "Promovare organică + ads"},
        {"name": "Operațiuni & Contabilitate", "monthly_amount": 1500, "note": "Contabilitate, juridic, unelte"},
    ])
    new_customers = [int(x) for x in cfg["monthly_new_customers"]]
    if len(new_customers) != 12:
        raise ValueError("monthly_new_customers trebuie să conțină exact 12 valori (L1..L12).")

    num_fmt = f'#,##0 "{currency}"'
    pct_fmt = "0.0%"
    int_fmt = "#,##0"

    wb = Workbook()

    # ============================================================
    # SHEET 1: Ipoteze & Sumar
    # ============================================================
    ws1 = wb.active
    ws1.title = "Ipoteze & Sumar"
    ws1.views.sheetView[0].showGridLines = True

    ws1["A1"] = f"MODEL FINANCIAR (SCENARIU DE BAZĂ — 12 LUNI) — {project_name}"
    ws1["A1"].font = Font(name="Calibri", size=14, bold=True, color=NAVY)
    ws1.merge_cells("A1:D1")
    ws1["A2"] = "Celulele albastre sunt ipoteze editabile. Toate celelalte valori sunt calculate automat prin formule Excel."
    ws1["A2"].font = Font(name="Calibri", size=10, italic=True, color=SLATE)
    ws1.merge_cells("A2:D2")

    # Table 1: Core Assumptions
    ws1.append([])
    ws1.append(["1. IPOTEZE PRINCIPALE", "Valoare", "Unitate", "Sursă / Justificare"])
    style_header(ws1, 4, 4)

    assumptions_rows = [
        ("Preț unitar / abonament", unit_price, unit_label, cfg.get("price_note", "Aliniat la brief / piață"), num_fmt),
        ("Cost variabil per client / lună", variable_cost, f"{currency} / client", cfg.get("variable_cost_note", "Plăți, API, suport variabil"), num_fmt),
        ("Cost achiziție client (CAC)", cac, f"{currency} / client nou", cfg.get("cac_note", "Marketing + conversie"), num_fmt),
        ("Rată lunară de pierdere clienți (Churn)", churn, "% / lună", cfg.get("churn_note", "Estimare prudentă B2B/B2C"), pct_fmt),
        ("Investiție inițială (Luna 0)", initial_setup, currency, cfg.get("setup_note", "Lansare MVP, branding, legal"), num_fmt),
    ]
    input_fill = PatternFill("solid", fgColor=INPUT_BG)
    for idx, (label, val, unit, note, fmt) in enumerate(assumptions_rows, start=5):
        ws1.cell(row=idx, column=1, value=label).border = cell_border
        c_val = ws1.cell(row=idx, column=2, value=val)
        c_val.number_format = fmt
        c_val.fill = input_fill
        c_val.font = Font(name="Calibri", size=11, bold=True, color="0369A1")
        c_val.border = cell_border
        ws1.cell(row=idx, column=3, value=unit).border = cell_border
        ws1.cell(row=idx, column=4, value=note).border = cell_border

    # Named row references on Sheet 1:
    # B5 = Unit Price, B6 = Variable Cost, B7 = CAC, B8 = Churn, B9 = Initial Setup

    # Table 2: Monthly Fixed Costs Breakdown
    fc_header_row = 11
    ws1.cell(row=fc_header_row, column=1, value="2. COSTURI FIXE LUNARE")
    ws1.cell(row=fc_header_row, column=2, value="Sumă lunară")
    ws1.cell(row=fc_header_row, column=3, value="Unitate")
    ws1.cell(row=fc_header_row, column=4, value="Detalii")
    style_header(ws1, fc_header_row, 4, SLATE)

    fc_start = fc_header_row + 1
    for offset, item in enumerate(fixed_costs_items):
        r = fc_start + offset
        ws1.cell(row=r, column=1, value=item["name"]).border = cell_border
        c_amt = ws1.cell(row=r, column=2, value=float(item["monthly_amount"]))
        c_amt.number_format = num_fmt
        c_amt.fill = input_fill
        c_amt.font = Font(name="Calibri", size=11, bold=True, color="0369A1")
        c_amt.border = cell_border
        ws1.cell(row=r, column=3, value=f"{currency} / lună").border = cell_border
        ws1.cell(row=r, column=4, value=item.get("note", "")).border = cell_border

    fc_end = fc_start + len(fixed_costs_items) - 1
    fc_total_row = fc_end + 1
    ws1.cell(row=fc_total_row, column=1, value="TOTAL COSTURI FIXE LUNARE").font = Font(bold=True)
    c_fc_tot = ws1.cell(row=fc_total_row, column=2, value=f"=SUM(B{fc_start}:B{fc_end})")
    c_fc_tot.number_format = num_fmt
    c_fc_tot.font = Font(bold=True)
    ws1.cell(row=fc_total_row, column=3, value=f"{currency} / lună")
    ws1.cell(row=fc_total_row, column=4, value="Calculat automat (SUM)")
    for col in range(1, 5):
        ws1.cell(row=fc_total_row, column=col).fill = PatternFill("solid", fgColor=LIGHT_BG)
        ws1.cell(row=fc_total_row, column=col).border = cell_border

    # Table 3: KPI Summary (All formulas!)
    kpi_header_row = fc_total_row + 2
    ws1.cell(row=kpi_header_row, column=1, value="3. REZULTATE ESTIMATE AN 1 & INDICATORI CHEIE (FORMULE)")
    ws1.cell(row=kpi_header_row, column=2, value="Valoare")
    ws1.cell(row=kpi_header_row, column=3, value="Unitate")
    ws1.cell(row=kpi_header_row, column=4, value="Interpretare")
    style_header(ws1, kpi_header_row, 4, NAVY)

    kpi_rows = [
        ("Venit total An 1", "='Proiectie 12 Luni'!N7", currency, "Suma veniturilor L1–L12", num_fmt),
        ("Costuri totale An 1 (incl. Luna 0)", "='Proiectie 12 Luni'!N11+B9", currency, "Costuri fixe + variabile + CAC + investiție inițială", num_fmt),
        ("Rezultat net estimat An 1 (Profit / Pierdere)", "='Proiectie 12 Luni'!N12-B9", currency, "Venit total An 1 minus toate costurile", num_fmt),
        ("Marjă brută unitară (%)", "=IF(B5>0,(B5-B6)/B5,0)", "%", "(Preț - Cost variabil) / Preț", pct_fmt),
        ("Prag de rentabilitate lunar (clienți activi)", f"=IF((B5-B6)>0,ROUNDUP(B{fc_total_row}/(B5-B6),0),0)", "clienți activi", "Clienți necesari pt. acoperirea costurilor fixe lunare", int_fmt),
        ("Luna estimată de Break-Even operațional", "=IFERROR(MATCH(TRUE,INDEX('Proiectie 12 Luni'!B12:M12>=0,0),0),0)", "luna # (0 = >L12)", "Prima lună cu profit operațional >= 0", int_fmt),
        ("Raport LTV / CAC estimat", "=IF(AND(B7>0,B8>0),((B5-B6)/B8)/B7,0)", "x", "Sănătos >= 3.0x", "0.0\"x\""),
    ]
    accent_fill = PatternFill("solid", fgColor=ACCENT_BG)
    for offset, (label, formula, unit, note, fmt) in enumerate(kpi_rows, start=1):
        r = kpi_header_row + offset
        ws1.cell(row=r, column=1, value=label).font = Font(bold=True)
        c_f = ws1.cell(row=r, column=2, value=formula)
        c_f.number_format = fmt
        c_f.font = Font(bold=True, color=NAVY)
        ws1.cell(row=r, column=3, value=unit)
        ws1.cell(row=r, column=4, value=note)
        for col in range(1, 5):
            ws1.cell(row=r, column=col).fill = accent_fill if offset in (1, 3, 5) else PatternFill("solid", fgColor="FFFFFF")
            ws1.cell(row=r, column=col).border = cell_border

    # ============================================================
    # SHEET 2: Proiectie 12 Luni
    # ============================================================
    ws2 = wb.create_sheet(title="Proiectie 12 Luni")
    ws2["A1"] = f"PROIECȚIE LUNARĂ (12 LUNI — SCENARIU DE BAZĂ) — {project_name}"
    ws2["A1"].font = Font(name="Calibri", size=14, bold=True, color=NAVY)
    ws2.merge_cells("A1:N1")

    headers = ["Indicator"] + [f"L{m}" for m in range(1, 13)] + ["TOTAL AN 1"]
    for col, h in enumerate(headers, start=1):
        ws2.cell(row=3, column=col, value=h)
    style_header(ws2, 3, 14, NAVY)

    row_labels = [
        (4, "Clienți noi achiziționați", int_fmt, True),
        (5, "Clienți pierduți (Churn)", int_fmt, False),
        (6, "Clienți activi la final de lună", int_fmt, False),
        (7, f"VENITURI LUNARE ({currency})", num_fmt, False),
        (8, f"Costuri variabile ({currency})", num_fmt, False),
        (9, f"Costuri achiziție clienți / CAC ({currency})", num_fmt, False),
        (10, f"Costuri fixe lunare ({currency})", num_fmt, False),
        (11, f"TOTAL COSTURI OPERAȚIONALE ({currency})", num_fmt, False),
        (12, f"PROFIT OPERAȚIONAL LUNAR ({currency})", num_fmt, False),
        (13, f"CASH-FLOW CUMULAT (incl. Luna 0) ({currency})", num_fmt, False),
    ]

    for r, label, _, _ in row_labels:
        c = ws2.cell(row=r, column=1, value=label)
        c.font = Font(bold=(r in (7, 11, 12, 13)))
        c.border = cell_border

    for m in range(1, 13):
        col = m + 1  # B=2 .. M=13
        col_l = get_column_letter(col)
        prev_l = get_column_letter(col - 1)

        # Row 4: New customers (input)
        c4 = ws2.cell(row=4, column=col, value=new_customers[m - 1])
        c4.fill = input_fill
        c4.font = Font(bold=True, color="0369A1")

        # Row 5: Churned customers
        if m == 1:
            ws2.cell(row=5, column=col, value=0)
        else:
            ws2.cell(row=5, column=col, value=f"=ROUND({prev_l}6*'Ipoteze & Sumar'!$B$8,0)")

        # Row 6: Active customers
        if m == 1:
            ws2.cell(row=6, column=col, value=f"={col_l}4")
        else:
            ws2.cell(row=6, column=col, value=f"=MAX(0,{prev_l}6-{col_l}5+{col_l}4)")

        # Row 7: Revenue
        ws2.cell(row=7, column=col, value=f"={col_l}6*'Ipoteze & Sumar'!$B$5")

        # Row 8: Variable costs
        ws2.cell(row=8, column=col, value=f"={col_l}6*'Ipoteze & Sumar'!$B$6")

        # Row 9: CAC spend
        ws2.cell(row=9, column=col, value=f"={col_l}4*'Ipoteze & Sumar'!$B$7")

        # Row 10: Fixed costs
        ws2.cell(row=10, column=col, value=f"='Ipoteze & Sumar'!$B${fc_total_row}")

        # Row 11: Total op costs
        ws2.cell(row=11, column=col, value=f"=SUM({col_l}8:{col_l}10)")

        # Row 12: Monthly operating profit
        ws2.cell(row=12, column=col, value=f"={col_l}7-{col_l}11")

        # Row 13: Cumulative cash flow (including initial setup cost in Month 0)
        if m == 1:
            ws2.cell(row=13, column=col, value=f"=-'Ipoteze & Sumar'!$B$9+{col_l}12")
        else:
            ws2.cell(row=13, column=col, value=f"={prev_l}13+{col_l}12")

    # Column N (14): TOTAL AN 1
    ws2.cell(row=4, column=14, value="=SUM(B4:M4)")
    ws2.cell(row=5, column=14, value="=SUM(B5:M5)")
    ws2.cell(row=6, column=14, value="=M6")  # ending active customers
    for r in (7, 8, 9, 10, 11, 12):
        ws2.cell(row=r, column=14, value=f"=SUM(B{r}:M{r})")
    ws2.cell(row=13, column=14, value="=M13")

    # Formatting Sheet 2
    for r, _, fmt, _ in row_labels:
        for col in range(2, 15):
            c = ws2.cell(row=r, column=col)
            c.number_format = fmt
            c.border = cell_border
            if r in (7, 11, 12, 13):
                c.font = Font(bold=True)
                c.fill = PatternFill("solid", fgColor=ACCENT_BG if r in (7, 12) else LIGHT_BG)
            elif col == 14:
                c.font = Font(bold=True)
                c.fill = PatternFill("solid", fgColor=LIGHT_BG)

    auto_fit_columns(ws1)
    auto_fit_columns(ws2, min_width=13, max_width=36)

    # Force Excel & Google Sheets to recalculate all 125+ formulas immediately on open
    wb.calculation.fullCalcOnLoad = True

    out_xlsx.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out_xlsx)

    # Mirror exact Excel math in Python for NUMBERS.json & finance_summary.md
    fixed_total = sum(float(x["monthly_amount"]) for x in fixed_costs_items)
    active_list, rev_list, op_cost_list, profit_list, cf_list = [], [], [], [], []
    prev_active = 0
    prev_cf = -initial_setup
    be_month = 0
    for m in range(12):
        churned = 0 if m == 0 else int(round(prev_active * churn))
        active = max(0, prev_active - churned + new_customers[m])
        rev = active * unit_price
        var_c = active * variable_cost
        cac_c = new_customers[m] * cac
        op_c = var_c + cac_c + fixed_total
        prof = rev - op_c
        cf = prev_cf + prof
        if be_month == 0 and prof >= 0:
            be_month = m + 1
        active_list.append(active)
        rev_list.append(rev)
        op_cost_list.append(op_c)
        profit_list.append(prof)
        cf_list.append(cf)
        prev_active = active
        prev_cf = cf

    total_rev = round(sum(rev_list), 2)
    total_costs = round(sum(op_cost_list) + initial_setup, 2)
    net_profit = round(total_rev - total_costs, 2)
    gross_margin_pct = round(((unit_price - variable_cost) / unit_price) * 100, 1) if unit_price > 0 else 0.0
    be_units = math.ceil(fixed_total / (unit_price - variable_cost)) if (unit_price - variable_cost) > 0 else 0
    ltv_to_cac = round(((unit_price - variable_cost) / churn) / cac, 2) if (cac > 0 and churn > 0) else 0.0

    return {
        "project_name": project_name,
        "currency": currency,
        "pricing_model": pricing_model,
        "unit_price": unit_price,
        "unit_label": unit_label,
        "starting_customers_m1": new_customers[0],
        "ending_customers_m12": active_list[-1],
        "monthly_new_customers_avg": round(sum(new_customers) / 12, 1),
        "monthly_churn_rate": churn,
        "cac": cac,
        "variable_cost_per_unit": variable_cost,
        "monthly_fixed_costs": round(fixed_total, 2),
        "initial_setup_cost": initial_setup,
        "total_revenue": total_rev,
        "total_costs": total_costs,
        "net_profit": net_profit,
        "break_even_month": be_month,
        "break_even_units_per_month": be_units,
        "gross_margin_pct": gross_margin_pct,
        "ltv_to_cac": ltv_to_cac,
        "ending_cash_flow": round(cf_list[-1], 2),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build formula-based Excel financial model.")
    parser.add_argument("input_json", type=Path)
    parser.add_argument("output_xlsx", type=Path)
    parser.add_argument("--sync-numbers", type=Path, default=None)
    parser.add_argument("--summary-md", type=Path, default=None)
    args = parser.parse_args()

    cfg = json.loads(args.input_json.read_text(encoding="utf-8"))
    summary = build_workbook(cfg, args.output_xlsx)
    print(f"[OK] Generat workbook cu formule Excel reale: {args.output_xlsx}")

    if args.sync_numbers:
        existing = {}
        if args.sync_numbers.exists():
            existing = json.loads(args.sync_numbers.read_text(encoding="utf-8"))
        synced = {
            "status": "LOCKED",
            "project_name": summary["project_name"],
            "output_language": existing.get("output_language", "ro"),
            "currency": summary["currency"],
            "horizon_months": 12,
            "live_app_url": existing.get("live_app_url", "TBD"),
            "ui_contract": existing.get("ui_contract", {
                "demo_button_label": "TBD",
                "primary_cta_label": "TBD",
                "demo_input_summary": "TBD",
                "demo_expected_output": "TBD",
            }),
            "pricing": {
                "model": summary["pricing_model"],
                "unit_price": summary["unit_price"],
                "unit_label": summary["unit_label"],
            },
            "assumptions": {
                "starting_customers_m1": summary["starting_customers_m1"],
                "ending_customers_m12": summary["ending_customers_m12"],
                "monthly_new_customers_avg": summary["monthly_new_customers_avg"],
                "monthly_churn_rate": summary["monthly_churn_rate"],
                "cac": summary["cac"],
                "variable_cost_per_unit": summary["variable_cost_per_unit"],
                "monthly_fixed_costs": summary["monthly_fixed_costs"],
                "initial_setup_cost": summary["initial_setup_cost"],
            },
            "summary_year_1": {
                "total_revenue": summary["total_revenue"],
                "total_costs": summary["total_costs"],
                "net_profit": summary["net_profit"],
                "break_even_month": summary["break_even_month"],
                "break_even_units_per_month": summary["break_even_units_per_month"],
                "gross_margin_pct": summary["gross_margin_pct"],
                "ltv_to_cac": summary["ltv_to_cac"],
            },
            "brief_data_references": existing.get("brief_data_references", []),
        }
        args.sync_numbers.write_text(json.dumps(synced, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"[OK] Sincronizat & blocat: {args.sync_numbers}")

    if args.summary_md:
        cur = summary["currency"]
        md = f"""# Rezumat Model Financiar — {summary['project_name']}

> **Status:** `LOCKED` (sincronizat automat din `financial_model.xlsx` cu formule reale Excel)

| Indicator (Anul 1 — Scenariu de bază) | Valoare |
| :--- | :--- |
| **Model de preț** | {summary['pricing_model']} ({summary['unit_price']:,.0f} {summary['unit_label']}) |
| **Cost variabil unitar** | {summary['variable_cost_per_unit']:,.0f} {cur} / client / lună |
| **Marjă brută unitară** | {summary['gross_margin_pct']}% |
| **Cost achiziție client (CAC)** | {summary['cac']:,.0f} {cur} |
| **Costuri fixe lunare** | {summary['monthly_fixed_costs']:,.0f} {cur} / lună |
| **Investiție inițială (L0)** | {summary['initial_setup_cost']:,.0f} {cur} |
| **Clienți activi (L1 → L12)** | {summary['starting_customers_m1']} → {summary['ending_customers_m12']} |
| **Venit total An 1** | **{summary['total_revenue']:,.0f} {cur}** |
| **Costuri totale An 1 (incl. L0)** | {summary['total_costs']:,.0f} {cur} |
| **Rezultat net An 1** | **{summary['net_profit']:,.0f} {cur}** |
| **Prag de rentabilitate lunar** | **{summary['break_even_units_per_month']} clienți activi** (atins în **Luna {summary['break_even_month']}**) |
| **Raport LTV / CAC** | **{summary['ltv_to_cac']}x** |
"""
        args.summary_md.write_text(md, encoding="utf-8")
        print(f"[OK] Generat sumar Markdown: {args.summary_md}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
