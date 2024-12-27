# System for Uniform Phonetic Representation (SUPR)
By: Simon Y. Blackwell, Copyright 2024


# Executive Summary
The System for Uniform Phonetic Representation (SUPR) is a flexible, keyboard-friendly transcription system designed
for both non-tonal and tonal languages. It uses standard keyboard characters and provides consistent modifier stacking
to support both left-to-right and right-to-left writing systems. The system offers basic coverage for non-tonal
languages and enhanced notation for tonal languages, making it suitable for digital input and monospace fonts while
maintaining explicit and unambiguous notation. It is also designed to express phonetics using either Latin characters
or in the readers native script and adds mood modifiers (exclamation/question) to phonetic mapping. The focus is on 
automated text conversion as well as cross-language standard keyboard input, readability, and utility for indexing 
dimensions that may impact semantics beyond syllables rather than precise acoustic representation.

# 1. Introduction
## 1.1 Purpose
The Uniform Phonetic Writing System provides a standardized method for phonetic transcription that balances accuracy,
ease of input, and universal compatibility. It was designed as a simpler alternative to the International Phonetic Alphabet
in order to support phonetic indexing across languages, but may also serve researchers, linguists, and language
learners who need a practical system for digital phonetic notation in either a Latin character set or their native language.

We hope you find it useful.

- {lang:eng} > wi: h[ou]p ju: f[ai]nd [i]t ju:s·f[u]l
- {lang:الإنجليزية} > وي هوب يو فايند إت يوسفُل
- {lang:영어} > 위 호우프 유 파인드 잇 유스풀

"نأمل أن تجده مفيد

- {lang:العربية} > n[a]'·m[a]l [a]n t[a]·[dj]i·d[a]·hu mu·f[i]·d[a]n >>
- {lang:아랍어} > 나으말 안 타지다후 무피단

유용하게 찾으시길 바랍니다

- {lang:한국어} > yu·yong·h[a]·ge ch[a]·d[u]·shi·gil ba·r[a]·mn[i]·da
- {lang:الكورية} > يُيونغهاجي تشاجُوسيجيل بارامنيدا

## 1.2 Core Design Principles

Use standard keyboard characters
Stack modifiers in consistent order
Support both LTR and RTL writing systems
Maintain explicit and unambiguous notation
Optimize for digital input and monospace fonts
Provide basic coverage for non-tonal languages
Support enhanced notation for tonal languages

## 1.3 Scope
This specification covers the complete system implementation, including:

Base character set for consonants and vowels
Modification systems for both basic and enhanced versions
Digital implementation guidelines
Language-specific mappings
Implementation recommendations

