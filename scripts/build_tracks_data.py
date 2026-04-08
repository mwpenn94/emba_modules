#!/usr/bin/env python3
"""
Build client/src/data/tracks_data.json by extracting the WealthBridge exam
library and flashcards into a structured, UI-ready JSON document.

Inputs (at repo root):
  - CFP_Training_Module.html + 11 other *_Training_Module.html
  - EMBA_Master_Study_Manual_v6_Visual.docx
  - WealthBridgeLibraryv11_QA.zip
      -> Manuals_Visual/*.docx           (primary chapter text)
      -> Flashcards/*_flashcards.txt     (term / definition / source / chapter)
      -> HTML_Training_Modules/*.html    (reference-only mirror of root HTML)
      -> Reference/verified_tax_numbers.md
      -> Tools/MASTER_BUILD_PLAN.md

Output:
  client/src/data/tracks_data.json       (single aggregated file)
"""

from __future__ import annotations
import json
import os
import re
import shutil
import sys
import tempfile
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, List, Optional, Tuple

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ZIP_PATH = os.path.join(ROOT, "WealthBridgeLibraryv11_QA.zip")
MASTER_DOCX = os.path.join(ROOT, "EMBA_Master_Study_Manual_v6_Visual.docx")
OUTPUT = os.path.join(ROOT, "client", "src", "data", "tracks_data.json")

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Mapping: track key -> human readable name, docx filename, flashcard filename
TRACKS: List[Tuple[str, str, str, str, str]] = [
    # key, name, category, manual_file, flashcard_file
    ("sie", "Securities Industry Essentials (SIE)", "securities",
     "SIE_Study_Manual_COMPLETE.docx", "SIEStudyManual_flashcards.txt"),
    ("series7", "Series 7 — General Securities Representative", "securities",
     "Series7_Study_Manual_COMPLETE.docx", "Series7StudyManual_flashcards.txt"),
    ("series66", "Series 66 — Uniform Combined State Law", "securities",
     "Series66_Study_Manual_COMPLETE.docx", "Series66StudyManual_flashcards.txt"),
    ("cfp", "CFP — Certified Financial Planner", "planning",
     "CFP_Study_Manual_COMPLETE.docx", "CFPStudyManual_flashcards.txt"),
    ("financial_planning", "Financial Planning", "planning",
     "Financial_Planning_Study_Manual_COMPLETE.docx",
     "FinancialPlanningStudyManual_flashcards.txt"),
    ("investment_advisory", "Investment Advisory", "planning",
     "Investment_Advisory_Study_Manual_COMPLETE.docx",
     "InvestmentAdvisoryStudyManual_flashcards.txt"),
    ("estate_planning", "Estate Planning", "planning",
     "Estate_Planning_Study_Manual_COMPLETE.docx",
     "EstatePlanning_flashcards.txt"),
    ("premium_financing", "Premium Financing", "planning",
     "Premium_Financing_Study_Manual_COMPLETE.docx",
     "PremiumFinancingStudyManual_flashcards.txt"),
    ("life_health", "Life & Health Insurance", "insurance",
     "Life_Health_Study_Manual_COMPLETE.docx",
     "LifeHealthStudyManual_flashcards.txt"),
    ("general_insurance", "General Insurance", "insurance",
     "General_Insurance_Study_Manual_COMPLETE.docx",
     "GeneralInsurance_flashcards.txt"),
    ("p_and_c", "Property & Casualty", "insurance",
     "P_and_C_Study_Manual_COMPLETE.docx", "PCStudyManual_flashcards.txt"),
    ("surplus_lines", "Surplus Lines", "insurance",
     "Surplus_Lines_Study_Manual_COMPLETE.docx",
     "SurplusLinesStudyManual_flashcards.txt"),
]

