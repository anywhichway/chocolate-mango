# ChocolateMango Vector Storage

ChocolateMango provides vector storage capabilities for similarity search and content retrieval. This document details the vector storage features and their usage.

The embeddings technology is based on phonetic encoding, allowing for similarity calculations across many languages. It is also designed to be smaller
and more efficient than traditional word embeddings in oder to be used in a browser environment. See the [Hangul Phonetic Embeddings for Efficient Language Model Retrieval](./paper.md). 

## Enabling Vector Storage

Enable vector storage when initializing ChocolateMango:

```javascript
import PouchDB from 'pouchdb';
import ChocolateMango from 'chocolate-mango';

const db = new PouchDB('mydb');
ChocolateMango.dip(db, { vectors: true });
```

## Core Functions

### putVectorContent
Stores content with automatically generated embeddings and content hash. Handles deduplication automatically.

```javascript
await db.putVectorContent(content, {
  id: 'optional-custom-id',
  metadata: {
    title: 'Document Title',
    author: 'John Doe',
    tags: ['important', 'reference']
  },
  prefix: 'Optional prefix text',
  prefixTimestamp: true,  // or Date object
  prefixMetadata: true
});
```

Options:
- `id`: Optional custom document ID
- `metadata`: Additional metadata to store with the document
- `prefix`: Text to prepend to content
- `prefixTimestamp`: Add timestamp prefix (boolean or Date object)
- `prefixMetadata`: Include metadata in content prefix (boolean)

### searchVectorContent
Searches for similar content using cosine similarity of term frequency vectors.

```javascript
const results = await db.searchVectorContent(query, {
  limit: 5,
  maxLength: 5000,
  strategy: 'share'
});
```

Parameters:
- `query`: Search text to match against stored content
- `limit`: Maximum number of results (default: 5)
- `maxLength`: Maximum total content length (default: 5000)
- `strategy`: Content truncation strategy ('first', 'last', or 'share')

### Content Truncation Strategies

#### "first" Strategy
Returns documents sorted by match similarity high to low from the beginning until reaching the `maxLength` limit:
```javascript
const results = await db.searchVectorContent("query", {
  maxLength: 1000,
  strategy: "first"
});
```
Example behavior with maxLength of 1000:
```javascript
// Original documents:
// doc1: 400 characters
// doc2: 400 characters
// doc3: 400 characters
// doc4: 400 characters

// Result:
[
  { doc: doc1, similarity: 0.9 },  // 400 chars
  { doc: doc2, similarity: 0.8 },  // 400 chars
  { doc: doc3, similarity: 0.7 }   // 200 chars (truncated)
  // doc4 excluded completely
]
```

#### "share" Strategy (default)
Distributes `maxLength` evenly across all matching documents sorted by date of vector creation:
```javascript
const results = await db.searchVectorContent("query", {
  maxLength: 1000,
  strategy: "share"
});
```
Example behavior with maxLength of 1000:
```javascript
// Original documents:
// doc1: 400 characters
// doc2: 400 characters
// doc3: 400 characters
// doc4: 400 characters

// Result: Each document gets 250 characters (1000/4)
[
  { doc: doc1, similarity: 0.9 },  // 250 chars
  { doc: doc2, similarity: 0.8 },  // 250 chars
  { doc: doc3, similarity: 0.7 },  // 250 chars
  { doc: doc4, similarity: 0.6 }   // 250 chars
]
```

#### "last" Strategy
Returns documents sorted by match similarity low to high from the beginning until reaching the `maxLength` limit:
```javascript
const results = await db.searchVectorContent("query", {
  maxLength: 1000,
  strategy: "last"
});
```
Example behavior with maxLength of 1000:
```javascript
// Original documents:
// doc1: 400 characters
// doc2: 400 characters
// doc3: 400 characters
// doc4: 400 characters

// Result:
[
  { doc: doc4, similarity: 0.6 },  // 200 chars (truncated)
  { doc: doc3, similarity: 0.7 },  // 400 chars
  { doc: doc2, similarity: 0.8 }   // 400 chars
  // doc1 excluded completely
]
```

