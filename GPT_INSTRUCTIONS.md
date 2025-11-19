# 🎨 Gamma MCP Server - Komplett Instruktionsguide för GPT-modeller

**Version:** 2.1.0
**MCP Endpoint:** https://gamma-mcp-server.onrender.com/mcp
**Protocol:** MCP (Model Context Protocol) v2024-11-05

---

## 📋 Innehåll

1. [Översikt](#översikt)
2. [Tillgängliga Verktyg](#tillgängliga-verktyg)
3. [Workflow & Best Practices](#workflow--best-practices)
4. [Detaljerade Parametrar](#detaljerade-parametrar)
5. [Användarexempel](#användarexempel)
6. [Felhantering](#felhantering)
7. [Tips & Tricks](#tips--tricks)

---

## 🎯 Översikt

Gamma MCP Server ger dig tillgång till Gamma.app's kraftfulla AI för att skapa professionella presentationer, dokument, webbsidor och sociala inlägg. Servern exponerar 5 verktyg via MCP-protokollet.

**Vad du kan skapa:**
- 📊 Presentationer (PowerPoint-stil)
- 📄 Dokument (rapporter, artiklar)
- 🌐 Webbsidor (one-pagers)
- 📱 Sociala inlägg (Instagram, LinkedIn, etc.)

---

## 🔧 Tillgängliga Verktyg

### 1. `gamma_generate`
**Huvudverktyg för att skapa nytt innehåll**

**Användning:** Generera presentationer, dokument, webbsidor eller sociala inlägg från text-prompt.

**Obligatoriska parametrar:**
- `inputText` (string) - Innehåll/prompt för att skapa gamma
- `textMode` (enum) - Hur texten ska processas:
  - `generate` - Expandera innehållet (från kort prompt)
  - `condense` - Sammanfatta innehållet
  - `preserve` - Behåll texten som den är

**Viktiga valfria parametrar:**
- `format` (enum) - `presentation` | `document` | `webpage` | `social`
- `themeId` (string) - ID för tema (hämta med `gamma_list_themes`)
- `numCards` (number) - Antal slides/kort (1-60 Pro, 1-75 Ultra)
- `textOptions` (object):
  - `language` (string) - Språkkod: `sv`, `en`, `de`, `fr`, etc.
  - `tone` (string) - `professional`, `casual`, `friendly`, `technical`, etc.
  - `amount` (enum) - `brief`, `medium`, `detailed`, `extensive`
  - `audience` (string) - Målgrupp: "executives", "developers", "students", etc.
- `imageOptions` (object):
  - `source` (enum) - `aiGenerated`, `unsplash`, `webAllImages`, `noImages`, etc.
  - `model` (string) - AI-bildmodell
  - `style` (string) - Bildstil: "photographic", "illustration", "minimal", etc.
- `cardOptions` (object):
  - `dimensions` (enum) - `fluid`, `16x9`, `4x3`, `pageless`, `letter`, `a4`, `1x1`, `4x5`, `9x16`
- `sharingOptions` (object):
  - `workspaceAccess` (enum) - `noAccess`, `view`, `comment`, `edit`, `fullAccess`
  - `externalAccess` (enum) - `noAccess`, `view`, `comment`, `edit`
- `exportAs` (enum) - `pdf` | `pptx` (exportera utöver gamma-länk)
- `folderIds` (array) - Array av mapp-ID:n för organisering
- `additionalInstructions` (string) - Extra specifikationer (max 2000 tecken)

**Returnerar:** `{ generationId: string }` - Används för att polla status

---

### 2. `gamma_create_from_template`
**Skapa från befintlig mall**

**Användning:** Anpassa en befintlig Gamma till nytt innehåll medan strukturen bevaras.

**Obligatoriska parametrar:**
- `gammaId` (string) - ID på mall-gamma
- `prompt` (string) - Nytt innehåll och instruktioner

**Valfria parametrar:**
- `themeId` (string) - Överskriv mallens tema
- `imageOptions`, `sharingOptions`, `exportAs`, `folderIds` - Samma som `gamma_generate`

**Returnerar:** `{ generationId: string }`

---

### 3. `gamma_get_generation`
**Hämta status för generering**

**Användning:** Polla denna endpoint för att få status och slutlig URL.

**Obligatoriska parametrar:**
- `generationId` (string) - ID från `gamma_generate` eller `gamma_create_from_template`

**Returnerar:**
```json
{
  "status": "pending" | "processing" | "completed" | "failed",
  "url": "https://gamma.app/docs/...",  // När completed
  "pdfUrl": "...",  // Om exportAs: "pdf"
  "pptxUrl": "..." // Om exportAs: "pptx"
}
```

**Polling-strategi:** Polla var 2-3 sekund tills `status === "completed"`

---

### 4. `gamma_list_themes`
**Lista tillgängliga teman**

**Användning:** Få alla tillgängliga teman för att använda i `themeId`.

**Valfria parametrar:**
- `query` (string) - Sök efter tema-namn
- `limit` (number) - Max antal (default 20, max 50)
- `after` (string) - Cursor för paginering

**Returnerar:**
```json
{
  "data": [
    {
      "id": "2qfffveelf4npp0",
      "name": "Allgot tema",
      "type": "custom",
      "colorKeywords": [...],
      "toneKeywords": [...]
    }
  ],
  "hasMore": true,
  "nextCursor": "..."
}
```

---

### 5. `gamma_list_folders`
**Lista mappar i workspace**

**Användning:** Organisera gammas i mappar.

**Valfria parametrar:**
- `query` (string) - Sök mappar
- `limit` (number) - Max antal
- `after` (string) - Pagination cursor

**Returnerar:** Lista med mappar inkl. ID:n

---

## 🔄 Workflow & Best Practices

### Standard Workflow för Ny Presentation

```
1. Förbered innehåll
   ↓
2. (Valfritt) Lista teman → Välj tema
   ↓
3. Anropa gamma_generate med parametrar
   ↓
4. Ta emot generationId
   ↓
5. Polla gamma_get_generation var 2-3 sek
   ↓
6. När status = "completed", hämta URL
   ↓
7. Presentera URL till användaren
```

### Best Practices

#### ✅ GÖR:

1. **Använd rätt textMode:**
   - `generate` för korta prompts (1-3 meningar)
   - `preserve` för färdigt innehåll
   - `condense` för långa texter som behöver sammanfattas

2. **Specificera språk:**
   - Använd alltid `textOptions.language` för icke-engelska presentationer
   - Exempel: `"language": "sv"` för svenska

3. **Anpassa målgrupp:**
   - Använd `textOptions.audience` för bättre anpassning
   - Exempel: "executives", "technical team", "students"

4. **Välj rätt format:**
   - `presentation` - För slide-decks
   - `document` - För längre textdokument
   - `webpage` - För one-pagers
   - `social` - För kortare sociala inlägg

5. **Hantera bilder strategiskt:**
   - `aiGenerated` - Bäst kvalitet men långsammare
   - `unsplash` - Snabbt, professionella foton
   - `noImages` - Snabbast, text-fokuserat

6. **Exportera vid behov:**
   - Använd `exportAs: "pdf"` för delning
   - Använd `exportAs: "pptx"` för redigering i PowerPoint

#### ❌ UNDVIK:

1. För långa `inputText` utan `condense` mode
2. Att glömma specificera språk för icke-engelska presentationer
3. För många kort (`numCards`) utan tillräckligt innehåll
4. Att inte polla `gamma_get_generation` - status behövs!

---

## 📖 Detaljerade Parametrar

### TextOptions

**Fullständig referens:**

```typescript
textOptions: {
  amount: "brief" | "medium" | "detailed" | "extensive",
  tone: string,  // Fritext: professional, casual, friendly, technical, playful, formal
  audience: string,  // Fritext: executives, developers, students, general public
  language: string  // ISO 639-1: sv, en, de, fr, es, zh-cn, ja, ko, pt-br, etc.
}
```

**Vanliga kombinationer:**

- **Företagspresentation:** `tone: "professional"`, `audience: "executives"`, `amount: "medium"`
- **Utbildningsmaterial:** `tone: "friendly"`, `audience: "students"`, `amount: "detailed"`
- **Teknisk dokumentation:** `tone: "technical"`, `audience: "developers"`, `amount: "extensive"`

### ImageOptions

```typescript
imageOptions: {
  source: "aiGenerated" | "pictographic" | "unsplash" |
          "webAllImages" | "webFreeToUse" | "webFreeToUseCommercially" |
          "giphy" | "placeholder" | "noImages",
  model: string,  // AI-modell (om aiGenerated)
  style: string   // photographic, illustration, minimal, abstract, etc.
}
```

**Rekommendationer:**

- **Högsta kvalitet:** `source: "aiGenerated"`, `style: "photographic"`
- **Snabbast:** `source: "unsplash"` eller `source: "noImages"`
- **Kreativt:** `source: "aiGenerated"`, `style: "illustration"`

### CardOptions

```typescript
cardOptions: {
  dimensions: "fluid" | "16x9" | "4x3" | "pageless" |
              "letter" | "a4" | "1x1" | "4x5" | "9x16",
  headerFooter: {
    // Konfigurera sidhuvud/sidfot
  }
}
```

**Användningsfall:**

- **Standard-presentation:** `16x9` (widescreen)
- **Tryck:** `letter` eller `a4`
- **Mobiloptimerad:** `9x16`
- **Instagram:** `1x1` eller `4x5`

---

## 💡 Användarexempel

### Exempel 1: Enkel Företagspresentation

**Användarförfrågan:** "Skapa en presentation om vår nya AI-produkt"

**Din respons:**

```typescript
// Steg 1: Generera presentation
gamma_generate({
  inputText: "Vår nya AI-produkt revolutionerar kundsupport genom att automatisera 80% av förfrågningar med naturlig språkförståelse. Nyckelfunktioner: 24/7 tillgänglighet, flerspråkigt stöd, integration med befintliga system.",
  textMode: "generate",
  format: "presentation",
  numCards: 8,
  textOptions: {
    language: "sv",
    tone: "professional",
    audience: "executives",
    amount: "medium"
  },
  imageOptions: {
    source: "aiGenerated",
    style: "professional"
  },
  cardOptions: {
    dimensions: "16x9"
  }
})

// Steg 2: Polla status
// (Vänta 2-3 sek, anropa gamma_get_generation)

// Steg 3: Presentera resultat
"✅ Din presentation är klar!
📊 8 slides om er AI-produkt
🔗 Länk: https://gamma.app/docs/..."
```

---

### Exempel 2: Utbildningsmaterial med Specifikt Tema

**Användarförfrågan:** "Skapa en utbildningspresentation om Python-programmering, använd Allgot-temat"

```typescript
// Steg 1: Lista teman för att hitta Allgot
const themes = gamma_list_themes({ query: "allgot", limit: 5 })
// Resultat: { id: "2qfffveelf4npp0", name: "Allgot tema" }

// Steg 2: Generera med tema
gamma_generate({
  inputText: `
# Python Programmering - Grundkurs

## Introduktion
Python är ett populärt programmeringsspråk...

## Variabler och Datatyper
- Strängar
- Tal
- Listor
...
  `,
  textMode: "preserve",  // Använd texten som den är
  format: "presentation",
  themeId: "2qfffveelf4npp0",  // Allgot tema
  numCards: 15,
  textOptions: {
    language: "sv",
    tone: "friendly",
    audience: "students",
    amount: "detailed"
  },
  imageOptions: {
    source: "aiGenerated",
    style: "illustration"
  }
})
```

---

### Exempel 3: Snabb Social Media Post

**Användarförfrågan:** "Gör ett Instagram-inlägg om vår julkampanj"

```typescript
gamma_generate({
  inputText: "Julkampanj 2024! 🎄 50% rabatt på alla produkter. Erbjudandet gäller till 24 december.",
  textMode: "generate",
  format: "social",
  numCards: 1,
  textOptions: {
    language: "sv",
    tone: "playful",
    amount: "brief"
  },
  imageOptions: {
    source: "aiGenerated",
    style: "festive"
  },
  cardOptions: {
    dimensions: "1x1"  // Instagram square
  }
})
```

---

### Exempel 4: Dokument med PDF-Export

**Användarförfrågan:** "Skapa en rapport om Q4-resultat och exportera som PDF"

```typescript
gamma_generate({
  inputText: "Q4 2024 Financial Results: Revenue increased 25% YoY to $5.2M. Key highlights: New customer acquisition up 40%, retention rate 95%, expanded to 3 new markets.",
  textMode: "generate",
  format: "document",
  numCards: 12,
  textOptions: {
    language: "en",
    tone: "professional",
    audience: "board members",
    amount: "extensive"
  },
  imageOptions: {
    source: "unsplash"
  },
  cardOptions: {
    dimensions: "letter"
  },
  exportAs: "pdf",  // Exportera som PDF
  additionalInstructions: "Include charts and graphs for financial data. Use conservative color scheme."
})
```

---

## ⚠️ Felhantering

### Vanliga Fel & Lösningar

**1. "Unknown method: initialize"**
- **Orsak:** Servern stöder inte initialize (gammalt problem, nu fixat i v2.1.0)
- **Lösning:** Använd senaste versionen av servern

**2. Generation timeout**
- **Orsak:** Komplexa AI-bilder tar längre tid
- **Lösning:**
  - Polla längre (upp till 60 sekunder)
  - Använd `source: "unsplash"` istället för `aiGenerated`

**3. "Invalid language code"**
- **Orsak:** Felaktig språkkod
- **Lösning:** Använd ISO 639-1 koder (sv, en, de, etc.)
- **Stödda språk:** en, sv, de, fr, es, it, pt-br, zh-cn, ja, ko, ru, ar, och fler

**4. "Too many cards"**
- **Orsak:** För många kort för plan-nivån
- **Lösning:** Begränsa till 60 kort (Pro) eller 75 (Ultra)

**5. Generation status "failed"**
- **Orsak:** Ogiltiga parametrar eller API-fel
- **Lösning:**
  - Kontrollera parametrar
  - Förenkla prompt
  - Prova igen med `noImages`

---

## 🎓 Tips & Tricks

### 1. Effektiv Prompt-Skrivning

**❌ Dålig prompt:**
```
"Gör en presentation om AI"
```

**✅ Bra prompt:**
```
"En 10-slides presentation om hur AI transformerar kundsupport. Fokusera på:
1. Nuvarande utmaningar
2. AI-lösningar
3. ROI och besparingar
4. Implementation
5. Framtida möjligheter

Målgrupp: VD:ar i medelstora företag
Ton: Professionell men tillgänglig"
```

### 2. Tema-Strategi

**För företag:**
- Använd custom tema (Allgot tema: `2qfffveelf4npp0`)
- Sök efter teman som matchar färgschema: `gamma_list_themes({ query: "blue professional" })`

**För snabbt resultat:**
- Skippa tema (använd standard)
- Eller välj populära standardteman: "Ash", "Minimal", "Modern"

### 3. Bilder vs Hastighet

**Snabbast (5-10 sekunder):**
```typescript
imageOptions: { source: "noImages" }
```

**Balanserat (15-20 sekunder):**
```typescript
imageOptions: { source: "unsplash" }
```

**Högsta kvalitet (30-60 sekunder):**
```typescript
imageOptions: {
  source: "aiGenerated",
  style: "photographic",
  model: "latest"
}
```

### 4. Organisering med Mappar

```typescript
// Lista mappar
const folders = gamma_list_folders({ query: "Kundpresentationer" })

// Spara i mapp
gamma_generate({
  // ... andra parametrar
  folderIds: [folders.data[0].id]
})
```

### 5. Multi-Format Export

```typescript
gamma_generate({
  // ... innehåll
  exportAs: "pptx"  // Genererar både Gamma-länk OCH PowerPoint-fil
})

// Användaren får:
// - url: Gamma-länk för visning/delning
// - pptxUrl: PowerPoint för nedladdning/redigering
```

### 6. Från Mall (Återanvändning)

```typescript
// Skapa en gång, återanvänd struktur
gamma_create_from_template({
  gammaId: "befintlig-gamma-id",
  prompt: "Nytt innehåll för Q1 2025",
  themeId: "2qfffveelf4npp0"  // Byt tema
})
```

### 7. Batch-Generering

För flera presentationer:
```typescript
const topics = ["AI", "Cloud", "Security"]

for (const topic of topics) {
  const { generationId } = gamma_generate({
    inputText: `Presentation om ${topic}`,
    // ...
  })

  // Spara generationIds för polling
  generationIds.push(generationId)
}

// Polla alla parallellt
```

---

## 🚀 Snabbstart-Checklista

När användare ber om presentation:

- [ ] Identifiera format (`presentation`, `document`, `webpage`, `social`)
- [ ] Bestäm språk (viktigt för icke-engelska!)
- [ ] Välj textMode (`generate` för kort prompt, `preserve` för färdig text)
- [ ] Ange antal kort (`numCards`) baserat på innehåll
- [ ] Specificera målgrupp och ton i `textOptions`
- [ ] Välj bildstrategi (hastighet vs kvalitet)
- [ ] Överväg tema (custom eller standard)
- [ ] Behövs export? (`pdf`/`pptx`)
- [ ] Generera med `gamma_generate`
- [ ] Polla `gamma_get_generation` tills klar
- [ ] Presentera URL för användaren

---

## 📞 Support & Versioner

**Aktuell version:** 2.1.0
**Protokoll:** MCP v2024-11-05
**Endpoint:** https://gamma-mcp-server.onrender.com/mcp

**Changelog:**
- v2.1.0: Full MCP-protokoll support (initialize + notifications)
- v2.0.0: Complete Gamma API v1.0 implementation
- v1.0.0: Initial release

---

## 🎯 Sammanfattning för GPT

**Du har tillgång till 5 verktyg:**

1. **gamma_generate** - Skapa nytt innehåll (HUVUDVERKTYG)
2. **gamma_create_from_template** - Skapa från mall
3. **gamma_get_generation** - Hämta status/URL (KRÄVS efter generering)
4. **gamma_list_themes** - Lista teman
5. **gamma_list_folders** - Lista mappar

**Standard workflow:**
```
Användare begär presentation
→ gamma_generate (med lämpliga parametrar)
→ Få generationId
→ Polla gamma_get_generation var 2-3 sek
→ När completed: Presentera URL
```

**Viktiga detaljer:**
- Använd ALLTID rätt `language` för icke-engelska
- Välj `textMode` baserat på prompt-längd
- Anpassa `tone` och `audience` för bättre resultat
- `aiGenerated` bilder = bäst kvalitet men långsammare
- Polla status - ge aldrig URL innan `status === "completed"`

**Custom tema tillgängligt:**
- **Allgot tema:** ID `2qfffveelf4npp0`

Nu är du redo att skapa professionella Gamma-presentationer! 🚀
