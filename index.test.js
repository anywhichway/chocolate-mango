import PouchDB from 'pouchdb';
import memoryAdapter from 'pouchdb-adapter-memory';
import PouchDBFind from 'pouchdb-find'; // Import pouchdb-find
import { ChocolateMango } from './index.js';
import predicates from './src/predicates.js';
import transforms from './src/transforms.js';

// Register the memory adapter
PouchDB.plugin(memoryAdapter);
PouchDB.plugin(PouchDBFind);

// Define the User class with base and nested properties
class User {
    constructor(config={}) {
        Object.assign(this,config);
        this.ready = this.init().then(() => this.ready = true)
    }

    greet() {
        return `Hello, my name is ${this.name}!`;
    }

    async init() {
        this.initialized = true;
    }
}



describe('ChocolateMango Serialization, Deserialization, and LiveObjects', () => {

    // Helper function to create a test database with liveObjects enabled
    async function createTestDatabase() {
        let db = new PouchDB('testdb');
        await db.destroy(); // Ensure a clean state
        db = new PouchDB('testdb');
        return ChocolateMango.dip(db, { liveObjects: true });
    }

    describe(`Database Extensions`,() => {
        /* pouchdb.patch = async function(docId, patches,createIfMissing = false) {
                docId = await docId;
                const doc = await this.get(docId).catch((e) => createIfMissing ? {_id:docId} : throw e);
                const patchedDoc = await patch(doc,patches);
                return await this.put(patchedDoc);
            } */
        // basic test
        test(`PouchDB patch`,async () => {
            const db = await createTestDatabase();
            const docId = 'testDoc';
            const patches = { name: 'John Doe', age: 30 };

            // Create a document
            await db.put({ _id: docId, name: 'Jane Doe', age: 25 });

            // Patch the document
            await db.patch(docId, patches);

            // Retrieve the patched document
            const patchedDoc = await db.get(docId);

            expect(patchedDoc.name).toBe(patches.name);
            expect(patchedDoc.age).toBe(patches.age);
        })
        // test with promise for docId, promised patches, and promised values in patches
        test(`PouchDB patch with promises`,async () => {
            const db = await createTestDatabase();
            const docIdPromise = Promise.resolve('testDoc');
            const patchesPromise = Promise.resolve({ name: 'John Doe', age: Promise.resolve(30) });

            // Create a document
            await db.put({ _id: 'testDoc', name: 'Jane Doe', age: 25 });

            // Patch the document
            await db.patch(docIdPromise, patchesPromise);

            // Retrieve the patched document
            const patchedDoc = await db.get('testDoc');

            expect(patchedDoc.name).toBe('John Doe');
            expect(patchedDoc.age).toBe(30);
        });
        /*
        pouchdb.upsert = async function(doc,mutate) {
            const target = await this.get(doc._id).catch(() => ({}));
            return this.patch(target, patch,true);
        }
         */
        // basic test
        test(`PouchDB upsert`,async () => {
            const db = await createTestDatabase();
            const doc = { _id: 'testDoc', name: 'John Doe', age: 30 };

            // Upsert the document
            await db.upsert(doc);

            // Retrieve the upserted document
            const upsertedDoc = await db.get('testDoc');

            expect(upsertedDoc.name).toBe(doc.name);
            expect(upsertedDoc.age).toBe(30);
        })
        // test with missing document
        test(`PouchDB upsert with missing document`,async () => {
            const db = await createTestDatabase();
            const doc = { _id: 'newDoc', name: 'Jane Doe', age: 25 };

            // Upsert the document
            await db.upsert(doc);

            // Retrieve the upserted document
            const upsertedDoc = await db.get('newDoc');

            expect(upsertedDoc.name).toBe(doc.name);
            expect(upsertedDoc.age).toBe(25);
        })
        // test with no _id provided
        test(`PouchDB upsert with no _id`,async () => {
            const db = await createTestDatabase();
            const doc = { name: 'No ID' };

            // Attempt to upsert the document without an _id
            await db.upsert(doc,{mutate:true});

            const upsertedDoc = await db.get(doc._id).catch(() => null);

            expect(upsertedDoc._id).toBeDefined()
            // check that d
        })

        test('PouchSB replace when not exists',async () => {
            const db = await createTestDatabase();
            const doc = { name: 'No ID' };

            await db.replace(doc);

            const newDoc = await db.get(doc._id).catch(() => null);

            expect(newDoc._id).toBeDefined()
        })

        test('PouchSB replace when exists',async () => {
            const db = await createTestDatabase();
            const doc = { name: 'No ID' };

            await db.post(doc);

            const newDoc = await db.get(doc._id).catch(() => null);

            const rev = newDoc._rev;

            newDoc.name = 'Has ID';

            await db.replace(newDoc);

            const replacedDoc = await db.get(newDoc._id).catch(() => null);

            const replacedRev= replacedDoc._rev;

            expect(rev).not.toEqual(replacedRev);

            let error;
            try {
                await db.get(newDoc._id,{rev})
            } catch(e) {
                error = e;
            }
            expect(error).toBeDefined();
        })
    })

    // Test serialization and deserialization
    describe('Serialization and Deserialization', () => {
        test('toSerializable should handle basic types', async () => {
            const data = {
                string: 'test',
                number: 42,
                boolean: true,
                null: null,
                undefined: undefined,
                array: [1, 2, 3],
                object: { key: 'value' }
            };

            const serialized = await ChocolateMango.toSerializable(data);
            expect(serialized).toEqual({
                string: 'test',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
                object: { key: 'value' }
            });
        });

        test('toSerializable should handle special cases (NaN, Infinity)', async () => {
            const data = {
                nan: NaN,
                infinity: Infinity,
                negativeInfinity: -Infinity
            };

            const serialized = await ChocolateMango.toSerializable(data);
            expect(serialized).toEqual({
                nan: '#NaN',
                infinity: '#Infinity',
                negativeInfinity: '-#Infinity'
            });
        });

        test('deserialize should restore special cases (NaN, Infinity)', () => {
            const data = {
                nan: '#NaN',
                infinity: '#Infinity',
                negativeInfinity: '-#Infinity'
            };

            const deserialized = ChocolateMango.deserialize(data);
            expect(deserialized).toEqual({
                nan: NaN,
                infinity: Infinity,
                negativeInfinity: -Infinity
            });
        });

        test('toSerializable should handle nested objects and arrays', async () => {
            const data = {
                nestedObject: { key: 'value', nested: { num: 42 } },
                nestedArray: [1, [2, 3], { key: 'value' }]
            };

            const serialized = await ChocolateMango.toSerializable(data);
            expect(serialized).toEqual({
                nestedObject: { key: 'value', nested: { num: 42 } },
                nestedArray: [1, [2, 3], { key: 'value' }]
            });
        });

        test('deserialize should restore nested objects and arrays', async () => {
            const data = {
                nestedObject: { key: 'value', nested: { num: 42 } },
                nestedArray: [1, [2, 3], { key: 'value' }]
            };

            const serialized = await ChocolateMango.toSerializable(data);
            const deserialized = ChocolateMango.deserialize(serialized);
            expect(deserialized).toEqual(data);
        });
    });

    // Test liveObjects functionality
    describe('LiveObjects with User Class', () => {
        let db;

        beforeAll(async () => {
            db = await createTestDatabase();
        });

        test('should store and retrieve a User instance with _id', async () => {
            const user = new User({
                name: 'John Doe',
                age: 30,
                address: { city: 'New York', zip: '10001' },
                preferences: ['reading', 'traveling'],
                createdAt: new Date(),
                _id: "user1"
            });

            // Store the user with a custom _id
            const result = await db.put(user);
            expect(result.ok).toBe(true);

            // Retrieve the user and verify it's an instance of User
            const retrievedUser = await db.get('user1');
            expect(retrievedUser).toBeInstanceOf(User);
            expect(retrievedUser.name).toBe('John Doe');
            expect(retrievedUser.age).toBe(30);
            expect(retrievedUser.address.city).toBe('New York');
            expect(retrievedUser.preferences).toEqual(['reading', 'traveling']);
            expect(retrievedUser.greet()).toBe('Hello, my name is John Doe!');
            await retrievedUser.ready;
            expect(retrievedUser.initialized).toBe(true);
        });

        test('should store and retrieve a User instance without _id', async () => {
            const user = new User({
                name: 'Jane Doe',
                age: 25,
                address: { city: 'Los Angeles', zip: '90001' },
                preferences: ['hiking', 'photography'],
                createdAt: new Date()
            });

            // Store the user without a custom _id
            const result = await db.put(user);
            expect(result.ok).toBe(true);

            // Retrieve the user using the generated _id
            const retrievedUser = await db.get(result.id);
            expect(retrievedUser).toBeInstanceOf(User);
            expect(retrievedUser.name).toBe('Jane Doe');
            expect(retrievedUser.age).toBe(25);
            expect(retrievedUser.address.city).toBe('Los Angeles');
            expect(retrievedUser.preferences).toEqual(['hiking', 'photography']);
            expect(retrievedUser.greet()).toBe('Hello, my name is Jane Doe!');
        });

        test('should update nested properties of a User instance', async () => {
            const user = new User({
                name: 'Alice',
                age: 28,
                address: { city: 'San Francisco', zip: '94105' },
                preferences: ['coding', 'music'],
                createdAt: new Date(),
                _id: "user2"
            });

            // Store the user
            const result = await db.put(user);
            expect(result.ok).toBe(true);
            console.log(user);
            // Retrieve and update the user
            const retrievedUser = await db.get('user2');
            retrievedUser.address.city = 'Seattle';
            retrievedUser.preferences.push('gaming');
            console.log(retrievedUser);

            // Save the updated user
            const updateResult = await db.put(retrievedUser);
            expect(updateResult.ok).toBe(true);

            // Verify the updates
            const updatedUser = await db.get('user2');
            expect(updatedUser.address.city).toBe('Seattle');
            expect(updatedUser.preferences).toEqual(['coding', 'music', 'gaming']);
        });

        test('should handle nested objects and arrays in User class', async () => {
            const user = new User({
                name: 'Bob',
                age: 35,
                address: { city: 'Chicago', zip: '60601' },
                preferences: ['sports', 'cooking'],
                createdAt: new Date(),
                _id: 'user3'
            });

            // Store the user
            const result = await db.put(user);
            expect(result.ok).toBe(true);

            // Retrieve and verify nested properties
            const retrievedUser = await db.get('user3');
            expect(retrievedUser.address.city).toBe('Chicago');
        });
    });
});

