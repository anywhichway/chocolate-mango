# ChocolateMango

Mango queries are sweet ... Chocolate Mango queries are even sweeter!

ChocolateMango is a powerful extension for PouchDB that adds advanced querying capabilities, data transformation, vector storage, plus live object and trigger functionality.
It seamlessly integrates with PouchDB's existing find API while providing additional features for filtering, transforming, sorting documents, and querying in-memory
data structures.

## Features

- Enhanced querying and filtering with support for complex predicates
- Direct in-memory querying capabilities without PouchDB
- Data transformation pipeline
- Vector storage and similarity search
- Extended path notation support for nested objects
- Compatible with existing PouchDB queries
- Live objects ... insert a Person and get a Person object back with methods, properties and metadata
- Automatic persistence of live objects
- Triggers support *, new, changed, and deleted events with Mango patterns

## Rationale
- PouchDB is a great tool for offline-first applications, but its querying and trigger capabilities are limited
- AI needs options for privacy first, offline first, and edge computing without custom mobile apps, i.e. there needs to be web technology options. 
  - A first step is to provide RAG support for private documents and local chat memory. RAG is best implemented with vectors.
  - Users need the option to move and share the data that may be in the vector store, so building it on top of a database with solid replication support will save lots of effort and increase reliability.

## Installation

```bash
npm install chocolate-mango
```

## Quick Start

### With PouchDB

```javascript
import PouchDB from 'https://cdn.skypack.dev/pouchdb';
import pouchDBFind from 'https://cdn.skypack.dev/pouchdb-find';
import ChocolateMango from 'chocolate-mango';

PouchDB.plugin(pouchDBFind); // you must add this plugin

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

See [Predicates Documentation](./docs/predicates.md)
See [Transforms Documentation](./docs/transforms.md)

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

Note, `query` will return the same type of object it receives, e.g.

```javascript
ChocolateMango.query(5, { $eq: 5 }) // 5 not [5]
```

The methods are also available on your PouchDB instance after you have dipped it.

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

See [Vector Storage Documentation](./docs/vector-storage.md)

## Live Objects & Triggers

### Live Objects

When enabled, ChocolateMango will return live objects from the database. This means that when you retrieve a document, you will get a live object with methods and properties.
When `liveObjects` is enabled, metadata also becomes available on the object in the key ":" (that's right the key is a colon, we would have used _metadata, but _ keys are
reserved for PouchDB). The metadata includes any metadata that was stored with the document as well and the cname of the original object.

If `liveObjects` is set to an object with the property:value `persit:true`, any changes to the object will automatically save it to the database.

```javascript
    import PouchDB from 'https://cdn.skypack.dev/pouchdb';
    import pouchDBFind from 'https://cdn.skypack.dev/pouchdb-find';
    import ChocolateMango from './index.js';
    import HangulEmbeddingEncoder from "./src/hangul-embedding-encoder.js";
    
    window.ChocolateMango = ChocolateMango;
    
    PouchDB.plugin(pouchDBFind);
    
    // Initialize PouchDB with ChocolateMango
    const db = new PouchDB('mydb');
    await ChocolateMango.dip(db,{liveObjects: {persist:"deep"},triggers:true,vectors:true});
    
    db.createTrigger('*', {name : {$exists: true}}, async (event,doc) => {
      console.log(`${event}:`, doc);
    });
    
    // Create class with methods
    class Person {
      constructor(props={}) {
        this._id = props.id || crypto.randomUUID();
        Object.assign(this,props);
      }
    
      sayHello() {
        return `Hello, I'm ${this.name}`;
      }
    }
    
    // Store an instance
    const person = new Person({address:{city:"New York"}});
    person.name = "John";
    await db.put(person,{metadata:{createdBy:"Simon"}});
    
    // Retrieve with prototype
    const retrieved = await db.get(person._id);
    console.log(retrieved.sayHello()); // "Hello, I'm John"
    console.log(retrieved[":"]);
    retrieved.address = {city:"Seattle"};
    setTimeout(async () => {
      const retrieved = await db.get(person._id);
      console.log(JSON.stringify(retrieved));
    }, 1000);
```


## Documentation

- [Predicates Documentation](./docs/predicates.md)
- [Transforms Documentation](./docs/transforms.md)
- [Vector Storage Documentation](./docs/vector-storage.md)

## Release History (Reverse Chronological Order)

Note: the `unicode-name` package has been copied into the `src` directory due to build issues with the package. This will be resolved in a future release.

### Version 0.0.6 (2025-01-19)

- Improved serialization of live objects, now support NaN, Infinity, and -Infinity
- Added unit tests for live objects

### Version 0.0.5 (2024-12-22)

- Improved vector storage and search capabilities.
- Added live objects persistence.

### Version 0.0.4 (2024-12-20)
- added triggers

### Version 0.0.3 (2024-12-20)
- added $drop and live objects

### Version 0.0.2 (2024-12-19)
- Large number of unit tests along with fixes to bugs the exposed

### Version 0.0.1 (2024-12-19)
- Initial documented release

## License

MIT License - see LICENSE file for details