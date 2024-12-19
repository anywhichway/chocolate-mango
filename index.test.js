import { ChocolateMango } from './index.js';

describe('ChocolateMango', () => {
    describe('Predicates', () => {
        describe('Array Predicates', () => {
            test('$all should check if array contains all specified elements', () => {
                const arr = [1, 2, 3, 4];
                expect(ChocolateMango.query(arr, { $all: [1, 2] })).toEqual(arr);
                expect(ChocolateMango.query(arr, { $all: [5] })).toEqual(undefined);
            });

            test('$size should check array length', () => {
                const arr = [1, 2, 3, 4];
                expect(ChocolateMango.query(arr, { $size: 4 })).toEqual(arr);
                expect(ChocolateMango.query(arr, { $size: 3 })).toEqual(undefined);
            });

            test('$includes should check if array includes specified elements', () => {
                const arr = [1, 2, 3, 4];
                expect(ChocolateMango.query(arr, { $includes: [1, 2] })).toEqual(arr);
                expect(ChocolateMango.query(arr, { $includes: [5] })).toEqual(undefined);
            });
        });

        describe('Comparison Predicates', () => {
            test('$eq should check equality', () => {
                expect(ChocolateMango.query(5, { $eq: 5 })).toEqual(5);
                expect(ChocolateMango.query(5, { $eq: 6 })).toEqual(undefined);
            });

            test('$gt should check greater than', () => {
                expect(ChocolateMango.query(5, { $gt: 4 })).toEqual(5);
                expect(ChocolateMango.query(5, { $gt: 5 })).toEqual(undefined);
            });

            test('$lt should check less than', () => {
                expect(ChocolateMango.query(5, { $lt: 6 })).toEqual(5);
                expect(ChocolateMango.query(5, { $lt: 5 })).toEqual(undefined);
            });
        });

        describe('String Predicates', () => {
            test('$contains should check string containment', () => {
                expect(ChocolateMango.query('hello world', { $contains: 'world' })).toEqual('hello world');
                expect(ChocolateMango.query('hello world', { $contains: 'xyz' })).toEqual(undefined);
            });

            test('$startsWith should check string prefix', () => {
                expect(ChocolateMango.query('hello world', { $startsWith: 'hello' })).toEqual('hello world');
                expect(ChocolateMango.query('hello world', { $startsWith: 'world' })).toEqual(undefined);
            });

            test('$endsWith should check string suffix', () => {
                expect(ChocolateMango.query('hello world', { $endsWith: 'world' })).toEqual('hello world');
                expect(ChocolateMango.query('hello world', { $endsWith: 'hello' })).toEqual(undefined);
            });
        });
    });

    describe('Transforms', () => {
        describe('Array Transforms', () => {
            test('$flatten should flatten nested arrays', () => {
                const arr = [[1, 2], [3, 4]];
                expect(ChocolateMango.query(arr, { $flatten: { as: 'flat' } })).toEqual([1, 2, 3, 4]);
            });

            test('$unique should remove duplicates', () => {
                const arr = [1, 2, 2, 3, 3, 4];
                expect(ChocolateMango.query(arr, { $unique: { as: 'unique' } })).toEqual([1, 2, 3, 4]);
            });

            test('$sort should sort array elements', () => {
                const arr = [3, 1, 4, 2];
                expect(ChocolateMango.query(arr, { $sort: { as: 'sorted' } })).toEqual([1, 2, 3, 4]);
            });
        });

        describe('String Transforms', () => {
            test('$capitalize should capitalize first letter', () => {
                expect(ChocolateMango.query('hello', { $capitalize: { as: 'cap' } })).toBe('Hello');
            });

            test('$trim should remove whitespace', () => {
                expect(ChocolateMango.query('  hello  ', { $trim: { as: 'trimmed' } })).toBe('hello');
            });

            test('$split should split string into array', () => {
                expect(ChocolateMango.query('a,b,c', { $split: { as: 'split', separator: ',' } })).toEqual(['a', 'b', 'c']);
            });
        });

        describe('Math Transforms', () => {
            test('$abs should return absolute value', () => {
                expect(ChocolateMango.query(-5, { $abs: { as: 'abs' } })).toBe(5);
            });

            test('$round should round number', () => {
                expect(ChocolateMango.query(5.6, { $round: { as: 'rounded' } })).toBe(6);
            });

            test('$floor should floor number', () => {
                expect(ChocolateMango.query(5.6, { $floor: { as: 'floored' } })).toBe(5);
            });
        });
    });

    describe('Query Operations', () => {
        test('should handle nested dot notation paths', () => {
            const obj = { user: { name: 'John', age: 30 } };
            expect(ChocolateMango.query(obj, { 'user.name': { $eq: 'John' } })).toEqual(obj);
        });

        test('should handle multiple conditions', () => {
            const obj = { name: 'John', age: 30 };
            expect(ChocolateMango.query(obj, {
                name: { $eq: 'John' },
                age: { $gt: 25 }
            })).toEqual(obj);
        });

    });

    describe('Sort Operations', () => {
        test('should sort by single criteria', () => {
            const arr = [
                { name: 'John', age: 30 },
                { name: 'Jane', age: 25 }
            ];
            const sorted = ChocolateMango.sort(arr, [{ path: 'age', direction: 'asc' }]);
            expect(sorted[0].age).toBe(25);
            expect(sorted[1].age).toBe(30);
        });

        test('should sort by multiple criteria', () => {
            const arr = [
                { name: 'John', age: 30, score: 100 },
                { name: 'Jane', age: 30, score: 95 },
                { name: 'Bob', age: 25, score: 100 }
            ];
            const sorted = ChocolateMango.sort(arr, [
                { path: 'age', direction: 'desc' },
                { path: 'score', direction: 'desc' }
            ]);
            expect(sorted[0]).toEqual(arr[0]); // John (30, 100)
            expect(sorted[1]).toEqual(arr[1]); // Jane (30, 95)
            expect(sorted[2]).toEqual(arr[2]); // Bob (25, 100)
        });
    });

    describe('Custom Extensions', () => {
        test('should allow adding custom predicates', () => {
            ChocolateMango.addPredicate('$isPositive', (value) => value > 0 ? value : undefined);
            expect(ChocolateMango.query(5, { $isPositive: true })).toEqual(5);
            expect(ChocolateMango.query(-5, { $isPositive: true })).toEqual(undefined);
        });

        test('should allow adding custom transforms', () => {
            ChocolateMango.addTransform('$double', (value) => value * 2);
            expect(ChocolateMango.query(5, { $double: { as: 'doubled' } })).toBe(10);
        });
    });

    /*describe('Vector Operations', () => {
        test('should calculate similarity correctly', () => {
            const embedding1 = { word1: 1, word2: 2 };
            const embedding2 = { word1: 1, word2: 2 };
            const similarity = ChocolateMango.prototype.calculateSimilarity(embedding1, embedding2);
            expect(similarity).toBe(1); // Perfect match
        });

        test('should create valid embeddings', () => {
            const text = 'hello world hello';
            const embedding = ChocolateMango.prototype.createEmbedding(text);
            expect(embedding).toEqual({
                hello: 2,
                world: 1
            });
        });
    });*/
});