### Strategy Selection Guidelines

Choose your strategy based on your use case:
- Use "first" when earlier content is more important
- Use "share" (default) when you want to see a sample from all matching documents
- Use "last" when more recent content is more important

Example of strategy selection:

```javascript
// For a chatbot that needs context from recent conversations
const recentContext = await db.searchVectorContent(userQuery, {
  maxLength: 2000,
  strategy: "last",
  limit: 5
});

// For a search feature that needs diverse results
const searchResults = await db.searchVectorContent(searchQuery, {
  maxLength: 5000,
  strategy: "share",
  limit: 10
});

// For historical analysis prioritizing older data
const historicalData = await db.searchVectorContent(analysisQuery, {
  maxLength: 3000,
  strategy: "first",
  limit: 7
});
```

### removeVectorContent
Removes content and associated vectors by matching content hash:

```javascript
await db.removeVectorContent(content);
```

### clearAll
Removes all vector content from the database:

```javascript
await db.clearAll();
```

## Document Structure

Each vector document contains:
```javascript
{
  _id: "unique-identifier",
  RAGcontent: "Original content with optional prefixes",
  metadata: {
    // User-provided metadata
  },
  contentHash: "SHA-256 hash for deduplication",
  embedding: {
    // Term frequency vectors
    word1: frequency1,
    word2: frequency2,
    // ...
  },
  chunks: [
    // Content split into manageable chunks
    "chunk1",
    "chunk2",
    // ...
  ],
  timestamp: 1703001234567
}
```

## Content Processing

### Embeddings
Term frequency vectors are generated automatically based on a phonetic encoding.

```javascript
const embedding = db.createEmbedding(text);
```

The vocabulary size is 11,172 tokens.

You can set the embedding dimensionality when initializing ChocolateMango:

64: Minimum viable size
- Can encode basic Hangul structure (19 initial + 21 medial + 28 final = ~15 bits)
- One CPU word, efficient but limited discrimination

128: Good minimum for production
- Better phonetic discrimination
- Two CPU words, still very efficient

256: Strong balance
- 32 bytes = 8 x 32-bit words
- Great for SIMD operations
- Good separation of similar phonetics

512: Optimal for modern hardware (default)
- Exactly one CPU cache line (64 bytes)
- Perfect for AVX-512 instructions
- Optimal hardware acceleration
- Best discrimination/performance balance

1024: Maximum practical size
- Diminishing returns vs computational cost
- Two cache lines, still efficient but overkill

You can also pass your own encoder that supports `createEmbedding(text)` and `computeSimilarity(embedding1, embedding2)`.

### Content Hashing
SHA-256 hashing is used for deduplication:

```javascript
const hash = await db.generateHash(content);
```

## Examples

### Basic Usage

```javascript
// Store document with metadata
await db.putVectorContent("Document content", {
  metadata: {
    title: "Important Document",
    category: "reference"
  }
});

// Search for similar content
const results = await db.searchVectorContent("search query", {
  limit: 5,
  maxLength: 1000
});

// Process results
results.forEach(({ doc, similarity }) => {
  console.log(`Similarity: ${similarity}`);
  console.log(`Content: ${doc.RAGcontent}`);
  console.log(`Metadata: ${JSON.stringify(doc.metadata)}`);
});
```

### Advanced Usage

```javascript
// Store with timestamp and metadata prefix
await db.putVectorContent(documentContent, {
  id: 'doc-123',
  metadata: {
    author: 'Jane Doe',
    department: 'Engineering',
    version: '1.0'
  },
  prefixTimestamp: true,
  prefixMetadata: true
});

// Search with custom strategy
const results = await db.searchVectorContent(query, {
  limit: 10,
  maxLength: 5000,
  strategy: 'share'
});

// Remove outdated content
await db.removeVectorContent(oldContent);
```

## Limitations

- Uses simple phonetic frequency embeddings, usable across many languages
- Limited to text content
- In-memory similarity calculations
