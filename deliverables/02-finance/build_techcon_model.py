#!/usr/bin/env python3
"""Build the Tech-Con UR20 B2B CapEx financial model (3 formula-driven sheets, Romanian labels).

Usage:
  python deliverables/02-finance/build_techcon_model.py [--lock-numbers]

Inputs come from brief/NUMBERS.json. Every total in the workbook is a live Excel formula.
"""

import argparse
import json
import math
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.properties import PageSetupProperties

ROOT = Path(__file__).resolve().parents[2]
NUMBERS = ROOT / "brief" / "NUMBERS.json"
OUT = ROOT / "deliverables" / "02-finance" / "financial_model.xlsx"

S1 = "Buget Promovare 30k EUR"
S2 = "Model Comercial & Funnel"
S3 = "Verificare Profit Net & Riscuri"
R1 = f"'{S1}'"
R2 = f"'{S2}'"

TEAL = "0F766E"
SLATE = "0F172A"
INPUT_FILL = PatternFill("solid", fgColor="FEF3C7")
CALC_FILL = PatternFill("solid", fgColor="ECFDF5")
HEAD_FILL = PatternFill("solid", fgColor=TEAL)
MISS_FILL = PatternFill("solid", fgColor="FEE2E2")
THIN = Side(style="thin", color="CBD5E1")
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
EUR = '#,##0" EUR"'
INT = "#,##0"
PCT = "0.0%"

CHANNELS = [
    ("google_search", "Google Search (intenție activă B2B)",
     "Directori producție care caută activ automatizare paletizare"),
    ("linkedin_ads", "LinkedIn Ads (Director Producție / CapEx)",
     "Directori producție, plant manageri, directori financiari CAEN 10xx"),
    ("ur20_content_case_study", "Conținut tehnic UR20 & studiu de caz PURATOS",
     "Ingineri mentenanță și automatizări (dovezi test FAT)"),
    ("direct_marketing_crm", "Marketing direct B2B & CRM (deduplicat)",
     "Fabrici alimentare CAEN 10xx cu găleți 5-15 kg"),
    ("webinars_associations", "Webinare tehnice & asociații (ROMPAN, APRIL, Romalimenta)",
     "Membri asociații panificație, lactate, ingrediente"),
    ("web_pwa_seo_ai", "Pagină web, PaletCheck UR20 (PWA) & SEO/AI",
     "Toți vizitatorii din canalele plătite (conversie în cerere)"),
    ("adjustment_reserve", "Rezervă ajustări (distinctă)",
     "Realocare spre canalul cu cel mai mic cost/cerere relevantă"),
]
PACING = [("Q1 (ian-mar)", 0.35), ("Q2 (apr-iun)", 0.30), ("Q3 (iul-sep)", 0.20), ("Q4 (oct-dec)", 0.15)]
HUBS = [("Dragomirești-Deal", "Sud / Centru (Ilfov-București)", 9, 3),
        ("Timișoara", "Vest (Banat-Crișana)", 4, 2),
        ("Iași", "Est (Moldova)", 4, 2)]


def head(ws, row, labels, start_col=1):
    for i, text in enumerate(labels):
        c = ws.cell(row=row, column=start_col + i, value=text)
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = HEAD_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.border = BOX


def put(ws, ref, value, fmt=None, fill=None, bold=False):
    c = ws[ref]
    c.value = value
    if fmt:
        c.number_format = fmt
    if fill:
        c.fill = fill
    if bold:
        c.font = Font(bold=True, color=SLATE)
    c.border = BOX
    return c


def title(ws, text, note):
    ws["A1"] = text
    ws["A1"].font = Font(bold=True, size=14, color=TEAL)
    ws["A2"] = note
    ws["A2"].font = Font(italic=True, color="475569")