CATEGORY_META = {
    "securities": {
        "label": "Securities Licensing",
        "desc": "FINRA and NASAA exam tracks for securities representatives and advisors.",
        "color": "#6366F1",
        "icon": "graduation-cap",
    },
    "planning": {
        "label": "Financial & Wealth Planning",
        "desc": "Holistic planning credentials: CFP, financial planning, estate, advisory.",
        "color": "#10B981",
        "icon": "compass",
    },
    "insurance": {
        "label": "Insurance Licensing",
        "desc": "State insurance tracks covering life, health, property, casualty, surplus.",
        "color": "#F59E0B",
        "icon": "shield",
    },
}


# ──────────────────────────────────────────────────────────────────────────
# DOCX helpers
# ──────────────────────────────────────────────────────────────────────────

def _iter_docx_body(docx_path: str):
    """Walk the body of a docx in order, yielding ('p', style, text) and
    ('tbl', None, rows).

    Single-cell tables (1 row, 1 column) are flattened back into a paragraph
    yield because the manuals use them as styled callout boxes ("SCENARIO",
    "EXAM TIP", "COMMON TRAP") rather than tabular data — rendering them as
    HTML tables looks broken in the app.
    """
    with zipfile.ZipFile(docx_path) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(xml)
    body = root.find(W + "body")
    if body is None:
        return
    for child in body:
        tag = child.tag.replace(W, "")
        if tag == "p":
            ppr = child.find(W + "pPr")
            style = ""
            if ppr is not None:
                ps = ppr.find(W + "pStyle")
                if ps is not None:
                    style = ps.get(W + "val") or ""
            text = "".join(t.text or "" for t in child.iter(W + "t")).strip()
            yield ("p", style, text)
        elif tag == "tbl":
            rows: List[List[str]] = []
            for tr in child.iter(W + "tr"):
                cells: List[str] = []
                for tc in tr.iter(W + "tc"):
                    ct: List[str] = []
                    for p in tc.iter(W + "p"):
                        pt = "".join(
                            t.text or "" for t in p.iter(W + "t")
                        ).strip()
                        if pt:
                            ct.append(pt)
                    cells.append(" ".join(ct))
                rows.append(cells)
            # Flatten single-cell callouts to paragraphs.
            if len(rows) == 1 and len(rows[0]) == 1 and rows[0][0]:
                yield ("p", "Callout", rows[0][0])
                continue
            yield ("tbl", None, rows)


# ──────────────────────────────────────────────────────────────────────────
# Practice-question extraction
# ──────────────────────────────────────────────────────────────────────────

QUESTION_RE = re.compile(r"^\s*(\d+)\.\s+(.*)$")
ANSWER_RE = re.compile(
    r"(?:MASTERY\s*CHECK\s+)?Answer:\s*([A-D])[\)\.\s]*(.*)", re.DOTALL | re.I
)


def split_options(blob: str) -> List[str]:
    """Split 'A) foo B) bar C) baz D) qux' into ['foo','bar','baz','qux'].

    We can't use a regex with a lookbehind because some option text ends in a
    letter that runs straight into the next option label (e.g.
    'investment adviceB)').  Instead we walk left-to-right, finding the next
    expected letter ('A'..'D') in sequence.
    """
    out: List[str] = []
    cursor = 0
    letters = ["A", "B", "C", "D"]
    positions: List[int] = []
    for letter in letters:
        idx = blob.find(letter + ")", cursor)
        if idx == -1:
            break
        positions.append(idx)
        cursor = idx + 2
    for i, pos in enumerate(positions):
        start = pos + 2  # skip "X)"
        end = positions[i + 1] if i + 1 < len(positions) else len(blob)
        text = blob[start:end].strip()
        if text:
            out.append(text)
    return out


