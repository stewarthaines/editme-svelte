# Georgian (ka) UI glossary and conventions

Terminology anchors for the SEED.html Georgian localization. Terms marked **[GNOME]** are attested in the GNOME Georgian translations (gtk, nautilus — mined 2026-07-13); terms marked _[unverified]_ are the translator's best rendering and deserve native-reviewer attention first. This document doubles as the reviewer's brief.

## Conventions

- Register: neutral-formal, matching Georgian software convention (GNOME/Microsoft practice). Imperative UI labels use the verbal-noun form (შენახვა, not შეინახე).
- Georgian script is unicameral — no capitalization exists or is simulated.
- Do not translate: SEED.html, Simple EPUB Editor (on first mention may be glossed), EPUB, OPDS, PDF, XHTML, CSS, HTML, SVG, Djot, Markdown, Textile, AsciiDoc, LaTeX, URL, ZIP, ID. File names, paths, and placeholder tokens (`{name}`, `{count}`, `<label>`) stay verbatim.
- Punctuation: keep the ellipsis character `…`; Georgian uses the same comma/period conventions as English UI text.

## Core actions

| English   | Georgian          | Source                            |
| --------- | ----------------- | --------------------------------- |
| Save      | შენახვა           | [GNOME]                           |
| Cancel    | გაუქმება          | [GNOME]                           |
| Delete    | წაშლა             | [GNOME gtk]                       |
| Remove    | მოცილება          | [GNOME gtk]                       |
| Rename    | გადარქმევა        | [GNOME gtk]                       |
| Open      | გახსნა            | [GNOME]                           |
| Close     | დახურვა           | [GNOME]                           |
| Copy      | კოპირება          | [GNOME]                           |
| Paste     | ჩასმა             | [GNOME]                           |
| Undo      | დაბრუნება         | [GNOME gtk]                       |
| Redo      | გამეორება         | [GNOME]                           |
| Create    | შექმნა            | [GNOME]                           |
| Add       | დამატება          | [GNOME]                           |
| Replace   | ჩანაცვლება        | [GNOME nautilus]                  |
| Skip      | გამოტოვება        | [GNOME]                           |
| Retry     | თავიდან ცდა       | [GNOME]                           |
| Select    | არჩევა / მონიშვნა | [GNOME] (choose vs mark-select)   |
| Search    | ძებნა             | [GNOME]                           |
| Sort      | დალაგება          | [GNOME]                           |
| Edit      | ჩასწორება         | [GNOME gtk]                       |
| Apply     | გადატარება        | [GNOME gtk]                       |
| Download  | ჩამოტვირთვა       | _[unverified]_ (common web usage) |
| Upload    | ატვირთვა          | _[unverified]_ (common web usage) |
| Import    | იმპორტი           | _[unverified]_                    |
| Export    | ექსპორტი          | _[unverified]_                    |
| Refresh   | განახლება         | _[unverified]_                    |
| Publish   | გამოქვეყნება      | _[unverified]_                    |
| Duplicate | დუბლირება         | _[unverified]_                    |

## Objects and nouns

| English                | Georgian     | Source                                                             |
| ---------------------- | ------------ | ------------------------------------------------------------------ |
| File                   | ფაილი        | [GNOME]                                                            |
| Folder                 | საქაღალდე    | [GNOME]                                                            |
| Name                   | სახელი       | [GNOME]                                                            |
| Size                   | ზომა         | [GNOME]                                                            |
| Type                   | ტიპი         | [GNOME gtk]                                                        |
| Settings / Preferences | პარამეტრები  | [GNOME gtk] (nautilus uses მორგება; we standardize on პარამეტრები) |
| Properties             | თვისებები    | [GNOME]                                                            |
| Location               | მდებარეობა   | [GNOME gtk]                                                        |
| Language               | ენა          | [GNOME gtk]                                                        |
| Font                   | შრიფტი       | [GNOME]                                                            |
| Image                  | გამოსახულება | [GNOME]                                                            |
| Error                  | შეცდომა      | _[unverified]_ (ubiquitous)                                        |
| Warning                | გაფრთხილება  | _[unverified]_ (ubiquitous)                                        |
| Help                   | დახმარება    | [GNOME]                                                            |
| About                  | შესახებ      | [GNOME gtk]                                                        |
| Version                | ვერსია       | _[unverified]_                                                     |
| Default                | ნაგულისხმევი | [GNOME gtk]                                                        |
| None                   | არცერთი      | [GNOME gtk]                                                        |
| Unknown                | უცნობი       | [GNOME]                                                            |
| Yes / No               | დიახ / არა   | [GNOME gtk]                                                        |
| Loading…               | იტვირთება…   | [GNOME]                                                            |
| Preview                | გადახედვა    | _[unverified]_                                                     |

## Book and publishing domain

| English              | Georgian                                                               | Source                                     |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| Book                 | წიგნი                                                                  | common                                     |
| Chapter              | თავი                                                                   | common                                     |
| Title                | სათაური                                                                | common                                     |
| Author               | ავტორი                                                                 | common                                     |
| Cover                | ყდა                                                                    | common                                     |
| Page                 | გვერდი                                                                 | common                                     |
| Reader (person)      | მკითხველი                                                              | common                                     |
| Reading system       | წამკითხველი / კითხვის სისტემა                                          | _[unverified — review]_                    |
| Project              | პროექტი                                                                | _[unverified]_                             |
| Workspace            | სამუშაო სივრცე                                                         | _[unverified]_                             |
| Metadata             | მეტამონაცემები                                                         | _[unverified]_                             |
| Manifest (OPF)       | მანიფესტი                                                              | _[unverified — technical]_                 |
| Spine (OPF)          | keep as "spine (თავების რიგი)" on first use; UI uses "Chapters" თავები | _[review]_                                 |
| Extension            | გაფართოება                                                             | _[unverified]_ (browser-extension usage)   |
| Plugin               | მოდული / პლაგინი                                                       | _[unverified — review]_                    |
| Template             | შაბლონი                                                                | _[unverified]_                             |
| Transform (n.)       | გარდაქმნა                                                              | _[unverified]_                             |
| Fixed layout         | ფიქსირებული განლაგება                                                  | _[unverified]_                             |
| Accessibility        | წვდომადობა                                                             | _[unverified — review; also მისაწვდომობა]_ |
| Publish view / shelf | თარო (shelf)                                                           | _[review]_                                 |

## Notes for reviewers

- The whole first pass is machine-generated; `process/KA_REVIEW.md` lists every string with a confidence flag, most-visible strings first. Correcting that list corrects the app.
- Where GNOME modules disagree (Delete, Settings) we standardized; overrule freely — consistency matters more than the specific choice.