def build(numbers: dict) -> Workbook:
    alloc = numbers["promo_budget_allocation_eur"]
    ue = numbers["unit_economics"]
    fun = numbers["funnel_year_1"]

    wb = Workbook()
    ws1 = wb.active
    ws1.title = S1
    ws2 = wb.create_sheet(S2)
    ws3 = wb.create_sheet(S3)

    # ---------------- Sheet 2 first (inputs referenced everywhere) ----------------
    title(ws2, "Model comercial & funnel - Celule UR20 Tech-Con (scenariu concurs)",
          "EUR fără TVA | 1 an calendaristic (1 ian - 31 dec) | celule vândute ȘI livrate în an | galben = ipoteză editabilă")
    head(ws2, 3, ["Indicator", "Valoare", "Unitate", "Sursă / Justificare"], 2)
    rows = [
        (4, "Preț vânzare celulă UR20 (integrată, instalare, instruire)", numbers["pricing"]["unit_price"], EUR, "Brief Tech-Con, date scenariu"),
        (5, "Cost direct celulă UR20", ue["direct_cost_per_cell"], EUR, "Brief Tech-Con, date scenariu"),
        (6, "Plafon buget anual promovare", ue["annual_promo_budget_cap"], EUR, "Brief Tech-Con (plafon fix)"),
        (7, "Țintă acționari profit net / an", ue["shareholder_net_profit_target"], EUR, "Brief Tech-Con (după toate costurile și impozitul)"),
    ]
    for r, label, val, fmt, src in rows:
        put(ws2, f"B{r}", label)
        put(ws2, f"C{r}", val, fmt, INPUT_FILL)
        put(ws2, f"D{r}", "EUR")
        put(ws2, f"E{r}", src)

    head(ws2, 9, ["Funnel anual (ipoteze editabile)", "Valoare", "Unitate", "Sursă / Justificare"], 2)
    funnel = [
        (10, "Cereri relevante deduplicate / an", fun["relevant_requests"], INT, None, "cereri", "Ipoteză echipă; un client din mai multe canale = 1 cerere"),
        (11, "Rată cerere → întâlnire tehnică", fun["request_to_meeting_rate"], PCT, None, "%", "Ipoteză echipă (cereri pre-calificate în PaletCheck UR20)"),
        (12, "Întâlniri tehnice / an", "=ROUND(C10*C11,0)", INT, CALC_FILL, "întâlniri", "Formulă"),
        (13, "Rată întâlnire → client câștigat", fun["meeting_to_client_rate"], PCT, None, "%", "Ipoteză echipă (vânzare CapEx, ciclu lung)"),
        (14, "Clienți industriali câștigați / an", "=ROUND(C12*C13,0)", INT, CALC_FILL, "clienți", "Formulă"),
        (15, "Celule medii / client", fun["avg_cells_per_client"], "0.00", None, "celule", "Reper PURATOS = 2 celule; ex. 5 fabrici x 2 + 7 fabrici x 1"),
        (16, "Celule vândute și livrate în an", "=ROUND(C14*C15,0)", INT, CALC_FILL, "celule", "Formulă"),
    ]
    for r, label, val, fmt, fill, unit, src in funnel:
        put(ws2, f"B{r}", label)
        put(ws2, f"C{r}", val, fmt, fill or INPUT_FILL, bold=fill is not None)
        put(ws2, f"D{r}", unit)
        put(ws2, f"E{r}", src)

    head(ws2, 18, ["Rezultate an 1 (formule live)", "Valoare", "Unitate", "Formula"], 2)
    results = [
        (19, "Total promovare", f"={R1}!C20", EUR, "Suma alocărilor din foaia Buget"),
        (20, "Contribuție / celulă", "=C4-C5", EUR, "Preț - cost direct"),
        (21, "Venit anual", "=C16*C4", EUR, "Celule x preț"),
        (22, "Cost direct anual", "=C16*C5", EUR, "Celule x cost direct"),
        (23, "Contribuție totală", "=C21-C22", EUR, "Venit - cost direct"),
        (24, "Rezultat după promovare, înainte de alte costuri și impozit", "=C23-C19", EUR, "Contribuție totală - promovare"),
        (25, "Cost / cerere relevantă", "=C19/C10", EUR, "Promovare / cereri"),
        (26, "Cost / întâlnire tehnică", "=C19/C12", EUR, "Promovare / întâlniri"),
        (27, "Cost / client câștigat", "=C19/C14", EUR, "Promovare / clienți"),
        (28, "Cost promovare / celulă", "=C19/C16", EUR, "Promovare / celule"),
        (29, "Marjă de contribuție %", "=C20/C4", PCT, "Contribuție / preț"),
        (30, "Prag acoperire promovare (celule)", "=ROUNDUP(C19/C20,0)", INT, "ROUNDUP(promovare / contribuție)"),
        (31, "Prag țintă 300.000 EUR înainte de alte costuri (celule)", "=ROUNDUP((C7+C19)/C20,0)", INT, "ROUNDUP((țintă + promovare) / contribuție)"),
        (32, "Diferență rezultat vs. țintă 300.000 EUR", "=C24-C7", EUR, "Rezultat - țintă (înainte de alte costuri)"),
        (33, "Verdict scenariu de bază", '=IF(C16>=C31,"Țintă atinsă înainte de alte costuri și impozit","Sub țintă")', None, "Vezi foaia Verificare Profit Net"),
    ]
    for r, label, val, fmt, how in results:
        put(ws2, f"B{r}", label)
        put(ws2, f"C{r}", val, fmt, CALC_FILL, bold=True)
        put(ws2, f"D{r}", "EUR" if fmt == EUR else ("%" if fmt == PCT else ("celule" if fmt == INT else "")))
        put(ws2, f"E{r}", how)

    # ---------------- Sheet 1: promo budget ----------------
    title(ws1, "Buget promovare 30.000 EUR - alocare, ritm trimestrial și regulă de realocare",
          "EUR fără TVA | plafon fix | rezerva este distinctă, niciun cost numărat de două ori | galben = editabil")
    head(ws1, 4, ["Ritm cheltuire", "Trimestru", "% din buget", "Motiv"], 1)
    for i, (q, p) in enumerate(PACING):
        r = 5 + i
        put(ws1, f"A{r}", i + 1)
        put(ws1, f"B{r}", q)
        put(ws1, f"C{r}", p, PCT, INPUT_FILL)
        put(ws1, f"D{r}", "Livrare celulă ~4 luni: comenzile trebuie semnate până la final de august" if i < 2 else "Întreținere pipeline și pregătire an 2")
    put(ws1, "B9", "Total ritm", bold=True)
    put(ws1, "C9", "=SUM(C5:C8)", PCT, CALC_FILL, True)
    put(ws1, "B10", "Q1 + Q2 (front-loaded)", bold=True)
    put(ws1, "C10", "=C5+C6", PCT, CALC_FILL, True)
    put(ws1, "D10", '=IF(ROUND(C10,4)>=0.65,"OK: ≥65% în S1","Atenție: sub 65% în S1")', None, CALC_FILL)

    head(ws1, 12, ["Nr.", "Canal / alocare", "Sumă (EUR)", "% din buget", "Public țintă",
                   "Q1", "Q2", "Q3", "Q4", "Total trimestre"], 1)
    for i, (key, name, audience) in enumerate(CHANNELS):
        r = 13 + i
        put(ws1, f"A{r}", i + 1)
        put(ws1, f"B{r}", name)
        put(ws1, f"C{r}", alloc[key], EUR, INPUT_FILL)
        put(ws1, f"D{r}", f"=C{r}/$C$20", PCT, CALC_FILL)
        put(ws1, f"E{r}", audience)
        for j, col in enumerate("FGHI"):
            put(ws1, f"{col}{r}", f"=$C{r}*$C${5 + j}", EUR, CALC_FILL)
        put(ws1, f"J{r}", f"=SUM(F{r}:I{r})", EUR, CALC_FILL)
    put(ws1, "B20", "TOTAL PROMOVARE", bold=True)
    for col in "CDFGHIJ":
        put(ws1, f"{col}20", f"=SUM({col}13:{col}19)", PCT if col == "D" else EUR, CALC_FILL, True)
    put(ws1, "B21", "Verificare plafon 30.000 EUR", bold=True)
    put(ws1, "C21", f'=IF(AND(ROUND(C20,2)={R2}!C6,ROUND(J20,2)=ROUND(C20,2)),"OK: exact plafonul","EROARE: depășire sau lipsă")', None, CALC_FILL, True)

    head(ws1, 23, ["", "Regulă stop / realocare", "Valoare", "Aplicare"], 1)
    put(ws1, "B24", "Evaluare canal după (zile)")
    put(ws1, "C24", 45, INT, INPUT_FILL)
    put(ws1, "D24", "Prima evaluare la 45 zile de la pornirea fiecărui canal, apoi trimestrial")
    put(ws1, "B25", "Prag maxim cost / cerere relevantă")
    put(ws1, "C25", 400, EUR, INPUT_FILL)
    put(ws1, "D25", "Canal peste prag sau cu 0 cereri relevante: se reduce")
    put(ws1, "B26", "Reducere aplicată canalului slab")
    put(ws1, "C26", 0.5, PCT, INPUT_FILL)
    put(ws1, "D26", "Suma eliberată merge la canalul cu cel mai mic cost / cerere")
    put(ws1, "B27", "Rezervă disponibilă pentru realocare")
    put(ws1, "C27", "=C19", EUR, CALC_FILL, True)
    put(ws1, "D27", "Folosită doar după evaluarea de 45 zile; nu se adaugă peste plafon")
    put(ws1, "B28", "Cost mediu / cerere relevantă (țintă)")
    put(ws1, "C28", f"={R2}!C25", EUR, CALC_FILL, True)
    put(ws1, "D28", '=IF(C28<=C25,"Sub pragul de stop","Peste pragul de stop")', None, CALC_FILL)

    # ---------------- Sheet 3: net profit check & risks ----------------
    title(ws3, "Verificare profit net 300.000 EUR, date lipsă, rezervă comercială și capacitate hub-uri",
          "Brief: alte costuri indirecte și impozitul NU sunt precizate. Roșu = dată lipsă de cerut de la Tech-Con.")
    head(ws3, 4, ["Date pentru profit net real", "Valoare", "Unitate", "Status"], 2)
    put(ws3, "B5", "Impozit pe profit (România)")
    put(ws3, "C5", 0.16, PCT, INPUT_FILL)
    put(ws3, "D5", "%")
    put(ws3, "E5", "Cotă standard 16%; de confirmat cu contabilul Tech-Con")
    missing = [(6, "Regie indirectă vânzări (salarii vânzări, deplasări)"),
               (7, "Service & garanție celule livrate"),
               (8, "Alte costuri fixe alocate (administrativ, sedii)")]
    for r, label in missing:
        put(ws3, f"B{r}", label)
        put(ws3, f"C{r}", 0, EUR, MISS_FILL)
        put(ws3, f"D{r}", "EUR / an")
        put(ws3, f"E{r}", "LIPSĂ din brief - de completat (0 = necunoscut, nu gratuit)")
    put(ws3, "B9", "Total regie indirectă introdusă", bold=True)
    put(ws3, "C9", "=SUM(C6:C8)", EUR, CALC_FILL, True)
    put(ws3, "D9", "EUR / an")

    head(ws3, 11, ["Calcul transparent", "Valoare", "Unitate", "Formula"], 2)
    calc = [
        (12, "Profit înainte de impozit necesar pentru 300.000 EUR net", f"={R2}!C7/(1-C5)", EUR, "țintă / (1 - impozit)"),
        (13, "Celule necesare: țintă 300k, înainte de alte costuri și impozit", f"={R2}!C31", INT, "Din foaia Model"),
        (14, "Celule necesare: cu impozit 16%, fără regie (indicativ)", f"=ROUNDUP(({R2}!C7/(1-C5)+{R2}!C19)/{R2}!C20,0)", INT, "ROUNDUP((300000/(1-16%) + promovare) / contribuție)"),
        (15, "Celule necesare: cu impozit și regia introdusă", f"=ROUNDUP(({R2}!C7/(1-C5)+{R2}!C19+C9)/{R2}!C20,0)", INT, "Se actualizează când Tech-Con dă regia"),
        (16, "Profit net indicativ în scenariul de bază (17 celule)", f"=({R2}!C24-C9)*(1-C5)", EUR, "(rezultat după promovare - regie) x (1 - impozit)"),
        (17, "Diferență profit net indicativ vs. țintă", f"=C16-{R2}!C7", EUR, "Negativ = 17 celule nu ajung după impozit"),
    ]
    for r, label, val, fmt, how in calc:
        put(ws3, f"B{r}", label)
        put(ws3, f"C{r}", val, fmt, CALC_FILL, True)
        put(ws3, f"D{r}", "EUR" if fmt == EUR else "celule")
        put(ws3, f"E{r}", how)

    head(ws3, 19, ["Rezervă comercială recomandată", "Valoare", "Unitate", "Formula / Motiv"], 2)
    put(ws3, "B20", "Buffer comercial (celule peste scenariul de bază)")
    put(ws3, "C20", 3, INT, INPUT_FILL)
    put(ws3, "D20", "celule")
    put(ws3, "E20", "Acoperă impozitul 16% și o parte din regie")
    put(ws3, "B21", "Țintă comercială cu buffer")
    put(ws3, "C21", f"={R2}!C16+C20", INT, CALC_FILL, True)
    put(ws3, "D21", "celule")
    put(ws3, "E21", "Scenariu de bază + buffer")
    put(ws3, "B22", "Rezervă procentuală pe volum (interval 10-15%)")
    put(ws3, "C22", 0.15, PCT, INPUT_FILL)
    put(ws3, "D22", "%")
    put(ws3, "E22", "Verificare: buffer în celule vs. buffer în %")
    put(ws3, "B23", "Celule cu rezervă procentuală")
    put(ws3, "C23", f"=ROUNDUP({R2}!C16*(1+C22),0)", INT, CALC_FILL, True)
    put(ws3, "D23", "celule")
    put(ws3, "E23", "ROUNDUP(celule x (1 + rezervă))")
    put(ws3, "B24", "Profit net indicativ la ținta cu buffer")
    put(ws3, "C24", f"=(C21*{R2}!C20-{R2}!C19-C9)*(1-C5)", EUR, CALC_FILL, True)
    put(ws3, "D24", "EUR")
    put(ws3, "E24", '=IF(C24>=' + f"{R2}!C7" + ',"Peste 300.000 EUR net (fără regie)","Sub 300.000 EUR net")')

    head(ws3, 26, ["Hub Tech-Con", "Regiune", "Celule alocate", "% din total",
                   "Capacitate instalare / trimestru", "Capacitate în fereastra de livrare"], 1)
    for i, (hub, region, cells, cap) in enumerate(HUBS):
        r = 27 + i
        put(ws3, f"A{r}", hub)
        put(ws3, f"B{r}", region)
        put(ws3, f"C{r}", cells, INT, INPUT_FILL)
        put(ws3, f"D{r}", f"=C{r}/$C$30", PCT, CALC_FILL)
        put(ws3, f"E{r}", cap, INT, INPUT_FILL)
        put(ws3, f"F{r}", f"=ROUNDDOWN(E{r}*$C$33/3,0)", INT, CALC_FILL)
    put(ws3, "A30", "TOTAL", bold=True)
    put(ws3, "C30", "=SUM(C27:C29)", INT, CALC_FILL, True)
    put(ws3, "D30", "=SUM(D27:D29)", PCT, CALC_FILL, True)
    put(ws3, "E30", "=SUM(E27:E29)", INT, CALC_FILL, True)
    put(ws3, "F30", "=SUM(F27:F29)", INT, CALC_FILL, True)
    put(ws3, "B31", "Verificare alocare = celule din model", bold=True)
    put(ws3, "C31", f'=IF(C30={R2}!C16,"OK","Diferență față de model")', None, CALC_FILL, True)
    put(ws3, "B32", "Timp livrare celulă (luni)")
    put(ws3, "C32", ue["delivery_lead_time_months"], INT, INPUT_FILL)
    put(ws3, "B33", "Fereastră de livrare în an (luni)")
    put(ws3, "C33", "=12-C32", INT, CALC_FILL, True)
    put(ws3, "D33", "Prima comandă din ianuarie se livrează după ~4 luni")
    put(ws3, "B34", "Verificare capacitate vs. celule de livrat", bold=True)
    put(ws3, "C34", '=IF(F30>=C30,"OK: capacitate suficientă","RISC: capacitate insuficientă")', None, CALC_FILL, True)
    put(ws3, "B35", "Utilizare capacitate")
    put(ws3, "C35", "=C30/F30", PCT, CALC_FILL, True)

    head(ws3, 37, ["Risc", "Impact", "Măsură"], 2)
    risks = [
        ("Rezultatele FAT PURATOS nu sunt garanții", "Ritm real mai mic în altă fabrică", "Test pe datele liniei clientului înainte de ofertă"),
        ("Termen livrare ~4 luni", "Comenzi după august nu se livrează în an", "65% din buget în Q1-Q2"),
        ("Regie și impozit nespecificate", "17 celule nu ajung la 300.000 EUR net", "Buffer +3 celule; cerere date de la Tech-Con"),
        ("Capacitate instalare hub-uri", "Întârzieri la livrare în Q3-Q4", "Alocare 9/4/4 și verificare lunară"),
        ("Cereri duplicate din mai multe canale", "Cost/cerere subestimat", "Deduplicare CRM: un client = o cerere"),
    ]
    for i, (risk, impact, fix) in enumerate(risks):
        r = 38 + i
        put(ws3, f"B{r}", risk)
        put(ws3, f"C{r}", impact)
        put(ws3, f"D{r}", fix)

    for ws, widths in ((ws1, [16, 52, 16, 12, 52, 13, 13, 13, 13, 16]),
                       (ws2, [3, 58, 20, 12, 58]),
                       (ws3, [20, 58, 26, 22, 48, 26])):
        for i, w in enumerate(widths):
            ws.column_dimensions[chr(65 + i)].width = w
        ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
        ws.freeze_panes = "A4"

    wb.calculation.fullCalcOnLoad = True
    return wb