def parse_practice_questions(lines: List[str]) -> List[Dict[str, Any]]:
    """Parse a flat list of (subsection-title, paragraphs...) triples back into
    structured MC questions. We accept a mixed stream where each question is:
        "<N>. <prompt>"              (title line)
        "A) ... B) ... C) ... D) ..." (options glued)
        "MASTERY CHECK  Answer: X  <explanation>"
    """
    questions: List[Dict[str, Any]] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = QUESTION_RE.match(line)
        if not m:
            i += 1
            continue
        number = int(m.group(1))
        prompt = m.group(2).strip()
        options: List[str] = []
        correct_idx: Optional[int] = None
        explanation = ""

        j = i + 1
        while j < len(lines):
            nxt = lines[j].strip()
            if QUESTION_RE.match(nxt) and j != i + 1:
                break
            if "A)" in nxt and "B)" in nxt and not options:
                options = split_options(nxt)
            am = ANSWER_RE.search(nxt)
            if am:
                letter = am.group(1).upper()
                correct_idx = "ABCD".find(letter)
                explanation = am.group(2).strip()
                j += 1
                break
            j += 1
        i = j

        if options and correct_idx is not None and 0 <= correct_idx < len(options):
            questions.append({
                "number": number,
                "prompt": prompt,
                "options": options[:4],
                "correct": correct_idx,
                "explanation": explanation,
            })
    return questions


# ──────────────────────────────────────────────────────────────────────────
# Manual parser
# ──────────────────────────────────────────────────────────────────────────

PRACTICE_HEADERS = (
    "practice exam", "comprehensive practice", "additional practice",
    "practice question", "practice set", "comprehensive exam",
    "final key facts",  # usually trails a practice block
)

NUMBERED_Q_RE = re.compile(r"^\s*\d+\.\s+.{5,}")


def is_practice_header(text: str) -> bool:
    low = text.lower()
    return any(h in low for h in PRACTICE_HEADERS)


def looks_like_question_heading(text: str) -> bool:
    return bool(NUMBERED_Q_RE.match(text.strip()))


def meta_lines_done(lines: List[str]) -> bool:
    """Cap meta-line collection at 4 lines (title, edition, subtitle, date)."""
    return len(lines) >= 4


