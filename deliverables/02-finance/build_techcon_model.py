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
          "EUR fără TVA | 1 an calendaristic | Brief: alte costuri indirecte și impozitul NU sunt precizate. Roșu = dată lipsă de cerut de la Tech-Con.")
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

    add_extra_sheets(wb)
    wb.calculation.fullCalcOnLoad = True
    return wb


def add_extra_sheets(wb: Workbook) -> None:
    """Judge-driven additions: summary first, 12-month calendar + cash, channels 45-day rule, sensitivity."""
    R3 = f"'{S3}'"
    MONTHS = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"]
    COLS = [chr(ord("C") + i) for i in range(12)]  # C..N

    # ---------- Calendar 12 luni & Cash ----------
    S4 = "Calendar 12 luni & Cash"
    R4 = f"'{S4}'"
    ws = wb.create_sheet(S4)
    title(ws, "Calendar 12 luni: comenzi, livrări, promovare, rezultat și numerar",
          "EUR fără TVA | 1 ian - 31 dec | venitul se recunoaște la LIVRARE | galben = ipoteză editabilă (de validat cu Tech-Con)")
    put(ws, "B3", "Timp livrare celulă (luni)")
    put(ws, "C3", f"={R3}!C32", INT, CALC_FILL, True)
    put(ws, "B4", "Avans client la semnarea comenzii")
    put(ws, "C4", 0.30, PCT, INPUT_FILL)
    put(ws, "D4", "Ipoteză uzuală CapEx; restul la livrare")
    put(ws, "B5", "Plată echipamente/furnizori la comandă")
    put(ws, "C5", 0.50, PCT, INPUT_FILL)
    put(ws, "D5", "Ipoteză; restul la livrare")
    put(ws, "B6", "Ultima lună de comandă pentru livrare în an")
    put(ws, "C6", "=12-C3", INT, CALC_FILL, True)
    put(ws, "D6", "Comandă după această lună = livrare în anul 2")
    head(ws, 8, ["Indicator"] + MONTHS + ["Total an"], 2)
    put(ws, "B9", "Luna nr.")
    orders = [2, 2, 1, 2, 3, 3, 2, 2, 0, 0, 0, 0]
    rows = {
        10: "Comenzi semnate (celule)", 11: "Livrări (celule)", 12: "Verificare termen comandă",
        13: "Venit la livrare", 14: "Cost direct la livrare", 15: "Promovare lunară",
        16: "Rezultat lunar după promovare", 17: "Rezultat cumulat",
        18: "Încasări clienți (avans + rest)", 19: "Plăți echipamente (avans + rest)",
        20: "Flux de numerar lunar", 21: "Numerar cumulat (finanțare necesară dacă < 0)",
    }
    for r, lab in rows.items():
        put(ws, f"B{r}", lab, bold=r in (17, 21))
    for i, c in enumerate(COLS):
        prev = COLS[i - 1] if i else None
        put(ws, f"{c}9", i + 1, INT)
        put(ws, f"{c}10", orders[i], INT, INPUT_FILL)
        put(ws, f"{c}11", f"=IF({c}9-$C$3>=1,INDEX($C$10:$N$10,{c}9-$C$3),0)", INT, CALC_FILL)
        put(ws, f"{c}12", f'=IF(AND({c}10>0,{c}9>$C$6),"PESTE TERMEN","OK")', None, CALC_FILL)
        put(ws, f"{c}13", f"={c}11*{R2}!$C$4", EUR, CALC_FILL)
        put(ws, f"{c}14", f"={c}11*{R2}!$C$5", EUR, CALC_FILL)
        put(ws, f"{c}15", f"={R1}!$C$20*INDEX({R1}!$C$5:$C$8,ROUNDUP({c}9/3,0))/3", EUR, CALC_FILL)
        put(ws, f"{c}16", f"={c}13-{c}14-{c}15", EUR, CALC_FILL)
        put(ws, f"{c}17", f"={c}16" if not prev else f"={prev}17+{c}16", EUR, CALC_FILL, True)
        put(ws, f"{c}18", f"={c}10*{R2}!$C$4*$C$4+{c}11*{R2}!$C$4*(1-$C$4)", EUR, CALC_FILL)
        put(ws, f"{c}19", f"={c}10*{R2}!$C$5*$C$5+{c}11*{R2}!$C$5*(1-$C$5)", EUR, CALC_FILL)
        put(ws, f"{c}20", f"={c}18-{c}19-{c}15", EUR, CALC_FILL)
        put(ws, f"{c}21", f"={c}20" if not prev else f"={prev}21+{c}20", EUR, CALC_FILL, True)
        put(ws, f"{c}22", f"={c}11*{R2}!$C$4-{c}19-{c}15" if not prev else f"={prev}22+{c}11*{R2}!$C$4-{c}19-{c}15", EUR, CALC_FILL)
    put(ws, "B22", "Numerar cumulat FĂRĂ avans client (caz prudent)")
    for r in (10, 11, 13, 14, 15, 16, 18, 19, 20):
        put(ws, f"O{r}", f"=SUM(C{r}:N{r})", INT if r in (10, 11) else EUR, CALC_FILL, True)
    head(ws, 23, ["Rezultat calendar", "Valoare", "Explicație"], 2)
    put(ws, "B31", "Necesar maxim de finanțare FĂRĂ avans client")
    put(ws, "C31", "=-MIN(0,MIN($C$22:$N$22))", EUR, CALC_FILL, True)
    put(ws, "D31", "Caz prudent: clientul plătește tot la livrare")
    summary = [
        (24, "Luna break-even (rezultat cumulat ≥ 0)", '=IFERROR(INDEX($C$8:$N$8,MATCH(TRUE,INDEX($C$17:$N$17>=0,0),0)),"neatins")', None, "Prima lună în care rezultatul cumulat devine pozitiv"),
        (25, "Necesar maxim de finanțare (numerar)", "=-MIN(0,MIN($C$21:$N$21))", EUR, "Cel mai negativ numerar cumulat: îl acoperă Tech-Con (capital propriu / linie de credit)"),
        (26, "Luna cu necesar maxim", "=INDEX($C$8:$N$8,MATCH(MIN($C$21:$N$21),$C$21:$N$21,0))", None, "Când trebuie să fie disponibilă finanțarea"),
        (27, "Numerar la 31 dec", "=N21", EUR, "Avansurile reduc nevoia de finanțare"),
        (28, "Verificare livrări = model", f'=IF(O11={R2}!C16,"OK","Diferență")', None, "Totalul livrărilor egal cu celulele din model"),
        (29, "Verificare rezultat an = model", f'=IF(ROUND(O16,0)=ROUND({R2}!C24,0),"OK","Diferență")', None, "Același 310.000 EUR, acum pe luni"),
        (30, "Comenzi după termen", '=IF(COUNTIF(C12:N12,"PESTE TERMEN")=0,"Niciuna","RISC: livrare în anul 2")', None, "Toate comenzile până în august"),
    ]
    for r, lab, f, fmt, note in summary:
        put(ws, f"B{r}", lab)
        put(ws, f"C{r}", f, fmt, CALC_FILL, True)
        put(ws, f"D{r}", note)
    head(ws, 32, ["Livrări pe trimestru", "Q1", "Q2", "Q3", "Q4", "Total", "Capacitate / trim.", "Status", "Egal cu alocare hub", "Rezervă capacitate (trim. cel mai plin)"], 2)
    put(ws, "B33", "Livrări din calendar", bold=True)
    for j, (a, b) in enumerate((("C", "E"), ("F", "H"), ("I", "K"), ("L", "N"))):
        col = chr(ord("C") + j)
        put(ws, f"{col}33", f"=SUM({a}11:{b}11)", INT, CALC_FILL, True)
    put(ws, "G33", "=SUM(C33:F33)", INT, CALC_FILL, True)
    hub_q = [("Dragomirești-Deal", [0, 3, 3, 3], 27), ("Timișoara", [0, 1, 1, 2], 28), ("Iași", [0, 0, 2, 2], 29)]
    for k, (hub, qs, src) in enumerate(hub_q):
        r = 34 + k
        put(ws, f"B{r}", hub)
        for j, v in enumerate(qs):
            put(ws, f"{chr(ord('C') + j)}{r}", v, INT, INPUT_FILL)
        put(ws, f"G{r}", f"=SUM(C{r}:F{r})", INT, CALC_FILL, True)
        put(ws, f"H{r}", f"={R3}!E{src}", INT, CALC_FILL)
        put(ws, f"I{r}", f'=IF(MAX(C{r}:F{r})<=H{r},"OK","PESTE CAPACITATE")', None, CALC_FILL, True)
        put(ws, f"J{r}", f'=IF(G{r}={R3}!C{src},"OK","Diferență")', None, CALC_FILL)
        put(ws, f"K{r}", f'=H{r}-MAX(C{r}:F{r})&IF(H{r}-MAX(C{r}:F{r})=0," (la limită)","")', None, CALC_FILL)
    put(ws, "B37", "Total hub-uri", bold=True)
    for col in "CDEFG":
        put(ws, f"{col}37", f"=SUM({col}34:{col}36)", INT, CALC_FILL, True)
    put(ws, "H37", "=SUM(H34:H36)", INT, CALC_FILL, True)
    put(ws, "B38", "Hub-uri = livrări calendar")
    for col in "CDEF":
        put(ws, f"{col}38", f'=IF({col}37={col}33,"OK","≠")', None, CALC_FILL)
    put(ws, "I37", '=IF(MAX(C33:F33)<=H37,"OK","PESTE CAPACITATE")', None, CALC_FILL, True)
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 44
    for c in COLS + ["O"]:
        ws.column_dimensions[c].width = 14
    ws.column_dimensions["O"].width = 16
    ws.column_dimensions["D"].width = 14
    ws.freeze_panes = "C9"

    # ---------- Canale & regula 45 zile ----------
    S5 = "Canale & regula 45 zile"
    ws = wb.create_sheet(S5)
    title(ws, "Regula de stop / realocare la 45 de zile, măsurabilă pe fiecare canal",
          "EUR fără TVA | cereri relevante DEDUPLICATE (un client = o cerere) | galben = estimare de plan, înlocuită cu date reale din CRM la ziua 45")
    head(ws, 4, ["Canal", "Buget (EUR)", "Cereri relevante", "Cost / cerere", "Prag stop", "Decizie la 45 zile", "Buget după regulă"], 2)
    reqs = [30, 22, 18, 20, 16, 14]
    for i in range(6):
        r = 5 + i
        src = 13 + i
        put(ws, f"B{r}", f"={R1}!B{src}")
        put(ws, f"C{r}", f"={R1}!C{src}", EUR, CALC_FILL)
        put(ws, f"D{r}", reqs[i], INT, INPUT_FILL)
        put(ws, f"E{r}", f'=IF(D{r}=0,"n/a",C{r}/D{r})', EUR, CALC_FILL)
        put(ws, f"F{r}", f"={R1}!$C$25", EUR, CALC_FILL)
        put(ws, f"G{r}", f'=IF(D{r}=0,"Reduce 50% (0 cereri)",IF(E{r}>F{r},"Reduce 50%","Păstrează"))', None, CALC_FILL, True)
        put(ws, f"H{r}", f'=IF(LEFT(G{r},6)="Reduce",C{r}*(1-{R1}!$C$26),C{r})', EUR, CALC_FILL)
    put(ws, "B11", "Total canale", bold=True)
    for col in "CDH":
        put(ws, f"{col}11", f"=SUM({col}5:{col}10)", INT if col == "D" else EUR, CALC_FILL, True)
    put(ws, "E11", "=C11/D11", EUR, CALC_FILL, True)
    put(ws, "B12", "Rezervă ajustări (distinctă)")
    put(ws, "C12", f"={R1}!C19", EUR, CALC_FILL)
    put(ws, "B13", "Sumă disponibilă pentru realocare", bold=True)
    put(ws, "C13", "=C11-H11+C12", EUR, CALC_FILL, True)
    put(ws, "D13", "Merge la canalul cu cel mai mic cost / cerere")
    put(ws, "B14", "Canalul cu cel mai mic cost / cerere")
    put(ws, "C14", "=INDEX(B5:B10,MATCH(MIN(E5:E10),E5:E10,0))", None, CALC_FILL, True)
    put(ws, "B15", "Verificare cereri = model")
    put(ws, "C15", f'=IF(D11={R2}!C10,"OK","Diferență")', None, CALC_FILL, True)
    put(ws, "B16", "Verificare buget total = 30.000 EUR")
    put(ws, "C16", f'=IF(ROUND(C11+C12,0)={R2}!C6,"OK","Diferență")', None, CALC_FILL, True)
    for col, wd in zip("ABCDEFGH", [3, 52, 14, 14, 14, 12, 22, 16]):
        ws.column_dimensions[col].width = wd
    ws.freeze_panes = "A5"

    # ---------- Sensibilitate ----------
    S6 = "Sensibilitate (1 variabilă)"
    ws = wb.create_sheet(S6)
    title(ws, "Analiză de sensibilitate: schimbăm O SINGURĂ ipoteză pe rând",
          "Scenariul oficial rămâne cel de bază (rândul 5). Valorile galbene de test NU sunt date Tech-Con; arată cât de robustă e ținta.")
    head(ws, 4, ["Test", "Cereri", "Rată → întâlnire", "Rată → client", "Celule / client", "Cost direct", "Regie test", "Celule amânate an 2",
                 "Celule livrate", "Venit", "Rezultat după promovare", "Profit net indicativ", "Celule pt 300k net", "Verdict"], 2)
    base = {"C": f"={R2}!C10", "D": f"={R2}!C11", "E": f"={R2}!C13", "F": f"={R2}!C15", "G": f"={R2}!C5", "H": f"={R3}!C9", "I": 0}
    tests = [
        ("Scenariu de bază", {}),
        ("Rată cerere → întâlnire 35%", {"D": 0.35}),
        ("Rată cerere → întâlnire 55%", {"D": 0.55}),
        ("Rată întâlnire → client 18%", {"E": 0.18}),
        ("Rată întâlnire → client 26%", {"E": 0.26}),
        ("Cost direct 115.000 EUR", {"G": 115000}),
        ("Cost direct 120.000 EUR", {"G": 120000}),
        ("Regie indirectă 120.000 EUR/an", {"H": 120000}),
        ("Regie indirectă 180.000 EUR/an", {"H": 180000}),
        ("3 celule amânate în anul 2", {"I": 3}),
    ]
    fmts = {"C": INT, "D": PCT, "E": PCT, "F": "0.00", "G": EUR, "H": EUR, "I": INT}
    for k, (lab, over) in enumerate(tests):
        r = 5 + k
        put(ws, f"B{r}", lab, bold=k == 0)
        for col, f in base.items():
            if col in over:
                put(ws, f"{col}{r}", over[col], fmts[col], INPUT_FILL)
            else:
                put(ws, f"{col}{r}", f, fmts[col], CALC_FILL)
        put(ws, f"J{r}", f"=MAX(0,ROUND(ROUND(ROUND(C{r}*D{r},0)*E{r},0)*F{r},0)-I{r})", INT, CALC_FILL, True)
        put(ws, f"K{r}", f"=J{r}*{R2}!$C$4", EUR, CALC_FILL)
        put(ws, f"L{r}", f"=J{r}*({R2}!$C$4-G{r})-{R2}!$C$19", EUR, CALC_FILL)
        put(ws, f"M{r}", f"=IF(L{r}-H{r}>0,(L{r}-H{r})*(1-{R3}!$C$5),L{r}-H{r})", EUR, CALC_FILL, True)
        put(ws, f"N{r}", f"=ROUNDUP(({R2}!$C$7/(1-{R3}!$C$5)+{R2}!$C$19+H{r})/({R2}!$C$4-G{r}),0)", INT, CALC_FILL, True)
        put(ws, f"O{r}", f'=IF(M{r}>={R2}!$C$7,"Țintă netă atinsă","Sub ținta netă")', None, CALC_FILL)
    put(ws, "B16", "Interval celule pentru 300.000 EUR net (min-max din teste)", bold=True)
    put(ws, "C16", '=MIN(N5:N14)&" - "&MAX(N5:N14)&" celule"', None, CALC_FILL, True)
    put(ws, "B17", "Concluzie")
    put(ws, "C17", "Ținta netă de 300.000 EUR cere 20 celule fără regie și 26-29 celule dacă regia e 120-180 mii EUR: Tech-Con trebuie să confirme regia.")
    for col, wd in zip("ABCDEFGHIJKLMNO", [3, 34, 9, 13, 12, 11, 14, 13, 12, 11, 14, 17, 16, 12, 18]):
        ws.column_dimensions[col].width = wd
    ws.freeze_panes = "C5"

    # ---------- Sumar (first sheet) ----------
    ws = wb.create_sheet("Sumar", 0)
    title(ws, "PaletCheck UR20 / Tech-Con Industry - Sumar model financiar an 1",
          "EUR fără TVA | 1 ian - 31 dec | celule vândute ȘI livrate în an | toate valorile sunt formule legate de foile următoare")
    head(ws, 4, ["Indicator cerut de brief", "Valoare", "Unde se calculează"], 2)
    kpis = [
        ("Preț vânzare celulă UR20", f"={R2}!C4", EUR, S2),
        ("Cost direct celulă", f"={R2}!C5", EUR, S2),
        ("Contribuție / celulă", f"={R2}!C20", EUR, S2),
        ("Total promovare (plafon 30.000 EUR)", f"={R1}!C20", EUR, S1),
        ("Celule vândute și livrate", f"={R2}!C16", INT, S2),
        ("Venit anual", f"={R2}!C21", EUR, S2),
        ("Cost direct anual", f"={R2}!C22", EUR, S2),
        ("Rezultat după promovare, ÎNAINTE de regie și impozit", f"={R2}!C24", EUR, S2),
        ("Cost / cerere relevantă", f"={R2}!C25", EUR, S2),
        ("Cost / client câștigat", f"={R2}!C27", EUR, S2),
        ("Prag acoperire promovare (celule)", f"={R2}!C30", INT, S2),
        ("Profit net indicativ (impozit 16%, fără regie)", f"={R3}!C16", EUR, S3),
        ("Celule pentru 300.000 EUR net (fără regie)", f"={R3}!C14", INT, S3),
        ("Țintă comercială recomandată (17 + 3 rezervă)", f"={R3}!C21", INT, S3),
        ("Celule pentru 300.000 EUR net (min - max din testele de sensibilitate)", f"='{S6}'!C16", None, S6),
        ("Celule pentru 300.000 EUR net: fără regie / regie 120k / regie 180k", f"='{S6}'!N5&\" / \"&'{S6}'!N12&\" / \"&'{S6}'!N13", None, S6),
        ("Luna break-even (rezultat cumulat)", f"={R4}!C24", None, S4),
        ("Necesar maxim de finanțare / luna (ipoteză: avans 30%, furnizor 50%)", f'=ROUND({R4}!C25,0)&" EUR / "&{R4}!C26', None, S4),
        ("Necesar maxim de finanțare fără avans client (caz prudent)", f"={R4}!C31", EUR, S4),
        ("Livrări max. pe trimestru vs capacitate 7", f'=MAX({R4}!C33:F33)&" / "&{R4}!H37', None, S4),
    ]
    for k, (lab, f, fmt, where) in enumerate(kpis):
        r = 5 + k
        put(ws, f"B{r}", lab, bold=k in (7, 11, 13))
        put(ws, f"C{r}", f, fmt, CALC_FILL, True)
        put(ws, f"D{r}", where)
    r = 5 + len(kpis) + 1
    put(ws, f"B{r}", "Date lipsă din brief (de cerut de la Tech-Con)", bold=True)
    put(ws, f"C{r}", "Regie vânzări, service & garanție, alte costuri fixe, confirmare impozit 16%, termene de plată reale")
    put(ws, f"B{r + 1}", "Legendă culori", bold=True)
    put(ws, f"C{r + 1}", "Galben = ipoteză editabilă | Verde = formulă | Roșu = dată lipsă")
    put(ws, f"C{r + 2}", "310.000 EUR NU este profit net: este rezultatul înainte de regie și impozit.")
    ws.column_dimensions["A"].width = 3
    ws.column_dimensions["B"].width = 58
    ws.column_dimensions["C"].width = 26
    ws.column_dimensions["D"].width = 34
    ws.freeze_panes = "A5"
    wb.active = 0


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
              "net_profit_note": "310.000 EUR = rezultat dupa promovare, INAINTE de regie indirecta si impozit (date lipsa in brief). Profit net indicativ dupa impozit 16%, fara regie: 260.400 EUR.",
              "net_profit_indicative_after_16pct_tax_no_overhead": round(e["net_indicative"]),
              "break_even_month_cumulative": "Mai",
              "break_even_note": "Prag acoperire promovare = 2 celule (unit_economics.promo_break_even_cells). Break-even pe luni (rezultat cumulat >= 0) = Mai, din foaia Calendar 12 luni & Cash."})
    for k in ("net_profit", "break_even_month", "break_even_units_per_month"):
        s.pop(k, None)
    for blk in (s, numbers["unit_economics"]):
        if "gross_margin_pct" in blk:
            blk["contribution_margin_pct"] = blk.pop("gross_margin_pct")
    numbers["calendar_year_1"] = {
        "orders_per_month": [2, 2, 1, 2, 3, 3, 2, 2, 0, 0, 0, 0],
        "deliveries_per_month": [0, 0, 0, 0, 2, 2, 1, 2, 3, 3, 2, 2],
        "deliveries_per_quarter": [0, 4, 6, 7],
        "last_order_month_for_delivery_in_year": "August",
        "client_advance_at_order_pct": 0.30,
        "supplier_payment_at_order_pct": 0.50,
        "break_even_month": "Mai",
        "peak_funding_need_eur": 125500,
        "peak_funding_need_month": "Aprilie",
        "peak_funding_need_no_client_advance_eur": 471500,
        "peak_funding_need_no_client_advance_month": "Iulie",
        "hub_capacity_slack_busiest_quarter": 0,
        "assumption_note": "Avans 30% si plata furnizor 50% la comanda = ipoteze de validat cu Tech-Con.",
    }
    numbers["sensitivity_cells_for_300k_net"] = {"no_overhead": 20, "overhead_120k": 26, "overhead_180k": 29}
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