def expected(numbers: dict) -> dict:
    """Python mirror of the workbook formulas, used to lock NUMBERS.json and cross-check."""
    a = numbers["promo_budget_allocation_eur"]
    ue = numbers["unit_economics"]
    f = numbers["funnel_year_1"]
    price, cost = numbers["pricing"]["unit_price"], ue["direct_cost_per_cell"]
    target = ue["shareholder_net_profit_target"]
    promo = sum(a[k] for k, _, _ in CHANNELS)
    meetings = round(f["relevant_requests"] * f["request_to_meeting_rate"])
    clients = round(meetings * f["meeting_to_client_rate"])
    cells = round(clients * f["avg_cells_per_client"])
    contrib = price - cost
    result = cells * contrib - promo
    tax = 0.16
    return {
        "promo": promo, "meetings": meetings, "clients": clients, "cells": cells,
        "contrib": contrib, "revenue": cells * price, "direct": cells * cost,
        "total_contrib": cells * contrib, "result": result,
        "cpr": promo / f["relevant_requests"], "cpm": promo / meetings,
        "cpc": promo / clients, "cpcell": promo / cells,
        "be_promo": math.ceil(promo / contrib), "be_target": math.ceil((target + promo) / contrib),
        "cells_tax": math.ceil((target / (1 - tax) + promo) / contrib),
        "pretax_needed": target / (1 - tax),
        "net_indicative": result * (1 - tax),
        "buffer_cells": cells + 3,
        "net_buffer": ((cells + 3) * contrib - promo) * (1 - tax),
        "pacing": {q: p for q, p in PACING},
    }