describe('ChocolateMango Predicates & Transforms', () => {

    const db = ChocolateMango.dip({}, { transforms, predicates });
    // Helper function to run queries
    const runQuery = (data, pattern) => db.query(data, pattern);

    // Array Predicates
    describe('Array Predicates', () => {
        test('$all matches arrays containing all specified elements', () => {
            const data = [1, 2, 3, 4, 5];
            expect(runQuery(data, { $all: [1, 2, 3] })).toEqual(data);
            expect(runQuery(data, { $all: [1, 6] })).toBeUndefined();
            expect(runQuery('not-an-array', { $all: {} })).toBeUndefined();
        });

        test('$disjoint matches arrays with no common elements', () => {
            const data = [1, 2, 3];
            expect(runQuery(data, { $disjoint: [4, 5, 6] })).toEqual(data);
            expect(runQuery(data, { $disjoint: [3, 4, 5] })).toBeUndefined();
            expect(runQuery('not-an-array', { $disjoint: [1] })).toBeUndefined();
        });

        test('$elemMatch matches arrays with elements meeting criteria', () => {
            const data = [{ x: 1 }, { x: 2 }, { x: 3 }];
            expect(runQuery(data, { $elemMatch: { x: { $gt: 2 } } })).toEqual(data);
            expect(runQuery(data, { $elemMatch: { x: { $gt: 5 } } })).toBeUndefined();
            expect(runQuery('not-an-array', { $elemMatch: { x: 1 } })).toBeUndefined();
        });

        test('$excludes matches arrays not containing specified elements', () => {
            const data = [1, 2, 3];
            expect(runQuery(data, { $excludes: [4, 5] })).toEqual(data);
            expect(runQuery(data, { $excludes: [2, 4] })).toBeUndefined();
            expect(runQuery('not-an-array', { $excludes: [1] })).toBeUndefined();
        });

        test('$includes matches arrays containing specified elements', () => {
            const data = [1, 2, 3, 4, 5];
            expect(runQuery(data, { $includes: [1, 2] })).toEqual(data);
            expect(runQuery(data, { $includes: [1, 6] })).toBeUndefined();
            expect(runQuery('not-an-array', { $includes: [1] })).toBeUndefined();
        });

        test('$length matches arrays of specified length', () => {
            const data = [1, 2, 3];
            expect(runQuery(data, { $length: 3 })).toEqual(data);
            expect(runQuery(data, { $length: 4 })).toBeUndefined();
            expect(runQuery('123', { $length: 3 })).toEqual('123');
            expect(runQuery(42, { $length: 2 })).toBeUndefined();
        });

        test('$size matches arrays of specified size', () => {
            const data = [1, 2, 3];
            expect(runQuery(data, { $size: 3 })).toEqual(data);
            expect(runQuery(data, { $size: 4 })).toBeUndefined();
            expect(runQuery('not-an-array', { $size: 3 })).toBeUndefined();
        });
    });

    // Comparison Predicates
    describe('Comparison Predicates', () => {
        test('$eq matches equal values', () => {
            expect(runQuery(5, { $eq: 5 })).toBe(5);
            expect(runQuery('test', { $eq: 'test' })).toBe('test');
            expect(runQuery(5, { $eq: 6 })).toBeUndefined();
        });

        test('$gt matches values greater than specified', () => {
            expect(runQuery(5, { $gt: 3 })).toBe(5);
            expect(runQuery(5, { $gt: 5 })).toBeUndefined();
            expect(runQuery(5, { $gt: 7 })).toBeUndefined();
        });

        test('$gte matches values greater than or equal to specified', () => {
            expect(runQuery(5, { $gte: 3 })).toBe(5);
            expect(runQuery(5, { $gte: 5 })).toBe(5);
            expect(runQuery(5, { $gte: 7 })).toBeUndefined();
        });

        test('$in matches values in specified array', () => {
            expect(runQuery(5, { $in: [3, 5, 7] })).toBe(5);
            expect(runQuery('test', { $in: ['test', 'other'] })).toBe('test');
            expect(runQuery(5, { $in: [3, 4, 6] })).toBeUndefined();
        });

        test('$lt matches values less than specified', () => {
            expect(runQuery(3, { $lt: 5 })).toBe(3);
            expect(runQuery(5, { $lt: 5 })).toBeUndefined();
            expect(runQuery(7, { $lt: 5 })).toBeUndefined();
        });

        test('$lte matches values less than or equal to specified', () => {
            expect(runQuery(3, { $lte: 5 })).toBe(3);
            expect(runQuery(5, { $lte: 5 })).toBe(5);
            expect(runQuery(7, { $lte: 5 })).toBeUndefined();
        });

        test('$ne matches values not equal to specified', () => {
            expect(runQuery(5, { $ne: 3 })).toBe(5);
            expect(runQuery('test', { $ne: 'other' })).toBe('test');
            expect(runQuery(5, { $ne: 5 })).toBeUndefined();
        });

        test('$nin matches values not in specified array', () => {
            expect(runQuery(5, { $nin: [3, 4, 6] })).toBe(5);
            expect(runQuery('test', { $nin: ['other', 'values'] })).toBe('test');
            expect(runQuery(5, { $nin: [3, 5, 7] })).toBeUndefined();
        });
    });

    // Logic Predicates
    describe('Logic Predicates', () => {
        test('$and matches when all conditions are true', () => {
            const data = { x: 5, y: 'test' };
            expect(runQuery(data, { $and: [{ x: { $gt: 3 } }, { y: 'test' }] })).toEqual(data);
            expect(runQuery(data, { $and: [{ x: { $gt: 7 } }, { y: 'test' }] })).toBeUndefined();
        });

        test('$nor matches when no conditions are true', () => {
            const data = { x: 5, y: 'test' };
            expect(runQuery(data, { $nor: [{ x: { $gt: 7 } }, { y: 'other' }] })).toEqual(data);
            expect(runQuery(data, { $nor: [{ x: { $gt: 3 } }, { y: 'other' }] })).toBeUndefined();
        });

        test('$not matches when condition is false', () => {
            const data = { x: 5 };
            expect(runQuery(data, { x: { $not: { $gt: 7 } } })).toEqual(data);
            expect(runQuery(data, { x: { $not: { $gt: 3 } } })).toBeUndefined();
        });

        test('$or matches when any condition is true', () => {
            const data = { x: 5, y: 'test' };
            expect(runQuery(data, { $or: [{ x: { $gt: 7 } }, { y: 'test' }] })).toEqual(data);
            expect(runQuery(data, { $or: [{ x: { $gt: 7 } }, { y: 'other' }] })).toBeUndefined();
        });
    });

    // Number Predicates
    describe('Number Predicates', () => {
        test('$inRange matches numbers within specified range', () => {
            expect(runQuery(5, { $inRange: [3, 7, true] })).toBe(5);
            expect(runQuery(5, { $inRange: [5, 7, true] })).toBe(5);
            expect(runQuery(5, { $inRange: [5, 7, false] })).toBeUndefined();
            expect(runQuery(8, { $inRange: [3, 7, true] })).toBeUndefined();
        });

        test('$isEven matches even numbers', () => {
            expect(runQuery(4, { $isEven: true })).toBe(4);
            expect(runQuery(5, { $isEven: true })).toBeUndefined();
            expect(runQuery('not-a-number', { $isEven: true })).toBeUndefined();
        });

        test('$isFloat matches floating point numbers', () => {
            expect(runQuery(4.5, { $isFloat: true })).toBe(4.5);
            expect(runQuery(4, { $isFloat: true })).toBeUndefined();
            expect(runQuery('not-a-number', { $isFloat: true })).toBeUndefined();
        });

        test('$isInteger matches integer numbers', () => {
            expect(runQuery(4, { $isInteger: true })).toBe(4);
            expect(runQuery(4.5, { $isInteger: true })).toBeUndefined();
            expect(runQuery('not-a-number', { $isInteger: true })).toBeUndefined();
        });

        test('$isOdd matches odd numbers', () => {
            expect(runQuery(5, { $isOdd: true })).toBe(5);
            expect(runQuery(4, { $isOdd: true })).toBeUndefined();
            expect(runQuery('not-a-number', { $isOdd: true })).toBeUndefined();
        });

        test('$isPrime matches prime numbers', () => {
            expect(runQuery(5, { $isPrime: true })).toBe(5);
            expect(runQuery(4, { $isPrime: true })).toBeUndefined();
            expect(runQuery('not-a-number', { $isPrime: true })).toBeUndefined();
        });

        test('$mod matches numbers with specified modulo', () => {
            expect(runQuery(10, { $mod: [3, 1] })).toBe(10);
            expect(runQuery(9, { $mod: [3, 1] })).toBeUndefined();
            expect(runQuery('not-a-number', { $mod: [3, 1] })).toBeUndefined();
        });
    });

    // String Predicates
    describe('String Predicates', () => {
        test('$contains matches strings containing substring', () => {
            expect(runQuery('test string', { $contains: 'test' })).toBe('test string');
            expect(runQuery('test string', { $contains: 'other' })).toBeUndefined();
            expect(runQuery(42, { $contains: 'test' })).toBeUndefined();
        });

        test('$echoes matches strings with same soundex', () => {
            expect(runQuery('Smith', { $echoes: 'Smythe' })).toBe('Smith');
            expect(runQuery('Smith', { $echoes: 'Jones' })).toBeUndefined();
            expect(runQuery(42, { $echoes: 'Smith' })).toBeUndefined();
        });

        test('$endsWith matches strings ending with substring', () => {
            expect(runQuery('test string', { $endsWith: 'string' })).toBe('test string');
            expect(runQuery('test string', { $endsWith: 'test' })).toBeUndefined();
            expect(runQuery(42, { $endsWith: 'string' })).toBeUndefined();
        });

        test('$startsWith matches strings starting with substring', () => {
            expect(runQuery('test string', { $startsWith: 'test' })).toBe('test string');
            expect(runQuery('test string', { $startsWith: 'string' })).toBeUndefined();
            expect(runQuery(42, { $startsWith: 'test' })).toBeUndefined();
        });
    });

    // Type Predicates
    describe('Type Predicates', () => {
        test('$exists matches non-null values', () => {
            expect(runQuery(5, { $exists: true })).toBe(5);
            expect(runQuery('test', { $exists: true })).toBe('test');
            expect(runQuery(null, { $exists: true })).toBeUndefined();
            expect(runQuery(undefined, { $exists: true })).toBeUndefined();
        });

        test('$instanceof matches objects of specified class', () => {
            class TestClass {}
            const instance = new TestClass();
            expect(runQuery(instance, { $instanceof: TestClass })).toBe(instance);
            expect(runQuery(instance, { $instanceof: 'TestClass' })).toBe(instance);
            expect(runQuery({}, { $instanceof: TestClass })).toBeUndefined();
        });

        test('$isDate matches valid dates', () => {
            expect(runQuery('2023-01-01', { $isDate: true })).toBe('2023-01-01');
            expect(runQuery('invalid-date', { $isDate: true })).toBeUndefined();
            expect(runQuery(42, { $isDate: true })).toBeUndefined();
        });

        test('$isJSON matches things parseable as JSON', () => {
            expect(runQuery('{"test": true}', { $isJSON: true })).toBe('{"test": true}');
            expect(runQuery(42, { $isJSON: true })).toBe(42);
            expect(runQuery('invalid-json', { $isJSON: true })).toBeUndefined();
            expect(runQuery(undefined, { $isJSON: true })).toBeUndefined();
        });

        test('$isTime matches valid time strings', () => {
            expect(runQuery('12:30', { $isTime: true })).toBe('12:30');
            expect(runQuery('12:30:45', { $isTime: true })).toBe('12:30:45');
            expect(runQuery('invalid-time', { $isTime: true })).toBeUndefined();
            expect(runQuery(42, { $isTime: true })).toBeUndefined();
        });

        test('$isAlpha matches strings containing only letters', () => {
            expect(runQuery('test', { $isAlpha: true })).toBe('test');
            expect(runQuery('test123', { $isAlpha: true })).toBeUndefined();
            expect(runQuery('test space', { $isAlpha: true })).toBeUndefined();
            expect(runQuery(42, { $isAlpha: true })).toBeUndefined();
        });

        test('$isAlphaNum matches strings or numbers containing only letters and numbers', () => {
            expect(runQuery('test123', { $isAlphaNum: true })).toBe('test123');
            expect(runQuery(42, { $isAlphaNum: true })).toBe(42);
            expect(runQuery('test space', { $isAlphaNum: true })).toBeUndefined();
            expect(runQuery('test@123', { $isAlphaNum: true })).toBeUndefined();
            expect(runQuery(null, { $isAlphaNum: true })).toBeUndefined();
        });

        test('$isBase64 matches valid base64 strings', () => {
            expect(runQuery('SGVsbG8gV29ybGQ=', { $isBase64: true })).toBe('SGVsbG8gV29ybGQ=');
            expect(runQuery('not-base64!', { $isBase64: true })).toBeUndefined();
            expect(runQuery(42, { $isBase64: true })).toBeUndefined();
        });

        test('$isEmail matches valid email addresses', () => {
            expect(runQuery('test@example.com', { $isEmail: true })).toBe('test@example.com');
            expect(runQuery('invalid-email', { $isEmail: true })).toBeUndefined();
            expect(runQuery('test@', { $isEmail: true })).toBeUndefined();
            expect(runQuery(42, { $isEmail: true })).toBeUndefined();
        });

        test('$isHex matches valid hexadecimal strings', () => {
            expect(runQuery('1a2b3c', { $isHex: true })).toBe('1a2b3c');
            expect(runQuery('DEADBEEF', { $isHex: true })).toBe('DEADBEEF');
            expect(runQuery('not-hex!', { $isHex: true })).toBeUndefined();
            expect(runQuery(42, { $isHex: true })).toBeUndefined();
        });

        test('$isIP4 matches valid IPv4 addresses', () => {
            expect(runQuery('192.168.1.1', { $isIP4: true })).toBe('192.168.1.1');
            expect(runQuery('256.1.2.3', { $isIP4: true })).toBeUndefined();
            expect(runQuery('1.2.3', { $isIP4: true })).toBeUndefined();
            expect(runQuery(42, { $isIP4: true })).toBeUndefined();
        });

        test('$isIP6 matches valid IPv6 addresses', () => {
            expect(runQuery('2001:0db8:85a3:0000:0000:8a2e:0370:7334', { $isIP6: true })).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
            expect(runQuery('2001:0db8:85a3', { $isIP6: true })).toBeUndefined();
            expect(runQuery('not-ipv6', { $isIP6: true })).toBeUndefined();
            expect(runQuery(42, { $isIP6: true })).toBeUndefined();
        });

        test('$isNumeric matches strings containing only numbers or numbers', () => {
            expect(runQuery('12345', { $isNumeric: true })).toBe('12345');
            expect(runQuery(42, { $isNumeric: true })).toBe(42);
            expect(runQuery('123.45', { $isNumeric: true })).toBeUndefined();
            expect(runQuery('12a34', { $isNumeric: true })).toBeUndefined();
            expect(runQuery(null, { $isNumeric: true })).toBeUndefined();
        });

        test('$isSSN matches valid US Social Security Numbers', () => {
            expect(runQuery('123-45-6789', { $isSSN: true })).toBe('123-45-6789');
            expect(runQuery('123456789', { $isSSN: true })).toBeUndefined();
            expect(runQuery('123-45-678', { $isSSN: true })).toBeUndefined();
            expect(runQuery(42, { $isSSN: true })).toBeUndefined();
        });

        test('$isUSTel matches valid US telephone numbers', () => {
            expect(runQuery('123-456-7890', { $isUSTel: true })).toBe('123-456-7890');
            expect(runQuery('1234567890', { $isUSTel: true })).toBeUndefined();
            expect(runQuery('123-456-789', { $isUSTel: true })).toBeUndefined();
            expect(runQuery(42, { $isUSTel: true })).toBeUndefined();
        });

        test('$isURL matches valid URLs', () => {
            expect(runQuery('https://example.com', { $isURL: true })).toBe('https://example.com');
            expect(runQuery('http://test.com/path', { $isURL: true })).toBe('http://test.com/path');
            expect(runQuery('not-a-url', { $isURL: true })).toBeUndefined();
            expect(runQuery(42, { $isURL: true })).toBeUndefined();
        });

        test('$isUUID matches valid UUIDs', () => {
            expect(runQuery('550e8400-e29b-41d4-a716-446655440000', { $isUUID: true })).toBe('550e8400-e29b-41d4-a716-446655440000');
            expect(runQuery('not-a-uuid', { $isUUID: true })).toBeUndefined();
            expect(runQuery('550e8400-e29b-41d4-a716', { $isUUID: true })).toBeUndefined();
            expect(runQuery(42, { $isUUID: true })).toBeUndefined();
        });

        test('$regex matches strings that match the regular expression', () => {
            expect(runQuery('test123', { $regex: /^test\d+$/ })).toBe('test123');
            expect(runQuery('invalid', { $regex: /^test\d+$/ })).toBeUndefined();
            expect(runQuery(42, { $regex: /^test\d+$/ })).toBeUndefined();
        });
    });

    // Additional Array Predicates
    describe('Additional Array Predicates', () => {
        test('$superset matches arrays that contain all elements from another array', () => {
            expect(runQuery([1, 2, 3, 4], { $superset: [2, 3] })).toEqual([1, 2, 3, 4]);
            expect(runQuery([1, 2], { $superset: [2, 3] })).toBeUndefined();
            expect(runQuery('not-an-array', { $superset: [1] })).toBeUndefined();
        });

        test('$disjoint matches arrays with no common elements', () => {
            expect(runQuery([1, 2, 3], { $disjoint: [4, 5, 6] })).toEqual([1, 2, 3]);
            expect(runQuery([1, 2, 3], { $disjoint: [3, 4, 5] })).toBeUndefined();
            expect(runQuery('not-an-array', { $disjoint: [1] })).toBeUndefined();
        });

        test('$intersects matches arrays with at least one common element', () => {
            expect(runQuery([1, 2, 3], { $intersects: [3, 4, 5] })).toEqual([1, 2, 3]);
            expect(runQuery([1, 2, 3], { $intersects: [4, 5, 6] })).toBeUndefined();
            expect(runQuery('not-an-array', { $intersects: [1] })).toBeUndefined();
        });

        test('$excludes matches arrays that exclude all elements from another array', () => {
            expect(runQuery([1, 2, 3], { $excludes: [4, 5] })).toEqual([1, 2, 3]);
            expect(runQuery([1, 2, 3], { $excludes: [3, 4] })).toBeUndefined();
            expect(runQuery('not-an-array', { $excludes: [1] })).toBeUndefined();
        });
    });

    // Additional Math Predicates
    describe('Additional Math Predicates', () => {
        test('$isNaN matches NaN values', () => {
            expect(runQuery(NaN, { $isNaN: true })).toBe(NaN);
            expect(runQuery(42, { $isNaN: true })).toBeUndefined();
            expect(runQuery('not-a-number', { $isNaN: true })).toBeUndefined();
        });
    });

    // Additional Type Predicates
    describe('Additional Type Predicates', () => {
        test('$kindof matches values of specified type or instance', () => {
            class TestClass {}
            const instance = new TestClass();

            expect(runQuery(42, { $kindof: 'number' })).toBe(42);
            expect(runQuery('test', { $kindof: 'string' })).toBe('test');
            expect(runQuery(instance, { $kindof: TestClass })).toBe(instance);
            expect(runQuery(instance, { $kindof: 'TestClass' })).toBe(instance);
            expect(runQuery(42, { $kindof: 'string' })).toBeUndefined();
            expect(runQuery({}, { $kindof: TestClass })).toBeUndefined();
        });
    });

    // Utility Predicates
    describe('Utility Predicates', () => {
        test('$isAfter matches dates after specified date', () => {
            const date1 = new Date('2023-01-01');
            const date2 = new Date('2022-01-01');
            expect(runQuery(date1, { $isAfter: date2 })).toBe(date1);
            expect(runQuery('2023-01-01', { $isAfter: '2022-01-01' })).toBe('2023-01-01');
            expect(runQuery(date2, { $isAfter: date1 })).toBeUndefined();
            expect(runQuery('invalid-date', { $isAfter: date1 })).toBeUndefined();
        });

        test('$isBefore matches dates before specified date', () => {
            const date1 = new Date('2022-01-01');
            const date2 = new Date('2023-01-01');
            expect(runQuery(date1, { $isBefore: date2 })).toBe(date1);
            expect(runQuery('2022-01-01', { $isBefore: '2023-01-01' })).toBe('2022-01-01');
            expect(runQuery(date2, { $isBefore: date1 })).toBeUndefined();
            expect(runQuery('invalid-date', { $isBefore: date1 })).toBeUndefined();
        });

        test('$isBetween matches dates between specified dates', () => {
            const start = new Date('2022-01-01');
            const middle = new Date('2022-06-01');
            const end = new Date('2023-01-01');
            expect(runQuery(middle, { $isBetween: [start, end, true] })).toBe(middle);
            expect(runQuery(start, { $isBetween: [start, end, true] })).toBe(start);
            expect(runQuery(start, { $isBetween: [start, end, false] })).toBeUndefined();
            expect(runQuery('invalid-date', { $isBetween: [start, end] })).toBeUndefined();
        });

        test('$test matches values that pass custom test function', () => {
            const isEvenNumber = x => typeof x === 'number' && x % 2 === 0;
            expect(runQuery(4, { $test: isEvenNumber })).toBe(4);
            expect(runQuery(5, { $test: isEvenNumber })).toBeUndefined();
            expect(runQuery('not-a-number', { $test: isEvenNumber })).toBeUndefined();
        });
    });

    describe('ChocolateMango Transforms', () => {
        // Helper function to run queries with transforms
        const runTransform = (data, pattern) => db.query(data, pattern);

        describe('Utility Transforms', () => {
            test('$drop removes a property', () => {
                expect(runTransform({name:"joe",age:20}, { name: { $drop: true } })).toEqual({age:20});
                expect(runTransform({name:"joe",age:20}, { name: { $drop: false } })).toEqual({name:"joe",age:20});
                expect(runTransform({name:"joe",age:20}, { name: { $drop: (name,{object}) => object.age<21 } })).toEqual({age:20});
                expect(runTransform({name:"joe",age:20},{name: {$drop: ()=>false}})).toEqual({name:"joe",age:20});
            });
            test('$call executes function on value', () => {
                const double = x => x * 2;
                expect(runTransform(5, { $call: { f: double } })).toBe(10);
                expect(runTransform('test', { $call: { f: x => x.toUpperCase() } })).toBe('TEST');
            });

            test('$classname returns constructor name', () => {
                expect(runTransform(new Date(), { $classname: {} })).toBe('Date');
                expect(runTransform([], { $classname: {} })).toBe('Array');
                expect(runTransform({}, { $classname: {} })).toBe('Object');
            });

            test('$default provides default value', () => {
                expect(runTransform(null, { $default: { value: 'default' } })).toBe('default');
                expect(runTransform(undefined, { $default: { value: 42 } })).toBe(42);
                expect(runTransform('value', { $default: { value: 'default' } })).toBe('value');
            });

            test('$define creates property descriptor', () => {
                const obj = {};
                const result = runTransform('test', {
                    $define: { enumerable: true, writable: false, value: 'fixed' }
                });
                result(obj, 'prop');
                expect(Object.getOwnPropertyDescriptor(obj, 'prop')).toEqual({
                    enumerable: true,
                    writable: false,
                    configurable: false,
                    value: 'fixed'
                });
            });

            test('$entries returns object entries', () => {
                const obj = { a: 1, b: 2 };
                expect(runTransform(obj, { $entries: {} })).toEqual([['a', 1], ['b', 2]]);
            });

            test('$keys returns object keys', () => {
                const obj = { a: 1, b: 2 };
                expect(runTransform(obj, { $keys: {} })).toEqual(['a', 'b']);
            });

            test('$values returns object values', () => {
                const obj = { a: 1, b: 2 };
                expect(runTransform(obj, { $values: {} })).toEqual([1, 2]);
            });

            test('$parse parses JSON string', () => {
                expect(runTransform('{"a":1}', { $parse: {} })).toEqual({ a: 1 });
                expect(runTransform('invalid', { $parse: {} })).toBeUndefined();
            });

            test('$stringify converts to JSON string', () => {
                const obj = { a: 1 };
                expect(runTransform(obj, { $stringify: { space: 2 } })).toBe('{\n  "a": 1\n}');
            });

            test('$type returns typeof value', () => {
                expect(runTransform(42, { $type: {} })).toBe('number');
                expect(runTransform('test', { $type: {} })).toBe('string');
                expect(runTransform({}, { $type: {} })).toBe('object');
            });
        });

        describe('Array Transforms', () => {
            test('$average calculates average of numbers', () => {
                expect(runTransform(1, { $average: { array: [2, 3] } })).toBe(2);
                expect(runTransform(10, { $average: { array: [20, 30], value: 40 } })).toBe(25);
            });

            test('$chunk splits array into chunks', () => {
                expect(runTransform([1, 2, 3, 4], { $chunk: { size: 2 } })).toEqual([[1, 2], [3, 4]]);
                expect(runTransform([1, 2, 3], { $chunk: { size: 2 } })).toEqual([[1, 2], [3]]);
            });

            test('$compact removes null/undefined values', () => {
                expect(runTransform([1, null, 2, undefined, 3], { $compact: {} }))
                    .toEqual([1, 2, 3]);
            });

            test('$difference finds array difference', () => {
                expect(runTransform([1, 2, 3], { $difference: { array: [2, 3, 4] } }))
                    .toEqual([1]);
            });

            test('$flatten flattens nested arrays', () => {
                expect(runTransform([1, [2, [3, 4]]], { $flatten: {} }))
                    .toEqual([1, 2, 3, 4]);
                expect(runTransform([1, [2, [3, 4]]], { $flatten: { depth: 1 } }))
                    .toEqual([1, 2, [3, 4]]);
            });

            test('$groupBy groups array by key', () => {
                const data = [
                    { type: 'a', value: 1 },
                    { type: 'b', value: 2 },
                    { type: 'a', value: 3 }
                ];
                expect(runTransform(data, { $groupBy: { key: 'type' } }))
                    .toEqual({
                        a: [{ type: 'a', value: 1 }, { type: 'a', value: 3 }],
                        b: [{ type: 'b', value: 2 }]
                    });
            });

            test('$intersection finds common elements', () => {
                expect(runTransform([1, 2, 3], { $intersection: { array: [2, 3, 4] } }))
                    .toEqual([2, 3]);
            });

            test('$product calculates array product', () => {
                expect(runTransform([1, 2], { $product: { value: 2, array: [3] } }))
                    .toEqual([2, 4, 3, 6]);
            });

            test('$push adds elements to array', () => {
                expect(runTransform([1, 2], { $push: { array: [3, 4] } }))
                    .toEqual([1, 2, 3, 4]);
            });

            test('$slice extracts array portion', () => {
                expect(runTransform([1, 2, 3, 4], { $slice: { start: 1, end: 3 } }))
                    .toEqual([2, 3]);
            });

            test('$sort sorts array', () => {
                expect(runTransform([3, 1, 4, 2], { $sort: { compare: (a, b) => a - b } }))
                    .toEqual([1, 2, 3, 4]);
            });

            test('$splice modifies array', () => {
                expect(runTransform([1, 2, 3], { $splice: { start: 1, deleteCount: 1, items: [4] } }))
                    .toEqual([1, 4, 3]);
            });

            test('$union combines arrays uniquely', () => {
                expect(runTransform([1, 2], { $union: { array: [2, 3] } }))
                    .toEqual([1, 2, 3]);
            });

            test('$unique removes duplicates', () => {
                expect(runTransform([1, 2, 2, 3, 3], { $unique: {} }))
                    .toEqual([1, 2, 3]);
            });
        });

        describe('String and Type Conversion Transforms', () => {
            test('$capitalize capitalizes first letter', () => {
                expect(runTransform('test', { $capitalize: {} })).toBe('Test');
                expect(runTransform('TEST', { $capitalize: {} })).toBe('TEST');
            });

            test('$format formats string with context', () => {
                const data = { name: 'John', age: 30 };
                expect(runTransform(data, {
                    $format: {
                        template: 'Name: ${name}, Age: ${age}',
                        values: { title: 'Mr.' }
                    }
                })).toBe('Name: John, Age: 30');
            });

            test('$join joins array elements', () => {
                expect(runTransform(['a', 'b', 'c'], { $join: { separator: ', ' } }))
                    .toBe('a, b, c');
            });

            test('$replace replaces string parts', () => {
                expect(runTransform('test test', { $replace: { pattern: /test/g, replacement: 'fix' } }))
                    .toBe('fix fix');
            });

            test('$split splits string', () => {
                expect(runTransform('a,b,c', { $split: { separator: ',' } }))
                    .toEqual(['a', 'b', 'c']);
            });

            test('$toBoolean converts to boolean', () => {
                expect(runTransform('true', { $toBoolean: {} })).toBe(true);
                expect(runTransform('false', { $toBoolean: {} })).toBe(false);
                expect(runTransform('yes', { $toBoolean: {} })).toBe(true);
                expect(runTransform('no', { $toBoolean: {} })).toBe(false);
            });

            test('$toDate converts to date', () => {
                const date = new Date('2023-01-01');
                expect(runTransform('2023-01-01', { $toDate: {} })).toEqual(date);
                expect(runTransform('invalid', { $toDate: {} })).toBeUndefined();
            });

            test('$toNumber converts to number', () => {
                expect(runTransform('42', { $toNumber: {} })).toBe(42);
                expect(runTransform('0xFF', { $toNumber: { radix: 16 } })).toBe(255);
                expect(runTransform('invalid', { $toNumber: {} })).toBeUndefined();
            });

            test('$toString converts to string', () => {
                expect(runTransform(42, { $toString: {} })).toBe('42');
                expect(runTransform(null, { $toString: {allowNull:true} })).toBe('null');
                expect(runTransform(undefined, { $toString: {} })).toBeUndefined();
            });

            test('$trim removes whitespace', () => {
                expect(runTransform('  test  ', { $trim: {} })).toBe('test');
            });
        });

        describe('Additional Array Transforms', () => {
            test('$dot calculates dot product', () => {
                expect(runTransform(2, { $dot: { value: 3, array: [4] } })).toBe(29);
                expect(runTransform(0, { $dot: { value: 1 } })).toBe(1);
            });

            test('$setDifference finds set difference', () => {
                expect(runTransform([1, 2, 3], { $setDifference: { array: [2, 3, 4] } }))
                    .toEqual([1]);
            });

            test('$shift removes and returns first element', () => {
                expect(runTransform([1, 2, 3], { $shift: {} })).toBe(1);
                expect(runTransform([], { $shift: {} })).toBeUndefined();
            });

            test('$unshift adds elements to start of array', () => {
                expect(runTransform([3, 4], { $unshift: { array: [1, 2] } }))
                    .toEqual([1, 2, 3, 4]);
            });
        });

        describe('Math Transforms', () => {
            // Trigonometric Functions
            test('basic trigonometric transforms', () => {
                expect(runTransform(0, { $sin: {} })).toBe(0);
                expect(runTransform(Math.PI/2, { $cos: {} })).toBeCloseTo(0);
                expect(runTransform(0, { $tan: {} })).toBe(0);
            });

            test('inverse trigonometric transforms', () => {
                expect(runTransform(1, { $asin: {} })).toBeCloseTo(Math.PI/2);
                expect(runTransform(1, { $acos: {} })).toBeCloseTo(0);
                expect(runTransform(1, { $atan: {} })).toBeCloseTo(Math.PI/4);
                expect(runTransform(1, { $atan2: { b: 1 } })).toBeCloseTo(Math.PI/4);
            });

            test('hyperbolic functions', () => {
                expect(runTransform(1, { $sinh: {} })).toBeCloseTo(1.1752011936438014);
                expect(runTransform(1, { $cosh: {} })).toBeCloseTo(1.5430806348152437);
                expect(runTransform(0, { $tanh: {} })).toBe(0);
            });

            test('inverse hyperbolic functions', () => {
                expect(runTransform(1, { $asinh: {} })).toBeCloseTo(0.8813735870195429);
                expect(runTransform(2, { $acosh: {} })).toBeCloseTo(1.3169578969248166);
                expect(runTransform(0, { $atanh: {} })).toBe(0);
            });

            test('exponential and logarithmic functions', () => {
                expect(runTransform(1, { $exp: {} })).toBeCloseTo(Math.E);
                expect(runTransform(1, { $expm1: {} })).toBeCloseTo(Math.E - 1);
                expect(runTransform(Math.E, { $log: {} })).toBe(1);
                expect(runTransform(100, { $log10: {} })).toBe(2);
                expect(runTransform(0, { $log1p: {} })).toBe(0);
                expect(runTransform(8, { $log2: {} })).toBe(3);
            });

            test('power and root functions', () => {
                expect(runTransform(2, { $pow: { value: 3 } })).toBe(8);
                expect(runTransform(8, { $cbrt: {} })).toBe(2);
                expect(runTransform(4, { $sqrt: {} })).toBe(2);
            });

            test('rounding and sign functions', () => {
                expect(runTransform(1.5, { $floor: {} })).toBe(1);
                expect(runTransform(1.5, { $ceil: {} })).toBe(2);
                expect(runTransform(1.6, { $round: {} })).toBe(2);
                expect(runTransform(3.2, { $trunc: {} })).toBe(3);
                expect(runTransform(-5, { $sign: {} })).toBe(-1);
            });

            test('binary functions', () => {
                expect(runTransform(2, { $clz32: {} })).toBe(30);
                expect(runTransform(2, { $imul: { value: 3 } })).toBe(6);
                expect(runTransform(2, { $fround: {} })).toBe(2);
            });

            test('aggregate functions', () => {
                expect(runTransform(3, { $hypot: { value: 4 } })).toBe(5);
            });
            test('$abs calculates absolute value', () => {
                expect(runTransform(-5, { $abs: {} })).toBe(5);
            });

            test('$clamp constrains number', () => {
                expect(runTransform(5, { $clamp: { min: 0, max: 10 } })).toBe(5);
                expect(runTransform(-5, { $clamp: { min: 0, max: 10 } })).toBe(0);
                expect(runTransform(15, { $clamp: { min: 0, max: 10 } })).toBe(10);
            });

            test('$lerp performs linear interpolation', () => {
                expect(runTransform(0, { $lerp: { target: 10, alpha: 0.5 } })).toBe(5);
            });

            test('$normalize normalizes number', () => {
                expect(runTransform(5, { $normalize: { min: 0, max: 10 } })).toBe(0.5);
            });

            test('$percentile calculates percentile', () => {
                expect(runTransform(5, { $percentile: { array: [1, 2, 3, 4], p: 50 } }))
                    .toBeCloseTo(3);
            });

            test('$statistics calculates statistics', () => {
                const result = runTransform(1, {
                    $statistics: { array: [2, 3, 4, 5] }
                });
                expect(result).toEqual({
                    mean: 3,
                    median: 3,
                    mode: 1,
                    variance: expect.any(Number),
                    stdDev: expect.any(Number),
                    min: 1,
                    max: 5,
                    range: 4,
                    count: 5
                });
            });
        });

        describe('Date Transforms', () => {
            test('$dateFormat formats date', () => {
                const date = new Date('2023-01-01T12:30:45');
                expect(runTransform(date, { $dateFormat: { format: 'YYYY-MM-DD' } }))
                    .toBe('2023-01-01');
                expect(runTransform(date, { $dateFormat: { format: 'HH:mm:ss' } }))
                    .toBe('12:30:45');
                expect(runTransform(date, { $dateFormat: { format: 'MMM DD, YYYY' } }))
                    .toBe('Jan 01, 2023');
                expect(runTransform('invalid', { $dateFormat: {} }))
                    .toBeUndefined();
            });
        });
    });

    describe('ChocolateMango Extensions and Embeddings', () => {
        beforeEach(() => {
            // Reset any custom predicates/transforms before each test
            db.predicates = { ...predicates };
            db.transforms = { ...transforms };
        });

        describe('Custom Predicates', () => {
            test('can add custom predicate', () => {
                db.addPredicate('$isPositive', (a) => a > 0 ? a : undefined);

                const result = db.query(5, { $isPositive: true });
                expect(result).toBe(5);

                const negativeResult = db.query(-5, { $isPositive: true });
                expect(negativeResult).toBeUndefined();
            });

            test('validates predicate name starts with $', () => {
                expect(() => {
                    db.addPredicate('isPositive', (a) => a > 0 ? a : undefined);
                }).toThrow('Predicate must have a string name starting with $ and function implementation');
            });

            test('validates predicate is a function', () => {
                expect(() => {
                    db.addPredicate('$isPositive', 'not a function');
                }).toThrow('Predicate must have a string name starting with $ and function implementation');
            });

            test('custom predicate with multiple arguments', () => {
                db.addPredicate('$inCustomRange', (a, [min, max]) =>
                    a >= min && a <= max ? a : undefined
                );

                expect(db.query(5, { $inCustomRange: [0, 10] })).toBe(5);
                expect(db.query(15, { $inCustomRange: [0, 10] })).toBeUndefined();
            });

            test('custom predicate with options', () => {
                db.addPredicate('$customMatch', (a, options) => {
                    if (options?.ignoreCase && typeof a === 'string' && typeof options.pattern === 'string') {
                        return a.toLowerCase() === options.pattern.toLowerCase() ? a : undefined;
                    }
                    return a === pattern ? a : undefined;
                });

                expect(db.query('TEST', {
                    $customMatch: {pattern: 'test', ignoreCase: true }
                })).toBe('TEST');
            });
        });

        describe('Custom Transforms', () => {
            test('can add custom transform', () => {
                db.addTransform('$double', (a) => a * 2);

                const result = db.query(5, { $double: {} });
                expect(result).toBe(10);
            });

            test('validates transform name starts with $', () => {
                expect(() => {
                    db.addTransform('double', (a) => a * 2);
                }).toThrow('Transform must have a string name starting with $ and function implementation');
            });

            test('validates transform is a function', () => {
                expect(() => {
                    db.addTransform('$double', 'not a function');
                }).toThrow('Transform must have a string name starting with $ and function implementation');
            });

            test('custom transform with options', () => {
                db.addTransform('$multiply', (a, { factor = 2 }) => a * factor);

                expect(db.query(5, { $multiply: { factor: 3 } })).toBe(15);
                expect(db.query(5, { $multiply: {} })).toBe(10); // uses default factor
            });
        });

        describe('Embeddings and Similarity', () => {
            test('calculates similarity between embeddings', () => {
                const text1 = 'hello world test';
                const text2 = 'hello world other';
                const text3 = 'completely different text';

                const embedding1 = ChocolateMango.createEmbedding(text1);
                const embedding2 = ChocolateMango.createEmbedding(text2);
                const embedding3 = ChocolateMango.createEmbedding(text3);

                // Same text should have similarity of 1
                expect(ChocolateMango.calculateSimilarity(embedding1, embedding1)).toBeGreaterThanOrEqual(1);

                // Similar texts should have similarity between 0 and 1
                const similarity12 = ChocolateMango.calculateSimilarity(embedding1, embedding2);
                expect(similarity12).toBeGreaterThan(0);
                expect(similarity12).toBeLessThan(1);

                // Different texts should have low similarity
                const similarity13 = ChocolateMango.calculateSimilarity(embedding1, embedding3);
                expect(similarity13).toBeLessThan(similarity12);
            });

            test('similarity is commutative', () => {
                const text1 = 'hello world';
                const text2 = 'hello test';

                const embedding1 = ChocolateMango.createEmbedding(text1);
                const embedding2 = ChocolateMango.createEmbedding(text2);

                const similarity12 = ChocolateMango.calculateSimilarity(embedding1, embedding2);
                const similarity21 = ChocolateMango.calculateSimilarity(embedding2, embedding1);

                expect(similarity12).toBe(similarity21);
            });
        });

        describe('Integration Tests', () => {

            test('custom transform with similarity check', () => {
                db.addTransform('$getSimilarity', (a, { compareWith }) => {
                    const embedding1 = ChocolateMango.createEmbedding(a);
                    const embedding2 = ChocolateMango.createEmbedding(compareWith);
                    return ChocolateMango.calculateSimilarity(embedding1, embedding2);
                });

                const result = db.query(
                    'hello world test',
                    { $getSimilarity: { compareWith: 'hello world other' } }
                );

                expect(result).toBeGreaterThan(0);
                expect(result).toBeLessThan(1);
            });
        });
    });
});

