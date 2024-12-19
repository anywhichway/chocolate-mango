(() => {
    const VALID_MANGO_OPERATORS = new Set([
        '$lt', '$lte', '$eq', '$ne', '$gte', '$gt',
        '$exists', '$type', '$in', '$nin', '$size',
        '$mod', '$regex', '$or', '$and', '$nor', '$not',
        '$all', '$elemMatch'
    ]);

    function normalizeMangoQuery(obj, parentPath = '', result = {}) {
        // Special handling for logical operators
        if (isLogicalOperator(obj)) {
            return handleLogicalOperator(obj);
        }

        for (const [key, value] of Object.entries(obj)) {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;

            // If value is a mango operator
            if (key.startsWith('$')) {
                if (VALID_MANGO_OPERATORS.has(key)) {
                    result[parentPath] = { [key]: value };
                }
                continue;
            }

            // If value is an object but not an array and not a query operator
            if (isPlainObject(value)) {
                const hasOperators = Object.keys(value).some(k => k.startsWith('$'));

                if (hasOperators) {
                    // Check if all operators are valid
                    const validOperators = Object.keys(value).every(k =>
                        !k.startsWith('$') || VALID_MANGO_OPERATORS.has(k)
                    );

                    if (validOperators) {
                        result[currentPath] = value;
                    }
                } else {
                    normalizeMangoQuery(value, currentPath, result);
                }
            } else {
                // For direct value assignments, convert to $eq
                result[currentPath] = { $eq: value };
            }
        }

        return result;
    }

// Helper functions
    function isPlainObject(value) {
        return typeof value === 'object'
            && value !== null
            && !Array.isArray(value)
            && Object.getPrototypeOf(value) === Object.prototype;
    }

    function isLogicalOperator(obj) {
        const keys = Object.keys(obj);
        return keys.length === 1 && ['$or', '$and', '$nor'].includes(keys[0]);
    }

    function handleLogicalOperator(obj) {
        const operator = Object.keys(obj)[0];
        const normalizedClauses = obj[operator].map(clause =>
            normalizeMangoQuery(clause)
        );
        return { [operator]: normalizedClauses };
    }

    const predicates = {
        $lt(a, b) { return a < b ? a : undefined },
        $lte(a, b) { return a <= b ? a : undefined },
        $eq(a, b) { return a === b ? a : undefined },
        $ne(a, b) { return a !== b ? a : undefined },
        $gte(a, b) { return a >= b ? a : undefined },
        $gt(a, b) { return a > b ? a : undefined },
        $exists(a, b) { return a != null ? a : undefined },
        $type(a, b) { return typeof a === b ? a : undefined },
        $in(a, b) { return b.includes(a) ? a : undefined },
        $nin(a, b) { return !b.includes(a) ? a : undefined },
        $size(a, b) { return Array.isArray(a) && a.length === b ? a : undefined },
        $mod(a, [b, c]) { return a % b === c ? a : undefined },
        $regex(a, b) { return b.test(a) ? a : undefined },
        $or(a, array,options) { return array.some(pattern => query(pattern, a,options)) ? a : undefined },
        $and(a, array,options) { return array.every(pattern => query(pattern, a,options)) ? a : undefined },
        $nor(a, array,options) { return !array.some(pattern => query(pattern, a,options)) ? a : undefined },
        $not(a, pattern,options) { return !query(pattern, a,options) ? a : undefined },
        $all(a, array) { return Array.isArray(a) && array.every(value => a.includes(value)) ? a : undefined },
        $elemMatch(a, pattern,options) { return Array.isArray(a) && a.some(value => query(pattern, value,options)) ? a : undefined },

        $intersects(a, b) {
            return Array.isArray(a) && Array.isArray(b) && a.some(value => b.includes(value)) ? a : undefined
        },
        $disjoint(a, b) {
            return Array.isArray(a) && Array.isArray(b) && !a.some(value => b.includes(value)) ? a : undefined
        },
        $subset(a, b) {
            return Array.isArray(a) && Array.isArray(b) && a.every(value => b.includes(value)) ? a : undefined
        },
        $superset(a, b) {
            return Array.isArray(a) && Array.isArray(b) && b.every(value => a.includes(value)) ? a : undefined
        },
        $excludes(a, b) {
            return Array.isArray(a) && Array.isArray(b) && !b.some(value => a.includes(value)) ? a : undefined
        },
        $includes(a, b) {
            return Array.isArray(a) && Array.isArray(b) && b.every(value => a.includes(value)) ? a : undefined
        },
        $instanceof(a, b) {
            return a && typeof a === "object" && a instanceof b ? a : undefined
        },
        $kindof(a, b) {
            return a != null && a.constructor.name === b ? a : undefined
        },
        $isOdd(a) {
            return a % 2 === 1 ? a : undefined
        },
        $isEven(a) {
            return a % 2 === 0 ? a : undefined
        },
        $isUSTel(a) {
            return /^\d{3}-\d{3}-\d{4}$/.test(a) ? a : undefined
        },
        $isIP4(a) {
            return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(a) ? a : undefined
        },
        $isIP6(a) {
            return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(a) ? a : undefined
        },
        $isEmail(a) {
            return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(a) ? a : undefined
        },
        $isSSN(a) {
            return /^\d{3}-\d{2}-\d{4}$/.test(a) ? a : undefined
        },
        $isURL(a) {
            return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(a) ? a : undefined
        },
        $isUUID(a) {
            return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(a) ? a : undefined
        },
        $isDate(a) {
            return !isNaN(Date.parse(a)) ? a : undefined
        },
        $isTime(a) {
            return /^\d{1,2}:\d{2}(:\d{2})?$/.test(a) ? a : undefined
        },
        $isJSON(a) {
            try {
                JSON.parse(a);
                return a;
            } catch (e) {
                return undefined
            }
        },
        $isBase64(a) {
            return /^[a-zA-Z0-9+/]*={0,2}$/.test(a) ? a : undefined
        },
        $isHex(a) {
            return /^[0-9a-fA-F]*$/.test(a) ? a : undefined
        },
        $isAlpha(a) {
            return /^[a-zA-Z]*$/.test(a) ? a : undefined
        },
        $isAlphaNum(a) {
            return /^[a-zA-Z0-9]*$/.test(a) ? a : undefined
        },
        $test(a, b) {
            return b.test(a) ? a : undefined
        }
    }
    
    const tranforms = {
        $call(a, {f}) { return f(a) },
        $mod(a, [b, c]) { return a % b === c? a : undefined },
        $default(a, {value}) { return a==null ? value : a },
        $define(a, {enumerable,writable,configurable,value}) { value||=a; return (o,key) => { Object.defineProperty(o,key,{enumerable,writable,configurable,value}); return value; } },
        // all array functions in alphabetical order
        $average(a, {value,array=[]}) {
            const items = [a,...array];
            if(!isNaN(value)) items.push(value);
            return itmem.reduce((sum,value,i,array) => sum + value/array.length,0)
        },
        $difference(a, {array}) { return Array.isArray(a) && Array.isArray(array) ? a.filter(item => !array.includes(item)) : undefined },
        $dot(a, {value=0,array=[]}) { return [a,value,...array].reduce((dot,value) => dot + value * value,0) },
        $intersection(a, {array}) { return Array.isArray(a) && Array.isArray(array) ? a.filter(item => array.includes(item)) : undefined },
        $join(a, {array,separator}) { return Array.isArray(a) && Array.isArray(array) ? [...a,...array].join(separator) : undefined },
        $pop(a) { return Array.isArray(a) ? a.pop() : undefined },
        $product(a, {value=1,array=[]}) { return a.flatMap(x => [value,...array].map(y => x * y)) },
        $push(a, {array}) { return Array.isArray(a) && Array.isArray(array) ? [...a,...array] : undefined },
        $setDifference(a, {array}) { return Array.isArray(a) && Array.isArray(array) ? a.filter(item => !array.includes(array)) : undefined },
        $shift(a) { return Array.isArray(a) ? a.shift() : undefined },
        $slice(a, {start=0,end}) { return Array.isArray(a) ? a.slice(start,end) : undefined },
        $sort(a, {compare}) { return Array.isArray(a) ? a.sort(compare) : undefined },
        $splice(a, {start,deleteCount,items=[]}) { return Array.isArray(a) ? a.splice(start,deleteCount,...items) : undefined },
        $sum(a, {value=0,array=[]}) { return [a,value,...array].reduce((sum,value) => sum + value,0) },
        $unshift(a, {array}) { return Array.isArray(a) && Array.isArray(array) ? [...array,...a] : undefined },
        $union(a, {array}) { return Array.isArray(a) && Array.isArray(b) ? [...new Set([...a, ...b])] : undefined },

        // All Math.* functions in alphabetical order
        $abs(a) { return Math.abs(a) },
        $acos(a) { return Math.acos(a) },
        $acosh(a) { return Math.acosh(a) },
        $asin(a) { return Math.asin(a) },
        $asinh(a) { return Math.asinh(a) },
        $atan(a) { return Math.atan(a) },
        $atan2(a, b) { return Math.atan2(a,b) },
        $atanh(a) { return Math.atanh(a) },
        $cbrt(a) { return Math.cbrt(a) },
        $ceil(a) { return Math.ceil(a) },
        $clz32(a) { return Math.clz32(a) },
        $cos(a) { return Math.cos(a) },
        $cosh(a) { return Math.cosh(a) },
        $exp(a) { return Math.exp(a) },
        $expm1(a) { return Math.expm1(a) },
        $floor(a) { return Math.floor(a) },
        $fround(a) { return Math.fround(a) },
        $hypot(a, {value=0,array=[]}) { return Math.hypot(a,value,...array) },
        $imul(a, {value}) { return Math.imul(a,value) },
        $log(a, {value=Math.E}) { return Math.log(a)/Math.log(value) },
        $log10(a) { return Math.log10(a) },
        $log1p(a) { return Math.log1p(a) },
        $log2(a) { return Math.log2(a) },
        $max(a, {value,array}) { return Math.max(a,value,...array) },
        $min(a, {value,array}) { return Math.min(a,value,...array) },
        $pow(a, {value}) { return Math.pow(a,value) },
        //$random(a) { return Math.random()*a },
        $round(a) { return Math.round(a) },
        $sign(a) { return Math.sign(a) },
        $sin(a) { return Math.sin(a) },
        $sinh(a) { return Math.sinh(a) },
        $sqrt(a) { return Math.sqrt(a) },
        $tan(a) { return Math.tan(a) },
        $tanh(a) { return Math.tanh(a) },
        $trunc(a) { return Math.trunc(a) }
    }

    function expandDotNotation(pattern) {
        const result = {};
        for (const key in pattern) {
            if (key[0]=="$" || !key.includes('.')) {
                result[key] = pattern[key];
                continue;
            }

            const parts = key.split('.');
            let current = result;

            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = current[parts[i]] || {};
                current = current[parts[i]];
            }

            current[parts[parts.length - 1]] = pattern[key];
        }
        return result;
    }

    function query(data, pattern, {parentKey, parent} = {}) {
        // Expand dot notation pattern before processing
        const expandedPattern = expandDotNotation(pattern);

        const array = Array.isArray(data) ? data : [data];
        const results = array.reduce((results, value, i) => {
            for (const key in expandedPattern) {
                let result;
                if (predicates[key]) {
                    result = predicates[key](value, expandedPattern[key], {parentKey, key, parent});
                } else if (tranforms[key]) {
                    parent[expandedPattern[key].as || parentKey] = tranforms[key](value, expandedPattern[key], {parentKey, key, parent});
                    continue;
                } else if (typeof expandedPattern[key] === 'object') {
                    result = query(value[key], expandedPattern[key], {parentKey: key, parent: value});
                } else if (expandedPattern[key] === value[key]) {
                    continue;
                }

                if (result === undefined) return results;

                if (parentKey) {
                    if (typeof result === "function") {
                        value = result(parent, parentKey, value);
                    } else if (parent[parentKey] !== result) {
                        value = parent[parentKey] = result;
                    }
                }
            }
            results.push(value);
            return results;
        }, []);

        return Array.isArray(data) ? results : results[0];
    }
    // Flatten nested object path into dot notation
    const flattenPath = (obj) => {
        const result = {};

        function recurse(current, path = '') {
            for (const [key, value] of Object.entries(current)) {
                const newPath = path ? `${path}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    // If the value is an object with 'order', we've reached a sort specification
                    if (value.order === 'asc' || value.order === 'desc') {
                        result[newPath] = value.order;
                    } else {
                        recurse(value, newPath);
                    }
                } else if (typeof value === 'string' && (value === 'asc' || value === 'desc')) {
                    result[newPath] = value;
                }
            }
        }

        recurse(obj);
        return result;
    };

    // Normalize sort criteria to standard format
    const normalizeSortCriteria = (criteria) => {
        if (typeof criteria === 'string') {
            return { path: criteria, direction: 'asc' };
        }

        if (typeof criteria === 'object') {
            const flattened = flattenPath(criteria);
            const [[path, direction]] = Object.entries(flattened);
            return { path, direction };
        }

        throw new Error('Invalid sort criteria');
    };

    // Get value from object using either dot notation or nested path
    const getValue = (obj, path) => {
        return path.split('.').reduce((o, i) => {
            return o ? o[i] : undefined;
        }, obj);
    };

    function sort(array, sort) {

        // Create a copy of the array to avoid modifying the original
        return [...array].sort((a, b) => {
            // Iterate through each sort criteria
            for (const criteria of sort) {
                const { path, direction } = normalizeSortCriteria(criteria);

                const aVal = getValue(a, path);
                const bVal = getValue(b, path);

                let comparison = 0;

                // Handle undefined values
                if (aVal === undefined && bVal === undefined) {
                    comparison = 0;
                } else if (aVal === undefined) {
                    comparison = 1;
                } else if (bVal === undefined) {
                    comparison = -1;
                }
                // Compare dates
                else if (aVal instanceof Date && bVal instanceof Date) {
                    comparison = aVal.getTime() - bVal.getTime();
                }
                // Compare strings case-insensitively
                else if (typeof aVal === 'string' && typeof bVal === 'string') {
                    comparison = aVal.localeCompare(bVal);
                }
                // Compare numbers and other types
                else {
                    comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }

                // Apply sort direction
                if (direction === 'desc') {
                    comparison *= -1;
                }

                // If items are not equal, return the comparison
                if (comparison !== 0) {
                    return comparison;
                }
            }

            // If all criteria are equal, maintain original order
            return 0;
        });
    }

    async function setupIndexes(db) {
        // Create indexes for efficient querying
        await db.createIndex({
            index: {
                fields: ['RAGcontent']
            }
        });
        await db.createIndex({
            index: {
                fields: ['embedding']
            }
        });
        await db.createIndex({
            index: {
                fields: ['contentHash']
            }
        });
    }

    // Helper function to generate SHA-256 hash of content
    async function generateHash(content) {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Add a document to the store with processed content and content hash
    async function putVectorContent(content, options = {}) {
        typeof content === "string" || (content = JSON.stringify(content));
        const metadata = options.metadata || {},
            id = options.id;
        let prefix = options.prefix || "",
            docTime;
        if(id) prefix += " " + id;
        if(options.prefixTimestamp) {
            const type = typeof options.prefixTimestamp;
            if(options.prefixTimestamp===true) {
                docTime = metadata.timestamp!==null ? new Date(metadata.timestamp) : new Date();
            } else if(type === "number") {
                docTime = new Date(options.prefixTimestamp);
            } else if(type=== "object" && options.prefixTimestamp instanceof Date) {
                docTime = options.prefixTimestamp;
            }
        }
        const contentHash = await this.generateHash(content);
        const {update_seq:seqNumber} = await this.info();

        // Check if document with same id or hash already exists
        const existing = !id ?  await this.find({selector: { contentHash }}) : await this.get(id).catch(() => this.find({selector: { contentHash }}));

        if(existing.docs) {
            if (existing.docs.length > 0) {
                for (const doc of existing.docs) {
                    this.remove(doc);
                }
            }
        } else if(existing) {
            this.remove(existing);
        }
        const timestamp = Date.now();
        if(docTime) {
            prefix += `${docTime.toISOString()} ${docTime.toDateString()}  ${docTime.toLocaleString()}\n`;
        }
        if(options.prefixMetadata && options.metadata) {
            prefix += JSON.stringify(metadata) + "\n";
        }
        const doc = {
            _id: id || String(seqNumber).padStart(24,"0") + "-" + String(timestamp).padStart(16,"0"),
            RAGcontent: prefix + content,
            metadata,
            contentHash,
            embedding: this.createEmbedding(content),
            chunks: await chunkContent(content),
            timestamp
        };
        return await this.put(doc);
    }

    async function removeVectorContent(content) {
        const contentHash = await this.generateHash(content);
        const existing = await this.find({selector: { contentHash }});
        if (existing.docs.length > 0) {
            for(const doc of existing.docs) {
                await this.remove(doc);
            }
        }
    }

    // Simple text chunking using natural sentences
    async function chunkContent(content, maxChunkSize = 500) {
        const {default:nlp} = await import("https://cdn.jsdelivr.net/npm/compromise@14.14.3/+esm");
        const doc = nlp(content);
        const sentences = doc.sentences().json();

        let chunks = [];
        let currentChunk = '';

        for (let sentence of sentences) {
            if ((currentChunk + sentence.text).length <= maxChunkSize) {
                currentChunk += sentence.text + ' ';
            } else {
                chunks.push(currentChunk.trim());
                currentChunk = sentence.text + ' ';
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    // Create a simple embedding using term frequency
    function createEmbedding(text) {
        const words = text.toLowerCase().split(/\W+/);
        const frequency = {};

        for (let word of words) {
            if (word) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        }

        return frequency;
    }

    // Search for similar documents using cosine similarity
    async function searchVectorContent(query, {limit = 5,maxLength=5000,strategy="share"} = {}) {
        const queryEmbedding = this.createEmbedding(query);
        const allDocs = await this.allDocs({
            include_docs: true
        });
        const hashes = new Set();
        let results = await allDocs.rows
            .reduce(async (results,row) => {
                const similarity = this.calculateSimilarity(queryEmbedding, row.doc.embedding);
                if(hashes.has(row.doc.contentHash)) {
                    this.db.remove(row.doc);
                    return results;
                }
                if(similarity===0 || !row.doc.contentHash) {
                    return results;
                }
                results = await results;
                hashes.add(row.doc.contentHash);
                results.push({
                    doc: row.doc,
                    similarity
                });
                return results;
            },[]);
        results = results.sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
        if(maxLength) {
            // based on strategy reduce the response size
            if(strategy==="first") {
                // remove records after total of content length > maxLength, and truncate content on last record if necessary
                let totalLength = 0;
                for(let i=0;i<results.length;i++) {
                    totalLength += results[i].doc.RAGcontent.length;
                    if(totalLength>maxLength) {
                        results = results.slice(0,i);
                        break;
                    }
                }
                if(results.length) {
                    const last = results[results.length-1];
                    if(totalLength>maxLength) {
                        last.doc.content = last.doc.RAGcontent.slice(0,maxLength-totalLength);
                    }
                }
            } else if(strategy==="share") {
                // strategy=share
                // return all records but truncate the content of each record so that the total length is less than maxLength by giving each an equal share of the total length
                let totalLength = 0;
                for(let i=0;i<results.length;i++) {
                    totalLength += results[i].doc.RAGcontent.length;
                }
                const share = maxLength/results.length;
                for(let i=0;i<results.length;i++) {
                    const doc = results[i].doc;
                    doc.content = doc.RAGcontent.slice(0,Math.min(doc.RAGcontent.length,share));
                }
            } else if(strategy==="last") {
                // remove records before total of content length > maxLength, and truncate content on first record if necessary
                let totalLength = 0;
                for(let i=results.length-1;i>=0;i--) {
                    totalLength += results[i].doc.RAGcontent.length;
                    if(totalLength>maxLength) {
                        results = results.slice(i);
                        break;
                    }
                }
                if(results.length) {
                    const first = results[0];
                    if(totalLength>maxLength) {
                        first.doc.RAGcontent = first.doc.RAGcontent.slice(0,maxLength-totalLength);
                    }
                }
            }
        }
        return results;
    }

    // Calculate cosine similarity between query and document embeddings
    function calculateSimilarity(embedding1, embedding2={}) {
        const keys = new Set([...Object.keys(embedding1), ...Object.keys(embedding2)]);
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let key of keys) {
            const val1 = embedding1[key] || 0;
            const val2 = embedding2[key] || 0;
            dotProduct += val1 * val2;
            norm1 += val1 * val1;
            norm2 += val2 * val2;
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1);
    }

    // Clear all documents
    async function clearAll() {
        const docs = await this.getAllDocuments();
        return await Promise.all(
            docs.map(doc => this.deleteDocument(doc._id))
        );
    }


    globalThis.ChocolateMango = {
        dip(pouchdb,{vectors}={}) {
            async function find(request) {
                // convert the selector into one that only has valid PouchDB mango patterns associated with properties
                let {selector,transform,filter,order,...rest} = request;
                if (selector) {
                    selector = normalizeMangoQuery(selector);
                }
                const query = {selector};
                if(!transform && !filter) return oldFind.call(this, {selector,order,...rest});
                const findResult = await oldFind.call(this, query),
                    transformResult = transform ? this.query(transform,findResult) : findResult,
                    filterResult = filter ? this.query(filter,transformResult) : tranformResult,
                    sortedResult = order ? this.sort(filterResult,order) : filterResult;
                return sortedResult;
            }
            const oldFind = pouchdb.find;
            pouchdb.find = find;

            if(vectors) {
                [generateHash, createEmbedding, putVectorContent, removeVectorContent,searchVectorContent, calculateSimilarity, clearAll].forEach(value => {
                    Object.defineProperty(pouchdb, value.name, {configurable:true,writable:false,value})
                })
            }
            return pouchdb;
        },
    };
   /*(() => {
        debugger;
        const {query,sort} = ChocolateMango;
        console.log(query(
            [{balance: 10,owner:{age:10}}, {balance: 20,owner:{age:5}}, {balance: 10,owner:{age:20}}],
            {balance: {$and:[{$default: {value: 10}}]}, owner: {age: {$gt: 5}}}
        ));
        console.log(query(
            [{balance: 10,owner:{age:10}}, {balance: 20,owner:{age:5}}, {balance: 10,owner:{age:20}}],
            {balance: {$and:[{$default: {value: 10}}]}, "owner.age": {$gt: 5}}
        ));
        console.log(sort(
            [{balance: 10,owner:{age:10}}, {balance: 20,owner:{age:5}}, {balance: 10,owner:{age:20}}],
            [{balance: 'asc'}, {owner:{age: 'desc'}}]
        ));
    })();*/
})();
