# ChocolateMango

Mango queries are sweet ... Chocolate Mango queries are even sweeter!

ChocolateMango is a powerful extension for PouchDB that adds advanced querying capabilities, data transformation, and vector storage functionality.
It seamlessly integrates with PouchDB's existing find API while providing additional features for filtering, transforming, and sorting documents, and can also be used directly for querying in-memory data structures.

## Features

- Enhanced querying and filtering with support for complex predicates
- Direct in-memory querying capabilities without PouchDB
- Data transformation pipeline
- Vector storage and similarity search
- Extended path notation support for nested objects
- Compatible with existing PouchDB queries

## Installation

```bash
npm install chocolate-mango
```

## Quick Start

### With PouchDB

```javascript
import PouchDB from 'pouchdb';
import ChocolateMango from 'chocolate-mango';

// Initialize PouchDB with ChocolateMango
const db = new PouchDB('mydb');
ChocolateMango.dip(db); // add the sweet cholcolate-mango goodness

// Add some sample documents
await db.bulkDocs([
  {
    _id: '1',
    type: 'user',
    name: 'alice',
    age: 25,
    status: 'active'
  },
  {
    _id: '2',
    type: 'user',
    name: 'bob',
    age: 30,
    status: 'active'
  },
  {
    _id: '3',
    type: 'user',
    name: 'charlie',
    age: 20,
    status: 'inactive'
  }
]);

// Query with transformation and filtering
const result = await db.find({
  selector: {
    type: 'user',
    age: { $gt: 21 }
  },
  transform: {
    name: { $capitalize: { as: 'formattedName' } }
  },
  filter: {
    status: { $eq: 'active' }
  },
  order: [{ age: 'desc' }]
});
```

### Direct In-Memory Querying

You can use ChocolateMango's query capabilities directly on in-memory objects and arrays without PouchDB:

```javascript
import { ChocolateMango } from 'chocolate-mango';

const users = [
  { name: 'alice', age: 25, status: 'active' },
  { name: 'bob', age: 30, status: 'active' },
  { name: 'charlie', age: 20, status: 'inactive' }
];

// Query in-memory array
const result = ChocolateMango.query(users, {
  age: { $gt: 21 },
  status: { $eq: 'active' }
});

// Transform in-memory data
const transformed = ChocolateMango.query(users, {
  name: { $capitalize: { as: 'formattedName' } },
  age: { $multiply: { as: 'ageInMonths', value: 12 } }
});

// Sort in-memory results
const sorted = ChocolateMango.sort(result, [{ path: 'age', direction: 'desc' }]);
```

Note, `query` will return the same type fo object is receives, e.g.

```javascript
ChocolateMango.query(5, { $eq: 5 }) // 5 not [5]
```

## Find API

ChocolateMango extends PouchDB's find API while maintaining full compatibility and adding support for nested objects throughout:

```javascript
db.find({
  selector: {...},    // Standard PouchDB selector or nested object notation
                      // e.g., { 'user.address.city': 'New York' } 
                      // or { user: { address: { city: 'New York' } } }

  transform: {...},   // Transform documents using any of 50+ built-in transform functions
                      // Supports nested paths: { 'user.name': { $capitalize: { as: 'formatted' } } }

  filter: {...},      // Apply any of 40+ additional predicate filters after transformation
                      // Supports nested paths: { 'user.age': { $gt: 21 } }

  order: [...],       // Sort criteria with nested path support
                      // e.g., [{ 'user.age': 'desc' }]
                      // or [{ user: { age: 'desc' } }]

  ...rest            // Standard PouchDB options (limit, skip, etc.)
})
```

## Vector Storage Configuration

Enable vector storage capabilities when initializing ChocolateMango:

```javascript
ChocolateMango.dip(db, { vectors: true });
```

## Documentation

- [Predicates Documentation](./docs/predicates.md)
- [Transforms Documentation](./docs/transforms.md)
- [Vector Storage Documentation](./docs/vector-storage.md)

## Release History (Reverse Chronological Order)

### Version 0.0.1 (2024-12-19)
- Initial documented release

## License

MIT License - see LICENSE file for details