def parse_manual(docx_path: str, track_key: str, track_name: str,
                 category: str) -> Dict[str, Any]:
    """Parser notes:

    Each study manual is a Word document with Heading1 chapters and
    Heading2/Heading3 subsections.  "Practice Exam" chapters are special:
    every numbered practice question is encoded as a subsection heading
    ("1. <prompt>") followed by a paragraph of glued options and a
    "MASTERY CHECK  Answer: X" paragraph.  Some manuals also mix study
    content back in after the practice block, so we must not assume a new
    Heading1 is required to exit practice mode.

    Rules we apply:
      - Heading1 marked practice -> collect numbered subsections as questions.
      - A heading whose title does NOT match "N. ..." inside a practice block
        implicitly closes the practice block and starts a new auto-chapter.
      - "Practice Questions" / "Additional Practice" subheadings inside a
        non-practice chapter open a nested practice capture until the next
        non-numbered heading.
    """

    items = list(_iter_docx_body(docx_path))

    chapters: List[Dict[str, Any]] = []
    practice_subs: List[Dict[str, Any]] = []

    cur_chapter: Optional[Dict[str, Any]] = None
    cur_sub: Optional[Dict[str, Any]] = None

    # Practice mode is orthogonal to chapter boundaries: it can be opened by
    # either a Heading1 practice chapter or a Heading2/3 practice subheading,
    # and is closed by any heading that doesn't match "N. ..." or by a new
    # Heading1.
    in_practice = False

    meta_lines: List[str] = []
    saw_h1 = False

    def start_chapter(title: str, is_practice: bool) -> Dict[str, Any]:
        ch = {
            "id": f"ch-{len(chapters)}",
            "title": title,
            "intro": "",
            "subsections": [],
            "is_practice": is_practice,
        }
        chapters.append(ch)
        return ch

    def start_sub(ch: Dict[str, Any], title: str, level: int,
                  is_question: bool) -> Dict[str, Any]:
        sub = {
            "id": f"sub-{len(ch['subsections'])}",
            "title": title,
            "level": level,
            "paragraphs": [],
            "tables": [],
            "is_question": is_question,
        }
        ch["subsections"].append(sub)
        if is_question:
            practice_subs.append(sub)
        return sub

    # Auto-promote counter — used to label appendix/extra chapters that come
    # out of practice mode without an explicit Heading1.
    appendix_count = 0

    for typ, style, payload in items:
        if typ == "p":
            if not payload:
                continue
            # "Callout" is our synthetic style for flattened single-cell
            # tables (see _iter_docx_body); it's body text, not a heading.
            # Meta lines (title page, subtitle) are the very first plain
            # paragraphs that appear before ANY heading of any kind.  Once
            # we've seen a chapter or subsection, body paragraphs flow
            # through the regular append path.
            if (
                not saw_h1
                and cur_chapter is None
                and not style
                and not meta_lines_done(meta_lines)
            ):
                meta_lines.append(payload)
                continue

            if style == "Heading1":
                saw_h1 = True
                new_is_practice = is_practice_header(payload)
                # Merge consecutive practice Heading1s like
                #   "SIE Practice Exam" → "Practice Exam: SIE Practice Exam"
                # to avoid an empty placeholder chapter.
                if (
                    new_is_practice
                    and cur_chapter is not None
                    and cur_chapter.get("is_practice")
                    and len(cur_chapter["subsections"]) == 0
                    and not cur_chapter["intro"].strip()
                ):
                    cur_chapter["title"] = payload
                    in_practice = True
                    cur_sub = None
                    continue
                in_practice = new_is_practice
                cur_chapter = start_chapter(payload, in_practice)
                cur_sub = None
                continue

            if style in ("Heading2", "Heading3"):
                level = 2 if style == "Heading2" else 3
                is_q = looks_like_question_heading(payload)
                is_practice_heading = is_practice_header(payload)

                # Close practice mode when we hit a non-question heading.
                if in_practice and not is_q and not is_practice_heading:
                    in_practice = False
                    # Auto-promote this heading to a new chapter so we don't
                    # poison the practice one with study content.  Tag the
                    # title so it's clear in the UI that this is appendix
                    # material rather than a top-level domain.
                    appendix_count += 1
                    label = (
                        f"Appendix: {payload}"
                        if not payload.lower().startswith("appendix")
                        else payload
                    )
                    cur_chapter = start_chapter(label, False)
                    cur_sub = None
                    continue

                # A practice sub-header opens practice mode even inside a
                # regular chapter.  We do NOT add it as a subsection because
                # the questions that follow live in their own dedicated
                # subsections; the divider would only show up as an empty
                # placeholder in the reader.
                if is_practice_heading and cur_chapter is not None:
                    in_practice = True
                    cur_sub = None
                    continue

                if cur_chapter is None:
                    cur_chapter = start_chapter("Overview", False)

                cur_sub = start_sub(cur_chapter, payload, level,
                                    is_question=in_practice and is_q)
                continue

            # Body text (or Callout / unknown style — treat as body).
            if cur_sub is not None:
                cur_sub["paragraphs"].append(payload)
            elif cur_chapter is not None:
                cur_chapter["intro"] += (payload + "\n")
        elif typ == "tbl":
            rows: List[List[str]] = payload  # type: ignore[assignment]
            tbl = {"rows": rows}
            if cur_sub is not None:
                cur_sub["tables"].append(tbl)
            elif cur_chapter is not None:
                cur_chapter.setdefault("tables", []).append(tbl)

    # Build practice questions from the dedicated practice subsections.  Each
    # subsection is shaped like:
    #   title        = "1. prompt"
    #   paragraphs[0] = "A) ... B) ... C) ... D) ..."
    #   tables[0]    = [["MASTERY CHECK Answer: X"], ["explanation"]]   (cell rows)
    def flatten_sub(sub: Dict[str, Any]) -> List[str]:
        out: List[str] = [sub["title"]]
        out.extend(sub.get("paragraphs", []))
        for tbl in sub.get("tables", []):
            for row in tbl.get("rows", []):
                for cell in row:
                    if cell:
                        out.append(cell)
        return out

    questions: List[Dict[str, Any]] = []
    for sub in practice_subs:
        parsed = parse_practice_questions(flatten_sub(sub))
        questions.extend(parsed)

    # Backup: if the parser missed questions (some manuals don't use numbered
    # heading styles), scan every chapter flagged is_practice for inline q's.
    if not questions:
        flat: List[str] = []
        for c in chapters:
            if not c.get("is_practice"):
                continue
            for sub in c["subsections"]:
                flat.extend(flatten_sub(sub))
        questions = parse_practice_questions(flat)

    # Strip practice chapters from the main chapter list once we've extracted
    # their questions (they're shown via the Practice tab instead).  Also drop
    # any chapter that ended up with zero content of any kind — those are
    # usually scaffolding (TOC entries, empty Heading1 placeholders).
    def chapter_has_content(c: Dict[str, Any]) -> bool:
        if c["intro"].strip():
            return True
        if c["subsections"]:
            return True
        if c.get("tables"):
            return True
        return False

    study_chapters = [
        c for c in chapters
        if not c.get("is_practice") and chapter_has_content(c)
    ]

    title = (meta_lines[0] if meta_lines else track_name).strip()
    subtitle = " ".join(meta_lines[1:4]).strip()

    # Derive exam overview from the first 2-column table we can find anywhere
    # in the manual.  Most tracks expose exam metadata as a "Component | Detail"
    # table inside an "Exam Overview" chapter, but some manuals don't use that
    # exact title — and SIE skips this chapter entirely.  We fall back to:
    #   1) An "Exam Overview"-titled chapter
    #   2) Any 2-col table in "How to Use This Manual" / "Exam Format" / etc.
    #   3) The first 2-col table in the document overall
    exam_overview: List[List[str]] = []

    def collect_table_rows(tables: List[Dict[str, Any]]) -> None:
        for t in tables or []:
            for row in t.get("rows", []):
                if (
                    len(row) == 2
                    and row[0]
                    and row[1]
                    and len(row[0]) < 80
                    and len(row[1]) < 200
                    and exam_overview is not None
                    and len(exam_overview) < 12
                ):
                    exam_overview.append(row)

    OVERVIEW_HINTS = (
        "exam overview", "exam format", "how to use", "test format",
        "about the exam", "exam structure",
    )
    for c in chapters:
        ttl = c["title"].strip().lower()
        if any(h in ttl for h in OVERVIEW_HINTS):
            collect_table_rows(c.get("tables", []))
            for sub in c["subsections"]:
                collect_table_rows(sub.get("tables", []))
            if exam_overview:
                break

    if not exam_overview:
        # Fallback: any 2-col table early in the document
        for c in chapters[:6]:
            collect_table_rows(c.get("tables", []))
            for sub in c["subsections"][:8]:
                collect_table_rows(sub.get("tables", []))
            if exam_overview:
                break

    return {
        "key": track_key,
        "name": track_name,
        "category": category,
        "title": title[:200],
        "subtitle": subtitle[:300],
        "chapters": study_chapters,
        "practice_questions": questions,
        "exam_overview": exam_overview,
    }