# 2. Base System
## 2.1 Base Characters
Consonants
Labial: p b b' m f v w
Dental/Alveolar: t d d' n s z l r
Postalveolar: [sh] [zh] [ch] j
Palatal: c [gj] [nj] y
Velar: k g [ng]
Uvular: q (Voiceless uvular stop) G (Voiced uvular stop) [qh]
Glottal: h ['] (for glottal stop)
Implosive: [b'] (Voiced bilabial implosive) [d'] (Voiced alveolar implosive)

Vowels
High: i u [ue] [uh] (Unrounded high back vowel)
Mid: e o [oe] [eh] (Open-mid front unrounded vowel)
Low: a [aa] [ao]


## 2.2 Structural Markers
Grouping
Simple cluster: [kw]
Optional element: (t)
Complex cluster: str
Vowel combinations: [oe], [ue], [ae]

Boundaries
Syllable: · (middle dot)
Morpheme: -
Word: space
Phrase: > (LTR), < (RTL)
Sentence: >> (LTR), << (RTL)

Sentence with mood: 
- >>? >>! (LTR questions/exclamations)
- ?<< !<< (RTL questions/exclamations)

Boundary Guidelines
Boundary markers are context-dependent indicators of text direction and structure
Use minimal markers to convey necessary directional or structural information
Phrase markers (>, <) are recommended for:
- Disambiguating text direction in mixed-language contexts
- Clarifying text structure in complex transcriptions

Sentence markers (>>, <<) are used for:
- Longer passages or complete sentences
- Indicating distinct paragraph or section boundaries

Omit markers for:
- Single words or short phonetic fragments
- Contexts where text direction is already clear
  The primary goal is clarity without unnecessary notation.

## 2.3 Writing Direction
Left-to-Right (LTR)
- Basic Version: base + feature + length + stress
- Enhanced Version: base + feature + length + stress + tone
- Boundaries: > (phrase), >> (sentence)
- Sentence Mood: Append ? or ! after >> for questions/exclamations

Right-to-Left (RTL)
- Basic Version: stress + length + feature + base
- Enhanced Version: tone + stress + length + feature + base
- Boundaries: < (phrase), << (sentence)
- Sentence Mood: Prepend ? or ! before << for questions/exclamations


## 2.4 Metadata Markers
Metadata markers use a curly brace containers {key:value,...} where multiple key and value pairs are unquoted identifiers or strings without spaces. The marker appears immediately before sentence (>>), phrase (>), or word delimiters. Multiple metadata markers may be present.

### 2.4.1 Language Codes
Language codes are specified using the metadata marker format {lang:ISO-code} to indicate the source language of subsequent SUPR text. This supports automated translation and reversibility.
Guidelines for Language Code Markers:

- Place immediately before sentence (>>), phrase (>), or word delimiters
- Process left-to-right, applying to all subsequent text until another code appears
- Use standard ISO language codes (e.g., {lang:eng}, {lang:ara}, {lang:heb})
- Optional but useful for mixed-language contexts or where there is a desire to support teaching for written language expression
- Some SUPR encodings may reverse to different written characters depending on the specified language code

Airport Baggage Claim Sign (English-Arabic-Hebrew)
Original: "Baggage Claim استلام الأمتعة קבלת מטען Terminal 3"
Transcription: {lang:eng} > b[ae]·g[i][dj] kl[ei]m > {lang:ara} [i]s·ti·l[aa]m < [a]l·[a]m·ti·[a] << {lang:heb} ka·ba·l[a]t < me·t[a]·[a]n > {lang:eng} t[er]·mi·n[a]l > [th]ri:

# 3. System Variants
## 3.1 Basic Version
Focused on segmental phonemes
Simplified modifier system
Suitable for most Indo-European languages
Core set of diacritics and length markers

## 3.2 Enhanced Version
Includes all basic version features
Complete tone marking system
Additional diacritics for tone languages
Extended modifier combinations

## 3.3 Version Comparison
FeatureBasic VersionEnhanced VersionTone SupportNoYesModifier ComplexityLowHighTarget LanguagesNon-tonalAllInput ComplexitySimpleComplex

## 3.4 Compressed Versions
Mappings
Consonants:
[sh] → ʃ
[zh] → ʒ
[ch] → ʧ
[th] → θ
[dh] → ð
[ng] → ŋ
[nj] → ɲ
[gj] → ɟ
[uh] → ɯ
[eh] → ɛ
G → ɢ
[qh] → χ
['] → ʔ

Vowels:
[ae] → æ
[oe] → ø
[ue] → y
[ao] → ɔ
[aa] → ɑ

Purpose
Reduce character count for common phonemes
Maintain readability in Unicode-capable environments
Provide reversible mapping to standard format

Example
English: "supermarket"
Standard Version:
> [sh][ue]·p[er]·m[aa]·k[et]
Compressed Version:
> ʃy·pər·mɑ·kət

# 4. Modification System
## 4.1 Basic Modifiers
Length
Normal: a
Long: a:
Extra long: a::

Stress
Primary: a'
Secondary: a"
Unstressed: a

## 4.2 Enhanced Modifiers
Tone Position Markers
High: ^
Mid: -
Low: _

Tone Patterns
Level tones:
High level: a^
Mid level: a- (optional, only required for complex transitions)
Low level: a_

Moving tones:
High to mid: a^-
High to low: a^_
Mid to high: a-^
Mid to low: a-_
Low to mid: a_-
Low to high: a_^

Complex tones:
High-mid-low: a^-_
Low-mid-high: a_-^

## 4.3 Consonant Modifications
Aspiration: add 'h' → [ph], [th], [kh]
Palatalization: add 'j' → [tj], [dj], [nj]
Retroflexion: add 'r' → [tr], [dr], [nr]
Labialization: add 'w' → [kw], [gw]
Voicing change: related pair → p/b, t/d, k/g

## 4.4 Vowel Modifications
Nasalization: add 'n' → [an], [en], [in]
Frontness: add 'i' → [ai], [oi]
Backness: add 'u' → [au], [ou]
Rounding: add 'w' → [aw], [ew]

# 5. Implementation
## 5.1 Digital Format
Plain text (.txt)
UTF-8 encoding
Line-based format
Optional metadata headers
Version indicator in header

## 5.2 Input Methods
Keyboard Layout
Base Layer:
All ASCII letters
Common punctuation
Numbers

Shift Layer:
Length modifiers (:)
Special grouping [] ()
Tone markers (^ - _) [Enhanced Version]

Alt Layer:
Middle dot (·)
Special characters

# 6. Sample Transcriptions
Examples Using New Phonemes

Arabic (Enhanced Version with Uvulars)
Original: "قال" (said)
Transcription: q[aa]·l[a] >
Note: Shows uvular stop [q]

Hausa (Basic Version with Implosives)
Original: "ɓaƙi" (black)
Transcription: b'a·[qh]i >
Note: Shows bilabial implosive [b']

Turkish (Basic Version with Unrounded Vowel)
Original: "kız" (girl)
Transcription: k[uh]z >
Note: Shows unrounded high back vowel [uh]

Amharic (Enhanced Version with Glottal Stop)
Original: "ስዕል" (picture)
Transcription: s[ih][']·[ih]l >
Note: Shows glottal stop [']

Standard Examples

Left-to-Right (LTR) Examples

English (Basic Version)
Original: "The quick brown fox jumps over the lazy dog."
Transcription: > the kw[i]k br[au]n f[o]ks > [dj][u]mps ou·v[er] > the lei·zi d[o]g

French (Basic Version)
Original: "Le petit chat mange du poisson."
Transcription: > l[uh] p[uh]·ti [sh]a > m[on]:[zh] dy > pw[a]·s[on]

German (Basic Version)
Original: "Ich möchte einen Kaffee, bitte."
Transcription: > [i]k m[oe]k·t[uh] > [ai]·n[uh]n ka·fe: > bi·t[uh]

Mandarin (Enhanced Version)
Original: "我喜欢喝绿茶"
Transcription: > w[o]^ [sh]i_^·h[ua]n^ > h[e]^ l[ue]^_·[ch]a^
Note: Shows rising (^), falling (^), and level (^) tones

Vietnamese (Enhanced Version)
Original: "Tôi thích uống trà xanh"
Transcription: > t[o]i^-_ th[i]k^_ [uo]_-^ng > tr[a]^ [sh][a]^_nh
Note: Demonstrates complex tone patterns with mid transitions

Right-to-Left (RTL) Examples

Arabic (Enhanced Version)
Original: "السلام عليكم"
Transcription: [a]s·sa·l[aa]m' < [a]·lei'·kum <<
Note: Shows primary stress marking

Hebrew (Basic Version)
Original: "שלום וברכה"
Transcription: [sh]a·l[o]m < ve·bra·[ch]a <<

Persian (Enhanced Version)
Original: "خوش آمدید"
Transcription: [ch][o][sh] < [aa]'·ma·d[i]d <<
Note: Shows stress patterns

Urdu (Enhanced Version)
Original: "آپ کیسے ہیں"
Transcription: [aa]p^_ < k[ei]^-·s[e] < h[ei]n^-_ <<
Note: Shows complex pitch accent patterns

Mixed Direction Examples

Business Meeting Schedule (English-Arabic)
Original: "Team Meeting الاجتماع القادم: Room 305, 2:30 PM - Project Review مراجعة تحديث API والتقرير الفني"
Transcription: > ti:m mi:·t[i]ng [a]l·[i][dj]·ti·m[aa] < [a]l·q[aa]·dim >> > ru:m > tri: z[i]·r[ou] f[ai]v > tu: t[er]·ti: pi:·[e]m > - pr[o]·[dj][e]kt ri·vju: mu·r[aa]·[dj]a·[a]t < t[a]h·d[i]th >> > ei: pi: [ai] w[a]·[a]t·t[a]q·r[i]r < [a]l·f[a]·n[i] <<

Airport Baggage Claim Sign (English-Arabic-Hebrew)
Original: "Baggage Claim استلام الأمتعة קבלת מטען Terminal 3"
Transcription: > b[ae]·g[i][dj] kl[ei]m [i]s·ti·l[aa]m < [a]l·[a]m·ti·[a] << ka·ba·l[a]t < me·t[a]·[a]n > t[er]·mi·n[a]l > tri:

# 7. Reader-Native Expression

The System for Uniform Phonetic Representation (SUPR) supports expressing phonetic transcriptions in a reader's native script while maintaining the system's structural integrity. The eliminates the requirements for readers to full understand non-native characters. This capability relies on the metadata markers, boundary indicators, and consistent phonetic mappings defined in previous sections and appendices.

## 7.1 Script Transformation Rules

When expressing SUPR in a reader's native script, the following elements must be preserved:

Structural Markers:
- Syllable boundaries (·)
- Morpheme boundaries (-)
- Directional markers (>, <)
- Sentence markers (>>, <<)
- Metadata containers {key:value}

Language Context:
- Language specifiers {lang:code} must be maintained
- Language-specific mappings from Section C must be applied
- Script direction conventions must follow Section 2.3

## 7.2 Transformation Examples

Airport Sign in Multiple Scripts:

Original SUPR:
{lang:eng} > b[ae]cg[i][dj] kl[ei]m > {lang:ara} [i]s·ti·l[aa]m < [a]l·[a]m·ti·[a] << {lang:heb} ka·ba·l[a]t < me·t[a]·[a]n > {lang:eng} t[er]·mi·n[a]l > [th]ri:

Arabic:
{lang:الإنجليزية} > بَاجِد كليم > {lang:العربية} إِستيلام < المَتيا << {lang:עברית} كابالات < ميتان > {lang:الإنجليزية} ترمينال > ثري

Hebrew:
{lang:אנגלית} > בַאגִד קלים > {lang:العربية} אִסתילאם < אלמתיא << {lang:עברית} כאבאלאת < מיתאן > {lang:אנגלית} טרמינאל > תרי

# 8. Reader-Native Pronunciation Guides

## 8.1 Core Principles

Reader-native pronunciation guides transform SUPR notation into familiar sound patterns using the reader's native language conventions. The goal is to make pronunciation immediately accessible without requiring knowledge of phonetic notation or unfamiliar scripts.

### 8.1.1 Transformation Rules

1. Sound Mapping
  - Map SUPR phonemes to closest native language equivalents
  - Preserve syllable structure and stress patterns
  - Use native conventions for indicating length and stress
  - Convert tone markers to native tone notation where relevant

2. Structure Simplification
  - Replace SUPR boundary markers with natural punctuation
  - Remove metadata markers
  - Use standard writing conventions of target language
  - Break complex syllables at natural points

3. Visual Format
  - Original text
  - Native script pronunciation guide in parentheses
  - Optional meaning in square brackets when helpful


### 8.1.2 Cross-Script Examples

English "Supermarket" for Different Readers:

Arabic Script:
supermarket (سوبَر-ماركِت)

Korean Script:
supermarket (슈퍼-마켓)

Japanese Script:
supermarket (スーパー・マーケット)

Chinese Script:
supermarket (苏泼马克特) [超市]

## 8.3 Complex Examples

### 8.3.1 Multi-Language Airport Sign

For Arabic readers:
Original: "Baggage Claim استلام الأمتعة קבלת מטען Terminal 3"
Guide: باجِج كلَيم - إستِلام الأمتِعة - كابالات مِطاعَن - تيرمينال 3

For Korean readers:
Original: "Baggage Claim استلام الأمتعة קבלת מטען Terminal 3"
Guide: 배기지 클레임 - 이스틸람 알암티아 - 카발라트 메타안 - 터미널 3

### 8.3.2 Tonal Language Examples

Mandarin "你好" for Japanese readers:
你好 (ニーハオ↓↑) [こんにちは]

Vietnamese "xin chào" for Korean readers:
xin chào (신˯ 짜오˘) [안녕하세요]

# 9. Semantic Nuance and Phonetics

Since the initial impetus for SUPR was to provide a system for phonetic indexing across languages for information retrieval, it is important to consider the impact of phonetic distinctions on meaning. This section explores how SUPR can capture tone-based, stress-based, length-based, and phonation-based semantic nuances in various languages.

## 9.1 Tone-Based Semantic Distinctions

### 9.1.1 Mandarin Chinese
- Single syllable semantic differentiation through tones
  - mā (妈, "mother") vs má (麻, "hemp") vs mǎ (马, "horse") vs mà (骂, "scold")
- SUPR representation: m[a]^ vs m[a]^- vs m[a]_^ vs m[a]^_
- Compound meaning shifts through tone sandhi
  - 买马 (mǎi mǎ) → m[ai]_^ m[a]^ (tone change affects meaning preservation)

### 9.1.2 Vietnamese
- Six-tone system encoding both meaning and grammar
- Tone as grammatical marker in compounds
- Example: có (to have) vs cỏ (grass)
  - SUPR: k[o]^- vs k[o]_^
- Complex tone interactions in compounds preserving semantic distinctions

## 9.2 Stress-Based Meaning

### 9.2.1 Russian
- Stress position changes lexical meaning
- Example: замок (castle) vs замок (lock)
  - SUPR: z[a]'·m[o]k vs z[a]·m[o]'k
- Stress shifts in declension preserving core meanings

### 9.2.2 English
- Noun-verb pairs distinguished by stress
- Example: "permit" (n) vs "permit" (v)
  - SUPR: p[er]'·m[i]t vs p[er]·m[i]'t
- Compound stress patterns indicating relationship type
  - "greenhouse" vs "green house"
  - SUPR: gri:n'·h[au]s vs gri:n > h[au]s'

## 9.3 Length and Gemination

### 9.3.1 Japanese
- Phonemic length affecting meaning
- Example: obasan (aunt) vs obaasan (grandmother)
  - SUPR: [o]·ba·s[a]n vs [o]·ba:·s[a]n
- Gemination distinctions
  - kite (come) vs kitte (stamp)
  - SUPR: ki·te vs ki·t:e

### 9.3.2 Arabic
- Root meaning preservation through consonant length
- Example: kataba (wrote) vs kattaba (caused to write)
  - SUPR: ka·ta·ba vs ka·t:a·ba
- Vowel length semantic distinctions
  - kitāb (book) vs kutub (books)
  - SUPR: ki·t[aa]b vs ku·tub

## 9.4 Glottalization and Phonation

### 9.4.1 Vietnamese
- Glottalization affecting both meaning and register
- Final glottalization as semantic marker
  - Example: học (study) vs họp (meet)
  - SUPR: h[o]k vs h[o]'p

### 9.4.2 Burmese
- Phonation types encoding meaning
- Creaky voice as semantic differentiator
  - Example: တီ /ti/ (umbrella) vs တည် /tḭ/ (stable)
  - SUPR: ti vs ti'

# Appendices

Here's the complete expanded Appendix A:

## Appendix A: Comparative Analysis with Other Phonetic Systems

### A.1 Fundamental Differences

#### Design Philosophy
- IPA: Comprehensive phonetic representation prioritizing acoustic precision
- SUPR: Pragmatic system optimized for digital input, indexing, and cross-linguistic utility

#### Character Set
- IPA: Extensive, specialized Unicode characters
  * Requires special keyboard layouts
  * Limited native font support
- SUPR: Standard keyboard characters
  * Compressed mode uses standard Unicode transliterations
  * Compatible with monospace and standard fonts
  * Easily typeable on standard keyboards

### A.2 Comparison to IPA

#### IPA Limitations
- Complex character set makes indexing challenging
- Requires specialized Unicode handling
- Difficult to search and sort in standard databases
- High cognitive load for manual entry

#### SUPR Phonetic Indexing Advantages
- Compressed mode provides one-to-one mapping with IPA
- Simplified character representation
- Consistent transliteration rules
- Easy database integration
- Reduced storage requirements

### A.2.1 Compressed Mode Mapping Examples

| Phoneme | IPA | SUPR Standard | SUPR Compressed |
|---------|-----|---------------|-----------------|
| Voiceless Postalveolar Fricative | ʃ | [sh] | ʃ |
| Palatal Nasal | ɲ | [nj] | ɲ |
| Open-mid Back Rounded Vowel | ɔ | [ao] | ɔ |
| Open Back Unrounded Vowel | ɑ | [aa] | ɑ |
| Unrounded High Back Vowel | ɯ | [uh] | ɯ |
| Open-mid Front Unrounded Vowel | ɛ | [eh] | ɛ |
| Voiced Uvular Stop | ɢ | G | ɢ |
| Voiceless Uvular Fricative | χ | [qh] | χ |

### A.3 Comparison with X-SAMPA and Kirshenbaum

#### X-SAMPA
- ASCII-based like SUPR, but follows IPA mapping philosophy
- Less intuitive for non-specialists due to arbitrary symbol choices (e.g., "}" for ʎ)
- No native support for direction or language metadata
- Better suited for computational linguistics than human reading/writing
- Lacks SUPR's built-in support for native script expression

#### Kirshenbaum (ASCII-IPA)
- Similar keyboard-friendly goals to SUPR
- More complex digraph system
- No standardized handling of tones
- Limited support for non-Latin script integration
- Lacks SUPR's metadata and directional markers

### A.4 Comparison with Romanization Systems

#### Pinyin
- Optimized specifically for Mandarin Chinese
- Simpler tone marking system than SUPR (diacritics vs. explicit markers)
- Less flexible for cross-language application
- No built-in support for RTL scripts
- More accessible for beginners but less precise for linguistic analysis

#### ALA-LC Romanization
- Focused on library cataloging needs
- Complex diacritic system requiring special input methods
- Limited support for phonetic features
- Lacks SUPR's structural boundary markers
- No native support for tonal language features

### A.5 Unique Features of SUPR

#### Cross-Script Flexibility
- Native script expression capability not present in other systems
- Consistent structural markers across writing systems
- Unified approach to both LTR and RTL languages

#### Metadata Integration
- Built-in language context markers
- Extensible metadata system for additional features
- Support for automated processing and conversion

#### Reversible Phonetic Mapping
- Bidirectional conversion between source text and phonetic representation
- Language-aware character mapping through metadata tags
- Support for multiple valid written forms based on language context

#### Modular Complexity
- Basic version for simpler non-tonal languages
- Enhanced version with complete tone marking system
- Compressed version for Unicode-capable environments
- Progressive learning path from basic to enhanced usage

#### Structural Clarity
- Explicit syllable and morpheme boundaries
- Clear sentence and phrase direction markers
- Support for mood indicators (questions/exclamations)
- Consistent modifier stacking order

#### Reader-Native Expression
- Support for expressing phonetics in reader's native script
- Preservation of structural markers across script transformations
- Language-specific pronunciation guides
- Natural punctuation adaptation for target languages

#### Indexing Optimization
- Designed for database storage and search
- Consistent character encoding across implementations
- Support for phonetic pattern matching
- Dimension-based semantic indexing capabilities



## Appendix B: Digital Implementation And Usage Guidelines

- create index entry
  1) convert original text to compressed SUPR format
  2) create an index entry as a JSON object with keys 'full' and 'syllableOnly' with empty objects as values 
  3) lower case
  4) tokenize ignoring punctuation
  5) convert each token to compressed SUPR form 
  6) add to full and syllable only index it does not exist 
  7) increment count for each syllable in full and syllable index 
  8) return index object
  
