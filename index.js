import {HangulEmbeddingEncoder} from "./src/hangul-embedding-encoder.js";

    const VALID_MANGO_OPERATORS = new Set([
        '$lt', '$lte', '$eq', '$ne', '$gte', '$gt',
        '$exists', '$type', '$in', '$nin', '$size',
        '$mod', '$regex', '$or', '$and', '$nor', '$not',
        '$all', '$elemMatch'
    ]);

    async function toSerializable(data) {
        data = await data;
        if(data+""==="NaN") return "#NaN";
        if(data+""==="Infinity") return "#Infinity";
        if(data+""==="-Infinity") return "-#Infinity";
        const type = typeof data;
        if(!data || type === 'string' || type === 'number' || type === 'boolean') return data;
        if(type === 'symbol') return `@${data.toString()}`;
        if(Array.isArray(data)) {
            for(let i=0; i<data.length; i++) data[i] = await toSerializable(data[i]);
            return data;
        }
        if(type === 'object') {
            if(data instanceof Date) return `Date@${data.getTime()}`;
            for(let key in data) data[key] = await toSerializable(data[key]);
            return data;
        }
    }

    function deserialize(data) {
        if(data==="#NaN") return NaN;
        if(data==="#Infinity") return Infinity;
        if(data==="-#Infinity") return -Infinity;
        const type = typeof data;
        // if is a string representation of a symbol, turn back into a symbol
        if(type==="string") {
            if(data.startsWith("@Symbol(") && data.endsWith(")")) return Symbol(data.slice(7,-1));
            if(data.startsWith("Date@")) return new Date(Number(data.slice(5)));
        }
        if(Array.isArray(data)) {
            return data.map(deserialize);
        }
        if(data && type === 'object') {
            Object.entries(data).forEach(([key,value]) => data[key] = deserialize(value));
            return data;
        }
        return data;
    }

    function argLength(func) {
        const funcStr = func.toString();
        const argMatch = funcStr.match(/\(([^)]*)\)/);
        if (!argMatch) {
            // Handle shorthand functions without parentheses
            return funcStr.match(/=>/g) ? 1 : 0;
        }
        const args = argMatch[1].split(',').filter(arg => arg.trim() !== '');
        return args.length;
    }

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
                        // Store the entire match context, not just the value
                        const parts = currentPath.split('.');
                        let current = result;
                        for (let i = 0; i < parts.length - 1; i++) {
                            current[parts[i]] = current[parts[i]] || {};
                            current = current[parts[i]];
                        }
                        current[parts[parts.length - 1]] = value;
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
            if ('path' in criteria && 'direction' in criteria) {
                // Already normalized format
                return criteria;
            }

            const flattened = flattenPath(criteria);
            for (const [path, direction] of Object.entries(flattened)) {
                if (direction !== 'asc' && direction !== 'desc') {
                    throw new Error(`Invalid sort direction: ${direction}. Must be 'asc' or 'desc'`);
                }
                return { path, direction };
            }
        }

        throw new Error('Invalid sort criteria');
    };

    // Get value from object using either dot notation or nested path
    const getValue = (obj, path) => {
        return path.split('.').reduce((o, i) => {
            return o ? o[i] : undefined;
        }, obj);
    };


    async function setupIndexes(db) {
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

async function searchVectorContent(query, {limit = 5, maxLength = 5000, strategy = "share"} = {}) {
    // Create query embedding
    const queryEmbedding = this.createEmbedding(query);

    // Use the RAGcontent index to get documents efficiently
    const result = await this.find({
        selector: {
            RAGcontent: {$exists: true}
        },
        fields: ['_id', '_rev', 'RAGcontent', 'embedding', 'contentHash']
    });

    // Process results efficiently using Set for deduplication
    const hashes = new Set();
    const results = [];

    for (let doc of result.docs) {
        doc = await doc;
        // Skip duplicates
        if (hashes.has(doc.contentHash)) {
            await this.remove(doc);
            continue;
        }

        // Calculate similarity
        const similarity = this.calculateSimilarity(queryEmbedding, doc.embedding, query.length,doc.RAGcontent.length);
        if (similarity === 0 || !doc.contentHash) {
            continue;
        }

        // Add to results and track hash
        hashes.add(doc.contentHash);
        results.push({
            doc,
            query,
            similarity
        });
    }

    // Sort by similarity and limit results
    let sortedResults = results;
    if (!["first", "last"].includes(strategy)) {
        sortedResults = results.sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    } else {
        // sort based on timestamp oldest first
        sortedResults = results.sort((a, b) => a.doc.timestamp - b.doc.timestamp);
    }


    // Handle maxLength restriction based on strategy
    if (maxLength) {
        if (strategy === "first") {
            let totalLength = 0;
            const finalResults = [];

            for (const result of sortedResults) {
                const newLength = totalLength + result.doc.RAGcontent.length;
                if (newLength > maxLength) {
                    if (finalResults.length > 0) {
                        const lastResult = finalResults[finalResults.length - 1];
                        const overflow = totalLength - maxLength;
                        if (overflow > 0) {
                            lastResult.doc.RAGcontent = lastResult.doc.RAGcontent.slice(0, -overflow);
                        }
                    }
                    break;
                }
                finalResults.push(result);
                totalLength = newLength;
            }
            return finalResults;

        } else if (strategy === "share") {
            const share = Math.floor(maxLength / sortedResults.length);
            return sortedResults.map(result => ({
                ...result,
                doc: {
                    ...result.doc,
                    RAGcontent: result.doc.RAGcontent.slice(0, share)
                }
            }));

        } else if (strategy === "last") {
            let totalLength = 0;
            const finalResults = [];

            for (let i = sortedResults.length - 1; i >= 0; i--) {
                const result = sortedResults[i];
                const newLength = totalLength + result.doc.RAGcontent.length;
                if (newLength > maxLength) {
                    if (finalResults.length > 0) {
                        const firstResult = finalResults[0];
                        const overflow = totalLength - maxLength;
                        if (overflow > 0) {
                            firstResult.doc.RAGcontent = firstResult.doc.RAGcontent.slice(overflow);
                        }
                    }
                    break;
                }
                finalResults.unshift(result);
                totalLength = newLength;
            }
            return finalResults;
        }
    }
}

    // Clear all documents
    async function clearAll() {
        const docs = await this.getAllDocuments();
        return await Promise.all(
            docs.map(doc => this.deleteDocument(doc._id))
        );
    }

    async function clearVectorContent({
                                          startDate = null,
                                          endDate = null,
                                          inclusive = true,
                                          text = null,
                                          useRegex = false
                                      } = {}) {
        // Convert date strings to Date objects if they're provided as strings
        if (startDate && typeof startDate === 'string') {
            startDate = new Date(startDate);
        }
        if (endDate && typeof endDate === 'string') {
            endDate = new Date(endDate);
        }

        // Validate dates if provided
        if (startDate && isNaN(startDate.getTime())) {
            throw new Error('Invalid start date provided');
        }
        if (endDate && isNaN(endDate.getTime())) {
            throw new Error('Invalid end date provided');
        }
        if (startDate && endDate && startDate > endDate) {
            throw new Error('Start date cannot be after end date');
        }

        let docsToRemove;

        if (text !== null) {
            if (useRegex) {
                // Use regex search
                const selector = {
                    RAGcontent: {
                        $exists: true,
                        $regex: new RegExp(text)
                    }
                };

                // Add date criteria if provided
                if (startDate || endDate) {
                    selector.timestamp = {};
                    if (startDate) {
                        selector.timestamp[inclusive ? '$gte' : '$gt'] = startDate.getTime();
                    }
                    if (endDate) {
                        selector.timestamp[inclusive ? '$lte' : '$lt'] = endDate.getTime();
                    }
                }

                docsToRemove = await this.find({
                    selector: selector,
                    fields: ['_id', '_rev']
                });
                docsToRemove = docsToRemove.docs;
            } else {
                // Use vector search
                const searchResults = await this.searchVectorContent(text, {
                    limit: Number.MAX_SAFE_INTEGER // Get all matching documents
                });

                // Filter by date if needed
                docsToRemove = searchResults
                    .map(result => result.doc)
                    .filter(doc => {
                        if (!startDate && !endDate) return true;

                        const docDate = doc.timestamp;
                        if (inclusive) {
                            if (startDate && docDate < startDate.getTime()) return false;
                            if (endDate && docDate > endDate.getTime()) return false;
                        } else {
                            if (startDate && docDate <= startDate.getTime()) return false;
                            if (endDate && docDate >= endDate.getTime()) return false;
                        }
                        return true;
                    });
            }
        } else  {
            const selector = {
                RAGcontent: { $exists: true },
                timestamp: {}
            };
            if (startDate) {
                selector.timestamp[inclusive ? '$gte' : '$gt'] = startDate.getTime();
            }
            if (endDate) {
                selector.timestamp[inclusive ? '$lte' : '$lt'] = endDate.getTime();
            }
            const result = await this.find({
                selector: selector,
                fields: ['_id', '_rev']
            });
            docsToRemove = result.docs;
        }

        // Get total count before deletion
        const totalCount = (await this.find({
            selector: {
                RAGcontent: { $exists: true }
            },
            fields: ['_id']
        })).docs.length;

        // Remove the filtered documents
        const removalResults = await Promise.all(
            docsToRemove.map(doc => this.remove(doc))
        );

        return {
            removedCount: removalResults.length,
            totalCount: totalCount,
            remainingCount: totalCount - removalResults.length,
            searchMethod: text ? (useRegex ? 'regex' : 'vector') : 'date-only'
        };
    }

    function setupLiveObjects(pouchdb, global = false) {
        // Add properties to track class name usage and prototypes
        Object.defineProperties(pouchdb, {
            liveObjects: {
                value: global,
                writable: true,
                configurable: true
            },
            classPrototypes: {
                value: {},
                writable: true,
                configurable: true
            }
        });

        // Create index for  _class_nameif it doesn't exist
        pouchdb.createIndex({
            index: {
                fields: [':.cname']
            }
        }).catch(err => console.error('Error creating :.cname index:', err));

        // Store original functions
        const originalPut = pouchdb.put;
        const originalGet = pouchdb.get;
        const originalFind = pouchdb.find;
        const originalPost = pouchdb.post;

        function keyGen(prefix = '') {
            const timestamp = String(Date.now()).padStart(16, '0');
            const random = Math.random().toString(36).substring(2, 8);
            return `${prefix}${timestamp}${random}`;
        }

        function getKeyTimestamp(key) {
            const timestampPart = key.slice(0, 16);
            return parseInt(timestampPart, 10);
        }

        // Helper function to convert document to class instance
        async function docToInstance(doc) {
            if (!doc) return doc;
            const metadata = doc[":"],
                cname = metadata?.cname;

            if(!cname) return doc;

            let prototype = pouchdb.classPrototypes[cname];

            // If prototype not found in local registry, look in globalThis
            if (!prototype && globalThis[cname]) {
                prototype = globalThis[cname].prototype;
            }

            if (!prototype) return doc;

            // Create new object with the prototype and copy document properties
            let instance = Object.create(prototype);
            Object.assign(instance, deserialize(doc));
            Object.defineProperty(instance, ':', { enumerable:false,configurable:true,writable: true,value: metadata  });
            if(typeof instance.init ==="function") {
                await instance.init();
            }
            return instance;
        }

        function deproxy() {
            if(!this || typeof this !== 'object') return this;
            const result = Array.isArray(this) ? [] : {};
            for(const [key, value] of Object.entries(this)) {
                result[key] = value && typeof value.deproxy === "function" ? value.deproxy() : value;
            }
            return result;
        }


        // Override get function
        let promisedPuts = [];
        pouchdb.get = async function(docId, options = {}) {
            const liveObject = options.liveObject ?? this.liveObjects;
            options = {...options};
            let checkDeleted;
            if(options.rev) {
                options.revs = true;
                checkDeleted = options.rev;
                delete options.rev;
            }
            let doc = await originalGet.call(this, docId, options);
            if(checkDeleted) {
                let generation = parseInt(checkDeleted);
                while(generation<doc._revisions.ids.length+1) {
                    // will throw when it encounters a deleted doc which is what we want
                    await originalGet.call(this, docId, {rev:`${generation}-${doc._revisions.ids[generation-1]}`});
                    generation++;
                }
            }
            doc = await docToInstance(doc);
            if(liveObject) {
                // wrap with a Proxy that will persist changes to the database
                // if persist === "deep" then all nested objects that are not Arrays or just plain Objects will also be wrapped with a Proxy
                // a parentId will be added to the metadata of child objects to track the parent object
                const persist = liveObject.persist;
                const parentId = doc._id;
                const handler = {
                    set(target, prop, value) {
                        if (persist && value && typeof value === "object" && typeof value.deproxy !== "function" && ![Date,Set,Map,RegExp].some(cls => value instanceof cls)) {
                            Object.defineProperty(value,"deproxy",{value:deproxy});
                            target[prop] = new Proxy(value, handler);
                        } else {
                            target[prop] = value;
                        }
                        if(prop[0]!=="_") {
                            promisedPuts.push(pouchdb.put(doc,{force:true,metadata:doc[":"]}));
                        }
                        return true;
                    },
                    deleteProperty(target, prop) {
                        delete target[prop];
                        if(prop[0]!=="_") pouchdb.put(doc,{force:true,metadata:doc[":"]})
                        return true;
                    }
                };
                doc = doc._id[0]==="_" ? doc : new Proxy(doc, handler);
            }
            return doc;
        };

        // Override find function
        pouchdb.find = async function(request = {}) {
            const liveObject = request.liveObject ?? this.liveObjects;
            const result = await originalFind.call(this, request);

            if (liveObject && result.docs) {
                result.docs = result.docs.map(doc => docToInstance(doc));
            }

            return result;
        };

        pouchdb.patch = async function(docId, patches,{createIfMissing = false,...rest}={}) {
            docId = await docId;
            const doc = await this.get(docId).catch((e) => {
                if(createIfMissing) return {_id:docId};
                throw e;
            });
            const patchedDoc = await patch(doc,patches);
            await this.put(patchedDoc,rest);
            return this.get(docId);
        }

        pouchdb.post = async function(doc, {copy,...rest}={}) {
            if(copy) {
                doc = {...doc};
                doc._id = keyGen();
            } else if(!doc._id) {
                doc._id = keyGen();
            }
            return this.put(doc,{...rest});
        }

        // Override put function
        pouchdb.put = async function(doc, options = {}) {
            if(promisedPuts.length > 0) { 
                await Promise.all(promisedPuts); 
                promisedPuts = [];
            }
            if (doc && typeof doc === 'object' && (!doc._id || doc._id[0] !== '_')) {
                const constructorName = doc.constructor.name;
                if(!doc._id) {
                    doc._id = keyGen();
                }
                if (constructorName !== 'Object') {
                    const metadata = doc[":"]||{},
                        proto = Object.getPrototypeOf(doc);
                    Object.assign(metadata, options.metadata);
                    metadata.cname = constructorName;
                    Object.defineProperty(doc,':',{enumerable:true,configurable:true,writable: true,value:metadata});
                    // Store prototype if not already stored
                    if (!this.classPrototypes[constructorName]) {
                        this.classPrototypes[constructorName] = proto;
                    }
                }
                const result = await originalPut.call(this,await toSerializable(await deepCopy(deproxy.call({...doc}))),options);
                Object.defineProperty(doc,':',{enumerable:false,configurable:true,writable: true,value:doc[":"]});
                doc._rev = result.rev;
                return result;
            }
            const {ok,id,rev} = await originalPut.call(this, doc, {...options,force:true});
            doc._id = id;
            doc._rev = rev;
            return {ok,id,rev};
        };

        pouchdb.replace = async function(doc,options={}) {
            const _id = doc._id;
            if(_id) {
                const existing = await this.get(_id,{revs:true});
                if(existing) {
                    existing._deleted = true;
                    const {rev} = await this.put(existing,{...options,force:true});
                    doc._rev = rev;
                    return await this.put(doc,{...options,force:true});
                }
                await this.put(doc,{...options,force:true});
            }
            return this.post(doc,options);
        }

        pouchdb.upsert = async function(doc,{mutate,...rest}={}) {
            doc._id ||= keyGen();
            let target = await this.get(doc._id).catch(() => ({_id:doc._id}));
            if(!target._rev && doc._rev) target._rev = doc._rev;
            await patch(target,doc);
            const {ok,rev,id} = await this.put(target, rest);
            if(mutate) Object.assign(doc,target);
            doc._id = id;
            doc._rev = rev;
            return {ok,rev,id};
        }

        return pouchdb;
    }

    const patch = async (target, patches) => {
        target = await target;
        patches = await patches;
        for(let [key, value] of Object.entries(patches)) {
            if(["_id","_rev"].includes(key)) continue;
            value = await value;
            if(value === undefined) {
                delete target[key];
            } else if(typeof value === 'object' && value !== null && typeof target[key] === 'object') {
                patch(target[key], value);
            } else if(target[key] !== value) {
                target[key] = value;
            }
        }
        return target;
    }

    async function deepCopy(obj) {
        // Handle primitive types and null
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // Handle arrays
        if (Array.isArray(obj) || obj.constructor.name.endsWith("Array")) {
            return obj.map(deepCopy);
        }

        // Handle plain objects
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Recursively copy each property
                result[key] = await deepCopy(await obj[key]);
            }
        }
        return result;
    }

    function diff(obj1, obj2) {
        if(!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
            return obj1;
        }

        const patch = {};

        for(const [key, value] of Object.entries(obj1)) {
            if(!(key in obj2)) {
                patch[key] = value;
            } else if(value instanceof Date && obj2[key] instanceof Date) {
                if(value.getTime() !== obj2[key].getTime()) {
                    patch[key] = value;
                }
            } else if(value instanceof RegExp && obj2[key] instanceof RegExp) {
                if(value.source !== obj2[key].source || value.flags !== obj2[key].flags) {
                    patch[key] = value;
                }
            } else if(value instanceof Set && obj2[key] instanceof Set) {
                if([...value].toString() !== [...obj2[key]].toString()) {
                    patch[key] = value;
                }
            } else if(value instanceof Map && obj2[key] instanceof Map) {
                if([...value.entries()].toString() !== [...obj2[key].entries()].toString()) {
                    patch[key] = value;
                }
            } else if(ArrayBuffer.isView(value) && ArrayBuffer.isView(obj2[key])) {
                if(value.toString() !== obj2[key].toString()) {
                    patch[key] = value;
                }
            } else if(typeof value === 'bigint' && typeof obj2[key] === 'bigint') {
                if(value !== obj2[key]) {
                    patch[key] = value;
                }
            } else if(typeof value === 'symbol' && typeof obj2[key] === 'symbol') {
                if(value.description !== obj2[key].description) {
                    patch[key] = value;
                }
            } else if(typeof value === 'object' && typeof obj2[key] === 'object') {
                const childDiff = diff(value, obj2[key]);
                if(Object.keys(childDiff).length > 0) {
                    patch[key] = childDiff;
                }
            } else if(value !== obj2[key]) {
                patch[key] = value;
            }
        }

        for(const key of Object.keys(obj2)) {
            if(!(key in obj1)) {
                patch[key] = undefined;
            }
        }

        return patch;
    }

    function setupTriggers(pouchdb) {
        // Store triggers in a Map on the database instance
        const _triggers = new Map();
        let _changes = null;

        // Set up changes listener
        function setupChangesListener() {
            if (_changes) {
                _changes.cancel();
            }

            _changes = pouchdb.changes({
                since: 'now',
                live: true
            });

            _changes.on('change', (change) => {
                processTriggers(change);
            });
        }

        // Process triggers based on database changes
        function processTriggers(change) {
            const eventType = change.deleted ? 'delete' : change.changes[0].rev.startsWith('1-') ? 'new' : 'change';

            // Process triggers for both the specific event type and wildcard triggers
            ['*', eventType].forEach(type => {
                if (_triggers.has(type)) {
                    const triggersForType = _triggers.get(type);
                    triggersForType.forEach(async trigger => {
                        const doc = await pouchdb.get(change.id,{revs:true}).catch(() => null);
                        if (doc && matchesFilter(doc, trigger.filter)) {
                            const prevRevId = doc._revisions.ids[1] ? `${parseInt(doc._rev)-1}-${doc._revisions.ids[1]}` : null,
                                prevDoc = prevRevId ? await pouchdb.get(doc._id, { rev: prevRevId }).catch(() => null) : null,
                                patches = diff(prevDoc, doc);
                            Object.defineProperty(doc,"rollback",{value:async () => {
                                if(!doc._revisions.ids[1]) return;
                                return pouchdb.remove(doc._id,{rev: doc._rev});
                            }})
                            trigger.callback.call(pouchdb,eventType, doc, trigger.filter, patches);
                        }
                    });
                }
            });
        }

        // Check if a document matches the provided filter using ChocolateMango query
        function matchesFilter(doc, filter) {
            if (!filter || Object.keys(filter).length === 0) {
                return true;
            }
            return ChocolateMango.query(doc, filter) !== undefined;
        }
            // Create a trigger
        function createTrigger(eventType, filter, callback) {
            const validEventTypes = ['*', 'new', 'change', 'delete'];

            if (!validEventTypes.includes(eventType)) {
                throw new Error(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`);
            }

            if (typeof callback !== 'function') {
                throw new Error('Callback must be a function');
            }

            const triggerId = crypto.randomUUID();
            const triggerData = {
                id: triggerId,
                filter: filter || {},
                callback
            };

            if (!_triggers.has(eventType)) {
                _triggers.set(eventType, new Set());
            }

            _triggers.get(eventType).add(triggerData);
            return triggerId;
        }

        // Remove a trigger by its ID
        function removeTrigger(triggerId) {
            let removed = false;

            _triggers.forEach((triggers) => {
                triggers.forEach((trigger) => {
                    if (trigger.id === triggerId) {
                        triggers.delete(trigger);
                        removed = true;
                    }
                });
            });

            return removed;
        }

        // Clean up triggers and change listener
        function destroyTriggers() {
            if (_changes) {
                _changes.cancel();
                _changes = null;
            }
            _triggers.clear();
        }

        // Add methods to the database instance
        Object.assign(pouchdb, {
            createTrigger,
            removeTrigger,
            destroyTriggers
        });

        // Initialize the changes listener
        setupChangesListener();
    }

    // Main ChocolateMango class
    const ChocolateMango = {
        addPredicate(name, predicateFn) {
            if (typeof name !== 'string' || name[0]!=="$" || typeof predicateFn !== 'function') {
                throw new Error('Predicate must have a string name starting with $ and function implementation');
            }
            this.predicates[name] = predicateFn;
            return this;
        },

        addTransform(name, transformFn) {
            if (typeof name !== 'string' || name[0]!=="$" || typeof transformFn !== 'function') {
                throw new Error('Transform must have a string name starting with $ and function implementation');
            }
            this.transforms[name] = transformFn;
            return this;
        },

        dip(db, { vectors, liveObjects, triggers, embeddingDimesionality=512, embeddingEncoder, predicates={},transforms={} } = {}) {
            if(db.createIndex) setupIndexes(db);
            ChocolateMango.predicates = predicates;
            ChocolateMango.transforms = transforms;

            Object.assign(ChocolateMango.predicates,{
                // Logic Predicates
                $and(a, array, options) { return array.every(pattern => db.query(a, pattern,options)) ? a : undefined },
                $nor(a, array, options) { return !array.some(pattern => db.query(a, pattern, options)) ? a : undefined },
                $not(a, pattern, options) { return !db.query(a, pattern, options) ? a : undefined },
                $or(a, array, options) { return array.some(pattern => db.query(a, pattern, options)) ? a : undefined },
                $elemMatch(a, pattern, options) { return Array.isArray(a) && a.some(value => db.query( value, pattern, options)) ? a : undefined },
            })

            Object.assign(db,ChocolateMango);
            if(liveObjects) {
                setupLiveObjects(db, liveObjects);
            }
            if(triggers) {
                setupTriggers(db, triggers);
            }

            // Store the embeddingEncoder instance on the database
            if (vectors) {
                db.embeddingEncoder = embeddingEncoder || new HangulEmbeddingEncoder(embeddingDimesionality);
                // Create indexes for efficient querying
                db.createIndex({
                    index: {
                        fields: ['RAGcontent']
                    }
                });
            }

            const oldFind = db.find || db.findAll;

            async function find(request) {
                let { selector, transform, filter, order, ...rest } = request;
                if (selector) {
                    selector = normalizeMangoQuery(selector);
                }
                const query = { selector };
                if (!transform && !filter) return oldFind.call(this, { selector, order, ...rest });

                const findResult = await oldFind.call(this, query),
                    transformResult = transform ? this.query(transform, findResult) : findResult,
                    filterResult = filter ? this.query(filter, transformResult) : transformResult,
                    sortedResult = order ? this.sort(filterResult, order) : filterResult;

                return sortedResult;
            }

            db.find = find;

            if (vectors) {
                // Bind methods with the stored embeddingEncoder
                const boundMethods = {
                    generateHash,
                    createEmbedding: (text) => ChocolateMango.createEmbedding(text, db.embeddingEncoder),
                    putVectorContent,
                    removeVectorContent,
                    searchVectorContent,
                    clearVectorContent,
                    calculateSimilarity: (emb1, emb2,text1Length,text2Length) => ChocolateMango.calculateSimilarity(emb1, emb2,text1Length,text2Length,db.embeddingEncoder),
                    clearAll,
                    query: ChocolateMango.query,
                    sort: ChocolateMango.sort
                };

                Object.entries(boundMethods).forEach(([name, value]) => {
                    Object.defineProperty(db, name, {
                        configurable: true,
                        writable: false,
                        value
                    });
                });
            }

            return db;
        },

        createEmbedding(text, encoder = new HangulEmbeddingEncoder(512, false)) {
            if (typeof text !== 'string') {
                text = JSON.stringify(text);
            }
            return encoder.createEmbedding(text);
        },

        calculateSimilarity(embedding1, embedding2, text1Length, text2Length, encoder = new HangulEmbeddingEncoder(512, false)) {
            // Handle old format or missing embeddings
            if (!embedding1 || !embedding2) {
                console.warn('Invalid embeddings provided');
                return 0;
            }
            return encoder.computeSimilarity(embedding1, embedding2,  text1Length, text2Length);
        },

        query(data, pattern, {property, object} = {},recursion=0) {
            // Expand dot notation pattern before processing
            const expandedPattern = expandDotNotation(pattern);

            const array = recursion>0 && Array.isArray(data) ? data : [data];
            const results = array.reduce((results, value, i) => {
                let result;
                for (const key in expandedPattern) {
                    if (this.predicates[key]) {
                        const predicate = this.predicates[key];
                        result = predicate.call(this.predicates,value, expandedPattern[key], {predicate: key, property, object});
                        if(argLength(predicate)===1 && !expandedPattern[key] && result!==undefined) return results;
                    } else if (this.transforms[key]) {
                        result = this.transforms[key](value, expandedPattern[key], {transform: key, property, object});
                        if (object) {
                            if(result===undefined) {
                                if(key==="$drop") {
                                    delete object[property];
                                }
                                continue;
                            } else if(key==="$drop") {
                                continue;
                            } else {
                                object[expandedPattern[key].as || property] = typeof result === "function" ? result(object, property, value) : result;
                            }
                        } else {
                            value = result;
                        }
                    } else if (typeof expandedPattern[key] === 'object') {
                        result = this.query(value[key], expandedPattern[key], {property: key, object: value});
                    } else if (expandedPattern[key] === value[key]) {
                        result = value;
                    }
                    const type = typeof result;
                    if(type==="function") result = result(value, key, object);
                    if(type==="undefined") return results;
                }
                results.push(value);
                return results;
            }, []);
            return recursion>0 && Array.isArray(data) ? results : results[0];
        },

        sort(array, sortCriteria) {
            // Create a copy of the array to avoid modifying the original
            return [...array].sort((a, b) => {
                // Iterate through each sort criteria
                for (const criteria of sortCriteria) {
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
        },

        deserialize(data) {
            return deserialize(data);
        },

        toSerializable(data) {
            return toSerializable(data);
        }
    }

    // Export both as default and named
    export default ChocolateMango;
    export { ChocolateMango };