# ──────────────────────────────────────────────────────────────────────────
# Flashcard parser
# ──────────────────────────────────────────────────────────────────────────

def parse_flashcards(path: str) -> List[Dict[str, Any]]:
    cards: List[Dict[str, Any]] = []
    if not os.path.exists(path):
        return cards
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 2:
                continue
            term = parts[0].strip()
            definition = parts[1].strip()
            source = parts[2].strip() if len(parts) > 2 else ""
            chapter = parts[3].strip() if len(parts) > 3 else ""
            if term and definition:
                cards.append({
                    "id": i,
                    "term": term,
                    "definition": definition,
                    "source": source,
                    "chapter": chapter,
                })
    return cards


# ──────────────────────────────────────────────────────────────────────────
# Master EMBA manual (for cross-track glossary enrichment)
# ──────────────────────────────────────────────────────────────────────────

def parse_master_manual(docx_path: str) -> Dict[str, Any]:
    """Pulls Heading1 sections from the master manual as high-level topics."""
    if not os.path.exists(docx_path):
        return {"sections": [], "word_count": 0}
    items = list(_iter_docx_body(docx_path))
    sections: List[Dict[str, Any]] = []
    cur: Optional[Dict[str, Any]] = None
    total_words = 0
    for typ, style, payload in items:
        if typ == "p":
            if not payload:
                continue
            total_words += len(payload.split())
            if style == "Heading1":
                cur = {"title": payload, "paragraphs": []}
                sections.append(cur)
            elif cur is not None:
                cur["paragraphs"].append(payload)
    return {"sections": sections, "word_count": total_words}