- query in any language:
  1) determine primary language of query
  /*2) translate query language to all target languages (will require call to LLM)
  3) convert each translation to its SUPR compressed form*/
  4) find matching ids based on the full compressed SUPR form and syllable compressed SUPR form
  5) score each id based on the number of matches


| Glottal Stop | ʔ | ['] | ʔ |

## Appendix C: Language Support

### C.1 Afroasiatic Languages

#### Arabic
Consonants:
- ث → [th]
- ج → [j]
- ح → [hh]
- خ → [qh]
- ذ → [dh]
- ش → [sh]
- ص → [s']
- ض → [d']
- ط → [t']
- ظ → [z']
- ع → [']
- غ → [gh]
- ق → q

Vowels:
- َ → a
- ِ → i
- ُ → u
- ا → [aa]
- ي → i:
- و → u:

Example: مُسْتَشْفَى (hospital)
Transcription: mus·t[a][sh]·f[aa] >
Features: Shows cluster handling, long vowel, and RTL

#### Amharic
Consonants:
- ቅ → [k']
- ጥ → [t']
- ፅ → [ts']
- ች → [ch]
- ሽ → [sh]
- ኝ → [nj]
- ብ → b
- ብ' → b'
- ድ' → d'
- ጭ → [qh]
- ል → l
- ም → m
- ን → n
- ር → r
- ስ → s
- ክ → k
- ው → w
- ዝ → z

Vowels:
- ä → a
- u → u
- i → i
- a → [aa]
- e → e
- ə → [uh]
- እ → [eh]
- o → o

Example: ጽድቅተኛ (righteous)
Transcription: [ts']'[uh]d·q[uh]·t[eh]·[nj]a >
Features: Shows ejective consonant, schwa vowel, and palatalization

### C.2 Niger-Congo Languages

#### Hausa
Consonants:
- ɓ → b'
- ɗ → d'
- ƙ → [k']
- ts → [ts]
- fy → [fy]
- gy → [gy]
- ky → [ky]
- sh → [sh]
- q → q
- x → [qh]

Vowels:
- a → a
- e → e
- i → i
- o → o
- u → u
- â → [aa]
- ê → [ee]
- î → [ii]
- ô → [oo]
- û → [uu]

Example: ɗauɗàwā (stealing repeatedly)
Transcription: d'au·d'[aa]·w[aa]_ >
Features: Shows implosive, diphthong, and tone marking

#### Yoruba
Tones:
- á (high) → a^
- à (low) → a_
- ā (mid) → a-

Consonants:
- ṣ → [sh]
- b' → b'
- d' → d'
- gb → [gb]

Vowels:
- ẹ → [eh]
- ọ → [ao]

Example: gbọ̀ọ́gbàá (garden egg)
Transcription: [gb][ao]_·[ao]^·[gb][aa]^ >
Features: Shows labial-velar stop, vowel quality, and tonal contrast

### C.3 Turkic Languages

#### Turkish
Consonants:
- ç → [ch]
- ş → [sh]
- ğ → silent or lengthens previous vowel
- k → k
- q → q

Vowels:
- ı → [uh]
- ö → [oe]
- ü → [ue]
- â → [aa]
- e → e
- i → i
- a → a
- o → o
- u → u

Example: güzelleştirmek (to beautify)
Transcription: g[ue]·z[eh]l·l[eh][sh]·t[ih]r·m[eh]k >
Features: Shows vowel harmony, palatalization, and suffix stacking

#### Kazakh
Consonants:
- ң → [ng]
- қ → q
- ғ → G
- һ → h

Vowels:
- ә → [ae]
- і → [ih]
- ө → [oe]
- ұ → [uh]
- ү → [ue]

Example: құрметтеу (to respect)
Transcription: q[uh]r·m[eh]t·t[eh]u >
Features: Shows uvular consonant, unrounded vowel, and gemination

### C.4 Sino-Tibetan Languages

#### Mandarin Chinese
Base Tones:
- 1st tone (高平) → ma^
- 2nd tone (上升) → ma_^
- 3rd tone (低降升) → ma_-^
- 4th tone (高降) → ma^_
- Neutral → ma-

Finals:
- ing → [ing]
- ang → [ang]
- eng → [eng]
- ong → [ong]
- iao → [yao]
- ian → [yen]

New additions:
- ü → [ue]
- er → [er]

Example: 想像 (xiǎngxiàng - to imagine)
Transcription: [sh]i[ang]_-^ [sh]i[ang]^_ >
Features: Shows complex tone pattern and nasal finals

#### Cantonese
Tones:
- 1 (高平) → a^
- 2 (中升) → a-^
- 3 (中平) → a-
- 4 (低降) → a_
- 5 (低升) → a_^
- 6 (低平) → a_-

Finals:
- aai → [aai]
- aau → [aau]
- ang → [ang]
- eng → [eng]
- eoi → [oey]
- oeng → [ong]

Example: 講嘢 (góng yéh - to speak)
Transcription: g[ao]ng-^ j[eh]^·[eh] >
Features: Shows complex finals and changed tone

### C.5 Japonic Languages

#### Japanese
Base Vowels:
- あ/ア → a
- い/イ → i
- う/ウ → [uh]
- え/エ → [eh]
- お/オ → o

Consonant + Vowel:
- か/カ → ka
- き/キ → ki
- く/ク → k[uh]
- け/ケ → k[eh]
- こ/コ → ko

Special Cases:
- ん/ン → n
- っ/ッ → gemination marker
- づ → [zu]
- ぢ → [ji]
- ゐ/ヰ → [wi]
- ゑ/ヱ → [we]

Pitch Accent:
- High start → [ka]^ta·na
- High end → ka·ta^·na
- Mid drop → ka·ta^·na_

Example: 引っ張られる (hippareru - to be pulled)
Transcription: h[ih]p·p[a]·r[a]·r[eh]·r[uh] >
Features: Shows gemination, pitch accent, and vowel devoicing

### C.6 Korean

#### Initial Consonants (초성)
- ㄱ → k
- ㄴ → n
- ㄷ → t
- ㄹ → r/l
- ㅁ → m
- ㅂ → p
- ㅃ → p'
- ㄸ → t'
- ㄲ → k'
- ㅆ → s'
- ㅅ → s
- ㅈ → [ch]
- ㅊ → [ch']
- ㅋ → k'
- ㅌ → t'
- ㅍ → p'
- ㅎ → h

#### Vowels (중성)
- ㅏ → a
- ㅓ → [eo]
- ㅗ → o
- ㅜ → u
- ㅡ → [uh]
- ㅣ → i
- ㅐ → [ae]
- ㅔ → e
- ㅚ → [oe]
- ㅟ → [wi]

Example: 깨끗하다 (kkaekkeutada - clean)
Transcription: k'[ae]·k'[uh]·t[uh]·ha·da >
Features: Shows aspirated consonants, vowel harmony, and compound structure

### C.7 Dravidian Languages

#### Tamil
Consonants:
- ங → [ng]
- ஞ → [nj]
- ண → [n.]
- ந → n
- ன → [n']
- ழ → [zh]
- ற → [tr]
- ன → [n']

Vowels:
- அ → a
- ஆ → [aa]
- இ → i
- ஈ → i:
- உ → [uh]
- ஊ → u:
- எ → [eh]
- ஏ → e:
- ஐ → [ai]
- ஒ → o
- ஓ → o:
- ஔ → [au]

Example: பொற்றாமரை (poṟṟāmarai - golden lotus)
Transcription: p[ao]r·r[aa]·ma·r[ai] >
Features: Shows retroflex consonant, long vowel, and compound

#### Telugu
Consonants:
- క → k
- ఖ → k'
- గ → g
- ఘ → g'
- చ → [ch]
- ఛ → [ch']
- జ → [j]
- ఝ → [jh]
- ట → [t.]
- ఠ → [t.]'
- డ → [d.]
- ఢ → [d.]'
- త → t
- థ → t'
- ద → d
- ధ → d'
- ప → p
- ఫ → p'
- బ → b
- భ → b'
- మ → m
- య → y
- ర → r
- ల → l
- వ → v
- శ → [sh]
- ష → [sh.]
- స → s
- హ → h
- ళ → [l.]
- క్ష → k[sh]

Vowels:
- అ → a
- ఆ → [aa]
- ఇ → i
- ఈ → i:
- ఉ → u
- ఊ → u:
- ఋ → [ru]
- ౠ → [ru:]
- ఎ → [eh]
- ఏ → e:
- ఐ → [ai]
- ఒ → o
- ఓ → o:
- ఔ → [au]

Example: ప్రేమ (prema - love)
Transcription: p[reh]·ma >
Features: Shows consonant cluster, vowel length distinction

Example: తెలుగు (telugu - Telugu language)
Transcription: t[eh]·lu·gu >
Features: Shows dental stop, velar stop, short vowels

#### Kannada
Consonants:
- ಕ → k
- ಖ → k'
- ಗ → g
- ಘ → g'
- ಚ → [ch]
- ಛ → [ch']
- ಜ → [j]
- ಝ → [jh]
- ಟ → [t.]
- ಠ → [t.]'
- ಡ → [d.]
- ಢ → [d.]'
- ತ → t
- ಥ → t'
- ದ → d
- ಧ → d'
- ಪ → p
- ಫ → p'
- ಬ → b
- ಭ → b'
- ಮ → m
- ಯ → y
- ರ → r
- ಲ → l
- ವ → v
- ಶ → [sh]
- ಷ → [sh.]
- ಸ → s
- ಹ → h
- ಳ → [l.]

Vowels:
- ಅ → a
- ಆ → [aa]
- ಇ → i
- ಈ → i:
- ಉ → u
- ಊ → u:
- ಋ → [ru]
- ೠ → [ru:]
- ಎ → [eh]
- ಏ → e:
- ಐ → [ai]
- ಒ → o
- ಓ → o:
- ಔ → [au]

Example: ಪ್ರೀತಿ (prīti - love)
Transcription: p[ri:]·ti >
Features: Shows consonant cluster, long vowel

Example: ಕನ್ನಡ (kannada - Kannada language)
Transcription: kan·na·[d.a] >
Features: Shows gemination, retroflex stop

#### Malayalam
Consonants:
- ക → k
- ഖ → k'
- ഗ → g
- ഘ → g'
- ച → [ch]
- ഛ → [ch']
- ജ → [j]
- ഝ → [jh]
- ട → [t.]
- ഠ → [t.]'
- ഡ → [d.]
- ഢ → [d.]'
- ത → t
- ഥ → t'
- ദ → d
- ധ → d'
- പ → p
- ഫ → p'
- ബ → b
- ഭ → b'
- മ → m
- യ → y
- ര → r
- ല → l
- വ → v
- ശ → [sh]
- ഷ → [sh.]
- സ → s
- ഹ → h
- ള → [l.]
- ഴ → [zh]

Vowels:
- അ → a
- ആ → [aa]
- ഇ → i
- ഈ → i:
- ഉ → u
- ഊ → u:
- ഋ → [ru]
- ൠ → [ru:]
- എ → [eh]
- ഏ → e:
- ഐ → [ai]
- ഒ → o
- ഓ → o:
- ഔ → [au]

Examples:
1. സ്നേഹം (snēhaṁ - love)
   - Transcription: s[neh]·ham >
   - Features: Shows consonant cluster, vowel length, final nasalization

2. മലയാളം (malayāḷaṁ - Malayalam language)
   - Transcription: ma·la·y[aa]·[l.]am >
   - Features: Shows retroflex lateral, long vowel, final nasalization

### Special Features Across Dravidian Languages

#### Retroflex Consonant Series
- All major Dravidian languages distinguish dental and retroflex series
- Retroflex notation uses [.] marker: [t.], [d.], [n.], [l.]
- Example: Tamil நட (naṭa - walk) → na·[t.]a >

#### Gemination
- Distinctive feature across all Dravidian languages
- Marked by doubling in transcription
- Example: Telugu పళ్ళు (paḷḷu - teeth) → pa[l.][l.]u >

#### Vowel Length
- Systematic opposition between short and long vowels
- Marked by [:] in transcription
- Example: Malayalam കാല് (kāl - leg) → k[aa]l >

#### Notes on Implementation
1. Retroflex consonants are consistently marked with [.] across all languages
2. Aspirated consonants (mostly in loanwords) marked with [']
3. Long vowels marked with : or [aa], [ii], etc.
4. Special characters ([zh], [l.], etc.) preserved across languages for consistency
   C.8 Germanic Languages (North)
   Norwegian (Bokmål)
   Consonants:

kj → [ch]
sj → [sh]
rs → [sh]
skj → [sh]
ng → [ng]
rt → [t.]

Vowels:

æ → [ae]
ø → [oe]
å → [ao]
é → e^
ó → o^

Example: kjærlighet (love)
Transcription: [ch][ae]r·li·h[eh]t >
Features: Shows palatal consonant, front vowel, and devoicing
Danish
Consonants:

ng → [ng]
sk → [sg]
rd → [d.]
kj → [ch]
tj → [ch]

Vowels:

æ → [ae]
ø → [oe]
å → [ao]
y → [ue]
ð → [dh]

Example: kærlighed (love)
Transcription: k[ae]r·li·h[eh][dh] >
Features: Shows soft d, front vowel, and consonant weakening
Swedish
Consonants:

ng → [ng]
sj → [sh]
sk → [sh] (before front vowels)
tj → [ch]
rd → [d.]
rt → [t.]

Vowels:

ä → [ae]
ö → [oe]
å → [ao]
y → [ue]

Example: kärlek (love)
Transcription: [ch][ae]r·l[eh]k >
Features: Shows front vowel, consonant cluster, and devoicing
Icelandic
Consonants:

þ → [th]
ð → [dh]
ll → [tl]
rl → [dl]
rn → [dn]
hn → [hn]
hv → [kv]

Vowels:

á → [ao]^
é → [ye]^
í → i^
ó → o^
ú → u^
ý → [ue]^
æ → [ai]
ö → [oe]

Example: ást (love)
Transcription: [ao]^st >
Features: Shows long vowel, consonant cluster, and devoicing
Faroese
Consonants:

ð → [dh]
tj → [ch]
sj → [sh]
hj → [ch]
ll → [dl]
nn → [dn]

Vowels:

á → [ao]^
í → i^
ó → o^
ú → u^
ý → [ue]^
æ → [ae]
ø → [oe]

Example: kærleiki (love)
Transcription: [ch][ae]r·l[ai]·ki >
Features: Shows palatalization, diphthong, and consonant gradation

### C.9 Slavic Languages

#### Russian
Consonants:
- ж → [zh]
- ш → [sh]
- щ → [sh']
- ч → [ch]
- ц → [ts]
- й → j
- х → [qh]
- ь → palatalization marker

Vowels:
- ы → [uh]
- э → [eh]
- ю → [yu]
- я → [ya]
- ё → [yo]

Example: любовь (love)
Transcription: l[yu]·b[ao]v' >
Features: Shows palatalization, vowel reduction, and final soft sign

#### Polish
Consonants:
- cz → [ch]
- sz → [sh]
- ż/rz → [zh]
- dz → [dz]
- dź/dzi → [dj]
- dż → [dzh]
- ć/ci → [tj]
- ś/si → [sj]
- ź/zi → [zj]
- ń/ni → [nj]
- ł → w

Vowels:
- ą → [on]
- ę → [en]
- ó → u
- y → [uh]

Example: miłość (love)
Transcription: m[i]·w[ao][sj][tj] >
Features: Shows nasal vowels, palatalization, and final devoicing

#### Czech
Consonants:
- č → [ch]
- š → [sh]
- ž → [zh]
- ř → [rz]
- ť → [tj]
- ď → [dj]
- ň → [nj]
- ch → [qh]

Vowels:
- á → a^
- é → e^
- í → i^
- ó → o^
- ú/ů → u^
- ý → [uh]^

Example: láska (love)
Transcription: la^s·ka >
Features: Shows long vowels, voicing assimilation, and stress

#### Slovak
Consonants:
- č → [ch]
- š → [sh]
- ž → [zh]
- ť → [tj]
- ď → [dj]
- ň → [nj]
- ľ → [lj]
- dz → [dz]
- dž → [dzh]

Vowels:
- á → a^
- é → e^
- í → i^
- ó → o^
- ú → u^
- ý → [uh]^
- ä → [ae]

Example: láska (love)
Transcription: la^s·ka >
Features: Shows long vowels, palatalization, and rhythmic law

#### Ukrainian
Consonants:
- ж → [zh]
- ш → [sh]
- щ → [sh']
- ч → [ch]
- ц → [ts]
- г → h
- ґ → g
- й → j
- ь → palatalization marker

Vowels:
- и → [uh]
- і → i
- ї → [yi]
- е → [eh]
- є → [ye]
- ю → [yu]
- я → [ya]

Example: любов (love)
Transcription: l[yu]·b[o]v >
Features: Shows palatalization, vowel harmony, and final devoicing

#### Bulgarian
Consonants:
- ж → [zh]
- ш → [sh]
- щ → [sht]
- ч → [ch]
- ц → [ts]
- дж → [dzh]
- й → j
- ь → palatalization marker

Vowels:
- ъ → [uh]
- я → [ya]
- ю → [yu]
- е → [eh]

Example: любов (love)
Transcription: l[yu]·b[o]v >
Features: Shows palatalization and stress pattern

#### Croatian/Serbian/Bosnian
Consonants:
- č/ч → [ch]
- ć/ћ → [tj]
- š/ш → [sh]
- ž/ж → [zh]
- đ/ђ → [dj]
- dž/џ → [dzh]
- nj/њ → [nj]
- lj/љ → [lj]

Vowels:
- a/а → a
- e/е → [eh]
- i/и → i
- o/о → o
- u/у → u
- r/р → syllabic r

Example: ljubav/љубав (love)
Transcription: [lj]u·b[a]v >
Features: Shows palatalization and pitch accent system

#### Slovenian
Consonants:
- č → [ch]
- š → [sh]
- ž → [zh]
- dž → [dzh]

Vowels:
- á → a^
- é → e^
- í → i^
- ó → o^
- ú → u^
- ê → [eh]^
- ô → [ao]^

Example: ljubezen (love)
Transcription: [lj]u·b[eh]·z[eh]n >
Features: Shows vowel reduction and stress patterns

### C.10 Romance Languages

#### French
Consonants:
- ch → [sh]
- j → [zh]
- gn → [nj]
- qu → k
- ç → s
- x → ks
- r → [qh] (uvular)
- ll → j (in some contexts)

Vowels:
- é → e^
- è → [eh]
- ê → [eh]^
- â → [aa]
- ô → o^
- û → u^
- œ → [oe]
- ë → [eh]
- ï → i:
- ù → u
- Nasals:
   - an/am → [an]
   - en/em → [en]
   - in/im → [in]
   - on/om → [on]
   - un/um → [un]

Example: amour (love)
Transcription: a·m[u]r >
Features: Shows uvular r, vowel quality, and final stress

#### Spanish
Consonants:
- ñ → [nj]
- ll → [j]
- ch → [ch]
- j/g(e,i) → [qh]
- z → [th] (Peninsular)
- c(e,i) → [th] (Peninsular)
- rr → [r:]
- b/v → b (between vowels: [b'])

Vowels:
- á → a^
- é → e^
- í → i^
- ó → o^
- ú → u^
- ü → [ue]

Example: amor (love)
Transcription: a·m[o]r >
Features: Shows tap/trill distinction and stress marking

#### Portuguese
Consonants:
- nh → [nj]
- lh → [lj]
- ch → [sh]
- j → [zh]
- ç → s
- x → [sh]/ks
- rr → [qh]
- r → [qh] (initial)/[h]

Vowels:
- á → a^
- â → [ao]^
- ã → [an]
- é → e^
- ê → [eh]^
- í → i^
- ó → o^
- ô → [ao]^
- õ → [on]
- ú → u^
- ü → [ue]

Example: amor (love)
Transcription: a·m[o]r >
Features: Shows nasal vowels, vowel reduction, and stress

#### Italian
Consonants:
- gn → [nj]
- gh → g
- ch → k
- gl(i) → [lj]
- z → [ts]/[dz]
- zz → [ts:]/[dz:]
- sc(i/e) → [sh]

Vowels:
- à → a^
- è → [eh]^
- é → e^
- ì → i^
- í → i^
- ò → [ao]^
- ó → o^
- ù → u^

Example: amore (love)
Transcription: a·m[o]·r[eh] >
Features: Shows gemination, open/closed vowels, and stress

#### Romanian
Consonants:
- ț → [ts]
- ș → [sh]
- č → [ch]
- ğ → [dzh]
- ch → k
- gh → g
- h → h

Vowels:
- ă → [uh]
- â/î → [ih]
- é → e^
- ó → o^
- ú → u^

Example: dragoste (love)
Transcription: dra·g[o]s·t[eh] >
Features: Shows central vowels and consonant clusters

#### Catalan
Consonants:
- ny → [nj]
- ix → [sh]
- tx → [ch]
- tg/tj → [dzh]
- ŀl → [l:]
- ç → s
- x → [sh]

Vowels:
- à → a^
- è → [eh]^
- é → e^
- í → i^
- ï → i:
- ó → o^
- ò → [ao]^
- ú → u^
- ü → [ue]

Example: amor (love)
Transcription: [uh]·m[o]^ >
Features: Shows vowel reduction and stress patterns

#### Occitan
Consonants:
- nh → [nj]
- lh → [lj]
- ch → [ch]
- j → [zh]
- ç → s
- tx → [ch]
- tg → [dzh]

Vowels:
- à → a^
- è → [eh]^
- é → e^
- í → i^
- ï → i:
- ó → o^
- ò → [ao]^
- ú → u^
- ü → [ue]

Example: amor (love)
Transcription: a·m[u]r >
Features: Shows vowel quality and final consonant treatment

#### Sardinian
Consonants:
- th → [th]
- gh → g
- ch → k
- tz → [ts]
- dd → [dh]
- z → [ts]/[dz]

Vowels:
- à → a^
- è → [eh]^
- ì → i^
- ò → [ao]^
- ù → u^

Example: amori (love)
Transcription: a·m[o]·ri >
Features: Shows consonant lenition and vowel system

### C.11 North American Native Languages

#### Navajo (Diné bizaad)
Consonants:
- ' → [']
- ch → [ch]
- ch' → [ch']
- dl → [dl]
- dz → [dz]
- gh → [gh]
- h → h
- hw → [hw]
- k → k
- k' → k'
- kw → [kw]
- ł → [l']
- t → t
- t' → t'
- tł → [tl]
- tł' → [tl']
- ts → [ts]
- ts' → [ts']
- x → [qh]

Vowels:
- a → a
- ą → [an]
- e → [eh]
- ę → [en]
- i → i
- į → [in]
- o → o
- ǫ → [on]

Tones:
- High: á → a^
- Low: à → a_
- Rising: ǎ → a_^
- Falling: â → a^_

Example: ayóó ánóshní (love)
Transcription: a·y[o]^[o]^·[a]^·n[o]^[sh]·n[i]^ >
Features: Shows tone patterns, nasal vowels, and ejective consonants

#### Cherokee (ᏣᎳᎩ)
Consonants:
- d → t
- g → k
- hl → [l']
- hn → [n']
- hw → [hw]
- j → [ch]
- k → k
- qu → [kw]
- s → s
- t → t
- tl → [tl]
- ts → [ts]
- w → w
- y → y

Vowels:
- a → a
- e → [eh]
- i → i
- o → o
- u → u
- v → [uh]

Tones:
- High: á → a^
- Low: a → a_
- Rising: ǎ → a_^
- Falling: â → a^_

Example: ᎬᎨᏳᎯ (love)
Transcription: g[uh]·g[eh]·yu·hi >
Features: Shows complex syllabary, tone system, and vowel qualities

#### Mohawk (Kanien'kéha)
Consonants:
- ' → [']
- h → h
- k → k
- n → n
- r → r
- s → s
- t → t
- ts → [ts]
- w → w
- y → y

Vowels:
- a → a
- e → [eh]
- i → i
- o → o
- ʌ → [uh]
- en → [en]
- on → [on]

Example: konnonhkwa' (love)
Transcription: k[o]n·n[o]n·[hw]a['] >
Features: Shows glottal stops, nasal vowels, and stress patterns

#### Lakota
Consonants:
- č → [ch]
- ǧ → [gh]
- ȟ → [qh]
- k → k
- k' → k'
- kh → [kh]
- l → l
- m → m
- n → n
- p → p
- p' → p'
- ph → [ph]
- s → s
- š → [sh]
- t → t
- t' → t'
- th → [th]
- w → w
- y → y
- z → z
- ž → [zh]

Vowels:
- a → a
- á → a^
- e → [eh]
- é → [eh]^
- i → i
- í → i^
- o → o
- ó → o^
- u → u
- ú → u^
- ų → [un]
- ų́ → [un]^

Example: tečhihila (love)
Transcription: t[eh]·[ch]i·hi·la >
Features: Shows aspirated stops, nasal vowels, and stress patterns

#### Cree
Consonants:
- ch → [ch]
- h → h
- k → k
- m → m
- n → n
- p → p
- s → s
- t → t
- th → [th]
- w → w
- y → y

Vowels:
- a → a
- â → [aa]
- e → [eh]
- ê → [eh]^
- i → i
- î → i^
- o → o
- ô → o^

Example: sâkihitowin (love)
Transcription: s[aa]·ki·hi·to·win >
Features: Shows long vowels and consonant clusters

#### Inuktitut
Consonants:
- g → g
- j → [j]
- k → k
- l → l
- m → m
- n → n
- ng → [ng]
- p → p
- q → q
- r → r
- s → s
- t → t
- v → v
- &apos; → [']

Vowels:
- a → a
- aa → [aa]
- i → i
- ii → i:
- u → u
- uu → u:

Example: nalligijaujuq (love)
Transcription: nal·li·gi·jau·juq >
Features: Shows double consonants, long vowels, and uvular consonants

#### Tlingit
Consonants:
- ch → [ch]
- ch' → [ch']
- dl → [dl]
- dz → [dz]
- g → g
- g̱ → [gh]
- gw → [gw]
- h → h
- j → [j]
- k → k
- k' → k'
- kw → [kw]
- k̲ → q
- ḵw → [qw]
- l → l
- l' → [l']
- s → s
- sh → [sh]
- t → t
- t' → t'
- tl → [tl]
- tl' → [tl']
- ts → [ts]
- ts' → [ts']
- w → w
- x → [qh]
- x̱ → [qh]
- y → y

Vowels:
- a → a
- aa → [aa]
- e → [eh]
- ee → [eh]^
- i → i
- ee → i:
- u → u
- oo → u:

Tones:
- High: á → a^
- Low: à → a_
- Falling: â → a^_

Example: xat yak'éi (love)
Transcription: [qh]at·ya·k'[eh]^i >
Features: Shows ejective consonants, tone system, and uvular consonants

#### Haida
Consonants:
- ' → [']
- d → d
- g → g
- h → h
- hl → [l']
- j → [j]
- k → k
- k' → k'
- kw → [kw]
- l → l
- m → m
- n → n
- p → p
- s → s
- t → t
- t' → t'
- tl → [tl]
- tl' → [tl']
- ts → [ts]
- ts' → [ts']
- w → w
- x → [qh]
- y → y

Vowels:
- a → a
- aa → [aa]
- e → [eh]
- ee → [eh]^
- i → i
- ii → i:
- u → u
- uu → u:

Example: k'waay (love)
Transcription: k'[w][aa]y >
Features: Shows ejective consonants, long vowels, and complex onsets

## Appendix C: Implementation Notes

### C.1 Digital Format
- UTF-8 encoding required
- Line-based format
- Version indicator in header
- Optional metadata headers

### C.2 Input Methods
- Standard keyboard layout
- Modifier key combinations
- Input method editor (IME) support
- Virtual keyboard support

### C.3 Compatibility Guidelines
- IPA conversion support
- Unicode compliance
- Legacy system support
- Cross-platform compatibility