def lock_numbers(numbers: dict, e: dict) -> None:
    numbers["status"] = "LOCKED"
    numbers["locked_by"] = "cfo (deliverables/02-finance/financial_model.xlsx)"
    fy = numbers["funnel_year_1"]
    fy.update({"technical_meetings": e["meetings"], "won_clients": e["clients"],
               "cells_sold_and_delivered": e["cells"],
               "cost_per_relevant_request": round(e["cpr"], 2),
               "cost_per_technical_meeting": round(e["cpm"], 2),
               "cost_per_won_client": round(e["cpc"], 2),
               "promo_cost_per_cell": round(e["cpcell"], 2)})
    s = numbers["summary_year_1"]
    s.update({"total_revenue": e["revenue"], "total_direct_costs": e["direct"],
              "total_contribution": e["total_contrib"], "total_promo_costs": e["promo"],
              "result_after_promo_before_overhead_tax": e["result"],
              "total_costs": e["direct"] + e["promo"],
              "net_profit": e["result"],
              "net_profit_note": "310.000 EUR = rezultat dupa promovare, INAINTE de regie indirecta si impozit (date lipsa in brief). Profit net indicativ dupa impozit 16%, fara regie: 260.400 EUR.",
              "net_profit_indicative_after_16pct_tax_no_overhead": round(e["net_indicative"]),
              "break_even_note": "break_even_month si break_even_units_per_month = prag acoperire promovare in CELULE (2), nu luni."})
    numbers["unit_economics"].update({"promo_break_even_cells": e["be_promo"],
                                      "target_cells_before_overhead_tax": e["be_target"],
                                      "indicative_cells_with_16pct_tax_only": e["cells_tax"]})
    numbers["promo_pacing_quarterly_pct"] = {"Q1": 0.35, "Q2": 0.30, "Q3": 0.20, "Q4": 0.15, "Q1_Q2_front_loaded": 0.65}
    numbers["promo_pacing_quarterly_eur"] = {q: round(e["promo"] * p) for q, p in (("Q1", .35), ("Q2", .30), ("Q3", .20), ("Q4", .15))}
    numbers["promo_reallocation_rule"] = {"review_after_days": 45, "max_cost_per_relevant_request_eur": 400,
                                          "cut_underperforming_channel_pct": 0.5,
                                          "dedup": "un client din mai multe canale se numara o singura data"}
    numbers["net_profit_check"] = {
        "corporate_tax_rate_ro": 0.16,
        "pretax_profit_needed_for_300k_net": round(e["pretax_needed"]),
        "missing_data": ["regie indirecta vanzari", "service & garantie", "alte costuri fixe alocate", "confirmare cota impozit"],
        "recommended_buffer_cells": 3,
        "commercial_target_with_buffer_cells": e["buffer_cells"],
        "recommended_reserve_pct_range": "10-15%",
        "net_profit_indicative_at_buffer_target_no_overhead": round(e["net_buffer"]),
    }
    numbers["hub_delivery_split"] = {
        "cells": {h: c for h, _, c, _ in HUBS},
        "install_capacity_per_quarter": {h: cap for h, _, _, cap in HUBS},
        "delivery_window_months": 12 - numbers["unit_economics"]["delivery_lead_time_months"],
        "capacity_in_window_cells": sum(math.floor(cap * 8 / 3) for _, _, _, cap in HUBS),
    }
    NUMBERS.write_text(json.dumps(numbers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--lock-numbers", action="store_true", help="Write locked figures to brief/NUMBERS.json")
    args = p.parse_args()
    numbers = json.loads(NUMBERS.read_text(encoding="utf-8"))
    e = expected(numbers)
    if e["promo"] != numbers["unit_economics"]["annual_promo_budget_cap"]:
        print(f"EROARE: alocarile insumeaza {e['promo']} != plafon", file=sys.stderr)
        return 2
    wb = build(numbers)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    print(f"[OK] {OUT.relative_to(ROOT)} | celule={e['cells']} venit={e['revenue']} rezultat={e['result']}")
    if args.lock_numbers:
        lock_numbers(numbers, e)
        print("[OK] brief/NUMBERS.json -> status LOCKED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