# ──────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────

def main() -> None:
    if not os.path.exists(ZIP_PATH):
        print(f"ERROR: missing {ZIP_PATH}", file=sys.stderr)
        sys.exit(1)

    workdir = tempfile.mkdtemp(prefix="wbz_")
    try:
        with zipfile.ZipFile(ZIP_PATH) as z:
            z.extractall(workdir)
        manuals_dir = os.path.join(workdir, "Manuals_Visual")
        flashcards_dir = os.path.join(workdir, "Flashcards")
        reference_dir = os.path.join(workdir, "Reference")

        tracks: List[Dict[str, Any]] = []
        total_questions = 0
        total_flashcards = 0
        total_chapters = 0

        for key, name, category, manual_file, fc_file in TRACKS:
            manual_path = os.path.join(manuals_dir, manual_file)
            if not os.path.exists(manual_path):
                print(f"  [warn] missing manual: {manual_file}", file=sys.stderr)
                continue
            print(f"[parse] {name}")
            track = parse_manual(manual_path, key, name, category)
            track["flashcards"] = parse_flashcards(
                os.path.join(flashcards_dir, fc_file)
            )

            # Counters
            track["counts"] = {
                "chapters": len(track["chapters"]),
                "subsections": sum(
                    len(c["subsections"]) for c in track["chapters"]
                ),
                "practice_questions": len(track["practice_questions"]),
                "flashcards": len(track["flashcards"]),
            }
            total_questions += track["counts"]["practice_questions"]
            total_flashcards += track["counts"]["flashcards"]
            total_chapters += track["counts"]["chapters"]
            tracks.append(track)

        # Verified tax reference (markdown)
        ref_path = os.path.join(reference_dir, "verified_tax_numbers.md")
        ref_md = ""
        if os.path.exists(ref_path):
            with open(ref_path, encoding="utf-8") as f:
                ref_md = f.read()

        master = parse_master_manual(MASTER_DOCX)

        out = {
            "schema_version": 1,
            "generated_from": "WealthBridgeLibraryv11_QA.zip + EMBA master manual",
            "categories": CATEGORY_META,
            "tracks": tracks,
            "reference": {
                "tax_reference_markdown": ref_md,
            },
            "master_manual": {
                "sections_count": len(master["sections"]),
                "word_count": master["word_count"],
                "sections": master["sections"][:60],
            },
            "stats": {
                "total_tracks": len(tracks),
                "total_chapters": total_chapters,
                "total_practice_questions": total_questions,
                "total_flashcards": total_flashcards,
            },
        }

        os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
        with open(OUTPUT, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)

        size_kb = os.path.getsize(OUTPUT) / 1024
        print(f"\nWrote {OUTPUT} ({size_kb:.1f} KB)")
        print(f"  tracks         : {out['stats']['total_tracks']}")
        print(f"  chapters       : {out['stats']['total_chapters']}")
        print(f"  practice qs    : {out['stats']['total_practice_questions']}")
        print(f"  flashcards     : {out['stats']['total_flashcards']}")
        print(f"  master sections: {len(master['sections'])}")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    main()
