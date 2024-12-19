
    const VALID_MANGO_OPERATORS = new Set([
        '$lt', '$lte', '$eq', '$ne', '$gte', '$gt',
        '$exists', '$type', '$in', '$nin', '$size',
        '$mod', '$regex', '$or', '$and', '$nor', '$not',
        '$all', '$elemMatch'
    ]);

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

    // Soundex implementation function
    function soundex(str) {
        // Convert string to uppercase
        str = str.toUpperCase();

        // Keep first letter
        let result = str[0];

        // Soundex coding rules
        const codes = {
            'BFPV': '1',
            'CGJKQSXZ': '2',
            'DT': '3',
            'L': '4',
            'MN': '5',
            'R': '6',
            'AEIOUHWY': '0'
        };

        // Previous code (initialize as null)
        let prevCode = null;

        // Process remaining characters
        for (let i = 1; i < str.length; i++) {
            let currentCode = '0';

            // Find the code for current character
            for (let key in codes) {
                if (key.includes(str[i])) {
                    currentCode = codes[key];
                    break;
                }
            }

            // Only add code if it's different from previous code
            if (currentCode !== '0' && currentCode !== prevCode) {
                result += currentCode;
            }

            // Update previous code
            prevCode = currentCode;
        }

        // Pad with zeros if necessary
        result = result.padEnd(4, '0');

        // Return first 4 characters
        return result.slice(0, 4);
    }

    // Helper functions
    function isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }

    // Helper function to normalize values to comparable format
    function normalizeValue(value) {
        if (value instanceof Date) return value.getTime();
        if (typeof value === 'string') {
            const timestamp = Date.parse(value);
            return isNaN(timestamp) ? value : timestamp;
        }
        return value;
    }

    // Date formatting tokens
    const dateTokens = {
        // Date
        YYYY: d => d.getFullYear(),
        YY: d => String(d.getFullYear()).slice(-2),
        MM: d => String(d.getMonth() + 1).padStart(2, '0'),
        M: d => d.getMonth() + 1,
        DD: d => String(d.getDate()).padStart(2, '0'),
        D: d => d.getDate(),

        // Day of week
        dddd: d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()],
        ddd: d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        d: d => d.getDay(),

        // Month names
        MMMM: d => ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()],
        MMM: d => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()],

        // Time
        HH: d => String(d.getHours()).padStart(2, '0'),
        H: d => d.getHours(),
        hh: d => String(d.getHours() % 12 || 12).padStart(2, '0'),
        h: d => d.getHours() % 12 || 12,
        mm: d => String(d.getMinutes()).padStart(2, '0'),
        m: d => d.getMinutes(),
        ss: d => String(d.getSeconds()).padStart(2, '0'),
        s: d => d.getSeconds(),
        SSS: d => String(d.getMilliseconds()).padStart(3, '0'),
        a: d => d.getHours() < 12 ? 'am' : 'pm',
        A: d => d.getHours() < 12 ? 'AM' : 'PM'
    }


    const predicates = {
        // Array Predicates
        $all(a, array) { return Array.isArray(a) && array.every(value => a.includes(value)) ? a : undefined },
        $disjoint(a, b) { return Array.isArray(a) && Array.isArray(b) && !a.some(value => b.includes(value)) ? a : undefined },
        $elemMatch(a, pattern, options) { return Array.isArray(a) && a.some(value => query(pattern, value, options)) ? a : undefined },
        $excludes(a, b) { return Array.isArray(a) && Array.isArray(b) && !b.some(value => a.includes(value)) ? a : undefined },
        $includes(a, b) { return Array.isArray(a) && Array.isArray(b) && b.every(value => a.includes(value)) ? a : undefined },
        $intersects(a, b) { return Array.isArray(a) && Array.isArray(b) && a.some(value => b.includes(value)) ? a : undefined },
        $length(a, b) { return (Array.isArray(a) || typeof a === 'string') && a.length === b ? a : undefined },
        $size(a, b) { return Array.isArray(a) && a.length === b ? a : undefined },
        $subset(a, b) { return Array.isArray(a) && Array.isArray(b) && a.every(value => b.includes(value)) ? a : undefined },
        $superset(a, b) { return Array.isArray(a) && Array.isArray(b) && b.every(value => a.includes(value)) ? a : undefined },

        // Comparison Predicates
        $eq(a, b) { return a === b ? a : undefined },
        $gt(a, b) { return a > b ? a : undefined },
        $gte(a, b) { return a >= b ? a : undefined },
        $in(a, b) { return b.includes(a) ? a : undefined },
        $lt(a, b) { return a < b ? a : undefined },
        $lte(a, b) { return a <= b ? a : undefined },
        $ne(a, b) { return a !== b ? a : undefined },
        $nin(a, b) { return !b.includes(a) ? a : undefined },

        // Logic Predicates
        $and(a, array, options) { return array.every(pattern => query(pattern, a, options)) ? a : undefined },
        $nor(a, array, options) { return !array.some(pattern => query(pattern, a, options)) ? a : undefined },
        $not(a, pattern, options) { return !query(pattern, a, options) ? a : undefined },
        $or(a, array, options) { return array.some(pattern => query(pattern, a, options)) ? a : undefined },

        // Number Predicates
        $inRange(a, [min, max, inclusive=true]) {
            return inclusive ?
                (a >= min && a <= max ? a : undefined) :
                (a > min && a < max ? a : undefined)
        },
        $isEven(a) { return a % 2 === 0 ? a : undefined },
        $isFloat(a) { return Number.isFinite(a) && !Number.isInteger(a) ? a : undefined },
        $isInteger(a) { return Number.isInteger(a) ? a : undefined },
        $isNaN(a) { return Number.isNaN(a) ? a : undefined },
        $isOdd(a) { return a % 2 === 1 ? a : undefined },
        $isPrime(a) { return Number.isInteger(a) && isPrime(a) ? a : undefined },
        $mod(a, [b, c]) { return a % b === c ? a : undefined },

        // String Predicates
        $contains(a, b) { return typeof a === 'string' && a.includes(b) ? a : undefined },
        $echoes(a, b) { return soundex(String(a)) === soundex(String(b)) ? a : undefined },
        $endsWith(a, b) { return typeof a === 'string' && a.endsWith(b) ? a : undefined },
        $isAlpha(a) { return /^[a-zA-Z]*$/.test(a) ? a : undefined },
        $isAlphaNum(a) { return /^[a-zA-Z0-9]*$/.test(a) ? a : undefined },
        $isBase64(a) { return /^[a-zA-Z0-9+/]*={0,2}$/.test(a) ? a : undefined },
        $isEmail(a) { return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(a) ? a : undefined },
        $isHex(a) { return /^[0-9a-fA-F]*$/.test(a) ? a : undefined },
        $isIP4(a) { return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(a) ? a : undefined },
        $isIP6(a) { return /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(a) ? a : undefined },
        $isNumeric(a) { return /^\d+$/.test(a) ? a : undefined },
        $isSSN(a) { return /^\d{3}-\d{2}-\d{4}$/.test(a) ? a : undefined },
        $isUSTel(a) { return /^\d{3}-\d{3}-\d{4}$/.test(a) ? a : undefined },
        $isURL(a) { return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(a) ? a : undefined },
        $isUUID(a) { return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(a) ? a : undefined },
        $regex(a, b) { return b.test(a) ? a : undefined },
        $startsWith(a, b) { return typeof a === 'string' && a.startsWith(b) ? a : undefined },


        // Type Predicates
        $exists(a, b) { return a != null ? a : undefined },
        $instanceof(a, b) {
            if(!a || !b) return;
            const atype = typeof a,
                btype = typeof b;
            if(atype === "object" && btype === "object" && a instanceof b) return a;
            if(atype === "object" && btype === "string" && b === a.constructor.name) return a;
        },
        $isDate(a) { return !isNaN(Date.parse(a)) ? a : undefined },
        $isJSON(a) {
            try { JSON.parse(a); return a; }
            catch(e) { return undefined; }
        },
        $isTime(a) { return /^\d{1,2}:\d{2}(:\d{2})?$/.test(a) ? a : undefined },
        $kindof(a, b) {
            if(!a || !b) return;
            const atype = typeof a,
                btype = typeof b;
            if(atype === "object" && btype === "object" && a instanceof b) return a;
            if(atype === "object" && btype === "string" && b === a.constructor.name) return a;
            if(atype === btype) return a;
        },
        $typeof(a, b) { return typeof a === b ? a : undefined },

        // Utility Predicates
        $isAfter(a, b) {
            if (a == null || b == null) return undefined;
            const normalizedA = normalizeValue(a);
            const normalizedB = normalizeValue(b);
            return normalizedA > normalizedB ? a : undefined;
        },

        $isBefore(a, b) {
            if (a == null || b == null) return undefined;
            const normalizedA = normalizeValue(a);
            const normalizedB = normalizeValue(b);
            return normalizedA < normalizedB ? a : undefined;
        },

        $isBetween(a, [start, end, inclusive=false]) {
            if (a == null || start == null || end == null) return undefined;
            const normalizedA = normalizeValue(a);
            const normalizedStart = normalizeValue(start);
            const normalizedEnd = normalizeValue(end);

            return inclusive ?
                (normalizedA >= normalizedStart && normalizedA <= normalizedEnd ? a : undefined) :
                (normalizedA > normalizedStart && normalizedA < normalizedEnd ? a : undefined);
        },
        $test(a, b) { return b(a) ? a : undefined },
    };


    const transforms = {
        // Utility Transforms
        $call(a, {as, f}) { return f(a) },
        $classname(a, {as}) { return a.constructor.name },
        $default(a, {as, value}) { return a==null ? value : a },
        $define(a, {as, enumerable, writable, configurable, value}) {
            value ||= a;
            return (o,key) => {
                Object.defineProperty(o,key,{enumerable,writable,configurable,value});
                return value;
            }
        },
        $entries(a, {as}) { return Object.entries(a) },
        $eval(a, {as}) { return eval(a) },
        $keys(a, {as}) { return Object.keys(a) },
        $parse(a, {as, reviver}) { return JSON.parse(a, reviver) },
        $stringify(a, {as, replacer, space}) { return JSON.stringify(a, replacer, space) },
        $type(a, {as}) { return typeof a },
        $values(a, {as}) { return Object.values(a) },

        // Array Transforms
        $average(a, {as, value, array=[]}) {
            const items = [a,...array];
            if(!isNaN(value)) items.push(value);
            return items.reduce((sum,value,i,array) => sum + value/array.length, 0);
        },
        $chunk(a, {as, size=1}) {
            return Array.isArray(a) ?
                Array.from({ length: Math.ceil(a.length / size) },
                    (_, i) => a.slice(i * size, i * size + size)) :
                undefined;
        },
        $compact(a, {as}) {
            return Array.isArray(a) ? a.filter(x => x != null) : undefined;
        },
        $difference(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
                a.filter(item => !array.includes(item)) : undefined;
        },
        $dot(a, {as, value=0, array=[]}) {
            return [a,value,...array].reduce((dot,value) => dot + value * value, 0);
        },
        $flatten(a, {as, depth}) {
            return Array.isArray(a) ? (typeof depth==="number" ? a.flat(depth) : a.flat()) : undefined;
        },
        $groupBy(a, {as, key}) {
            if (!Array.isArray(a)) return undefined;
            return a.reduce((groups, item) => {
                const group = typeof key === 'function' ? key(item) : item[key];
                (groups[group] = groups[group] || []).push(item);
                return groups;
            }, {});
        },
        $intersection(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
                a.filter(item => array.includes(item)) : undefined;
        },
        $pop(a, {as}) {
            return Array.isArray(a) ? a.pop() : undefined;
        },
        $product(a, {as, value=1, array=[]}) {
            return Array.isArray(a) ?
                a.flatMap(x => [value,...array].map(y => x * y)) :
                undefined;
        },
        $push(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
                [...a,...array] : undefined;
        },
        $setDifference(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
                a.filter(item => !array.includes(array)) : undefined;
        },
        $shift(a, {as}) {
            return Array.isArray(a) ? a.shift() : undefined;
        },
        $slice(a, {as, start=0, end}) {
            return Array.isArray(a) ? a.slice(start,end) : undefined;
        },
        $sort(a, {as, compare}) {
            return Array.isArray(a) ? a.sort(compare) : undefined;
        },
        $splice(a, {as, start, deleteCount, items=[]}) {
            return Array.isArray(a) ? a.splice(start,deleteCount,...items) : undefined;
        },
        $sum(a, {as, value=0, array=[]}) {
            return [a,value,...array].reduce((sum,value) => sum + value, 0);
        },
        $union(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(b) ?
                [...new Set([...a, ...array])] : undefined;
        },
        $unique(a, {as}) {
            return Array.isArray(a) ? [...new Set(a)] : undefined;
        },
        $unshift(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
                [...array,...a] : undefined;
        },

        // String and Type Conversion Transforms
        $capitalize(a, {as}) {
            return typeof a === 'string' ?
                a.charAt(0).toUpperCase() + a.slice(1) : undefined;
        },
        $format(a, {as, format, values={}, precedence='context'}) {
            if (a == null || format == null) return undefined;

            // Convert the format string into a template literal
            const template = format.replace(/\$\{([^}]+)\}/g, '${ctx.$1}');

            // Determine spread order based on precedence
            const baseContext = precedence === 'context' ?
                { ...values, ...a } :    // context overrides values
                { ...a, ...values };     // values override context

            // Create the Proxy handler with both get and has traps
            const proxyHandler = {
                get(target, prop) {
                    return target[prop];
                },
                has(target, prop) {
                    return true;
                }
            };

            // Wrap the context in a Proxy
            const contextProxy = new Proxy(baseContext, proxyHandler);

            // Create the template literal function
            const templateFn = new Function('ctx', `
            with(ctx) {
                try {
                    return \`${template}\`;
                } catch(e) {
                    return undefined;
                }
            }
        `);

            try {
                // Execute template with proxied context
                return templateFn(contextProxy);
            } catch(e) {
                return undefined;
            }
        },
        $join(a, {as, separator=','}) {
            return Array.isArray(a) ? a.join(separator) : undefined;
        },
        $replace(a, {as, pattern, replacement}) {
            return typeof a === 'string' ?
                a.replace(pattern, replacement) : undefined;
        },
        $split(a, {as, separator}) {
            return typeof a === 'string' ? a.split(separator) : undefined;
        },
        $toBoolean(a, {as, truthy=['true', '1', 'yes'], falsy=['false', '0', 'no']}) {
            if (typeof a === 'boolean') return a;
            if (typeof a === 'string') {
                if (truthy.includes(a.toLowerCase())) return true;
                if (falsy.includes(a.toLowerCase())) return false;
            }
            return Boolean(a);
        },
        $toDate(a, {as}) {
            const date = new Date(a);
            return isNaN(date) ? undefined : date;
        },
        $toNumber(a, {as, radix=10}) {
            const num = Number(a);
            return isNaN(num) ? undefined : num;
        },
        $toString(a, {as}) {
            return a != null ? String(a) : undefined;
        },
        $trim(a, {as}) {
            return typeof a === 'string' ? a.trim() : undefined;
        },
        // Math Transforms
        $abs(a, {as}) { return Math.abs(a) },
        $acos(a, {as}) { return Math.acos(a) },
        $acosh(a, {as}) { return Math.acosh(a) },
        $asin(a, {as}) { return Math.asin(a) },
        $asinh(a, {as}) { return Math.asinh(a) },
        $atan(a, {as}) { return Math.atan(a) },
        $atan2(a, {as, b}) { return Math.atan2(a,b) },
        $atanh(a, {as}) { return Math.atanh(a) },
        $cbrt(a, {as}) { return Math.cbrt(a) },
        $ceil(a, {as}) { return Math.ceil(a) },
        $clamp(a, {as, min, max}) {
            return Math.min(Math.max(a, min), max)
        },
        $clz32(a, {as}) { return Math.clz32(a) },
        $cos(a, {as}) { return Math.cos(a) },
        $cosh(a, {as}) { return Math.cosh(a) },
        $exp(a, {as}) { return Math.exp(a) },
        $expm1(a, {as}) { return Math.expm1(a) },
        $floor(a, {as}) { return Math.floor(a) },
        $fround(a, {as}) { return Math.fround(a) },
        $hypot(a, {as, value=0, array=[]}) { return Math.hypot(a,value,...array) },
        $imul(a, {as, value}) { return Math.imul(a,value) },
        $lerp(a, {as, target, alpha}) {
            return a + (target - a) * alpha
        },
        $log(a, {as, value=Math.E}) { return Math.log(a)/Math.log(value) },
        $log10(a, {as}) { return Math.log10(a) },
        $log1p(a, {as}) { return Math.log1p(a) },
        $log2(a, {as}) { return Math.log2(a) },
        $max(a, {as, value, array=[]}) { return Math.max(a,value,...array) },
        $min(a, {as, value, array=[]}) { return Math.min(a,value,...array) },
        $normalize(a, {as, min, max}) {
            return (a - min) / (max - min)
        },
        $percentile(a, {as, array=[], p=50}) {
            const sorted = [...array, a].sort((a, b) => a - b);
            const index = (p/100) * (sorted.length - 1);
            const floor = Math.floor(index);
            const ceil = Math.ceil(index);
            if (floor === ceil) return sorted[floor];
            return sorted[floor] * (ceil - index) + sorted[ceil] * (index - floor);
        },
        $pow(a, {as, value}) { return Math.pow(a,value) },
        $round(a, {as}) { return Math.round(a) },
        $sign(a, {as}) { return Math.sign(a) },
        $sin(a, {as}) { return Math.sin(a) },
        $sinh(a, {as}) { return Math.sinh(a) },
        $sqrt(a, {as}) { return Math.sqrt(a) },
        $statistics(a, {as, array=[]}) {
            const values = [a, ...array].sort((a, b) => a - b);
            const n = values.length;
            const mean = values.reduce((sum, x) => sum + x, 0) / n;
            const median = n % 2 === 0 ?
                (values[n/2 - 1] + values[n/2]) / 2 :
                values[Math.floor(n/2)];
            const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
            const mode = values.reduce((acc, val) => {
                acc.count[val] = (acc.count[val] || 0) + 1;
                if (acc.count[val] > acc.maxCount) {
                    acc.maxCount = acc.count[val];
                    acc.mode = val;
                }
                return acc;
            }, { count: {}, maxCount: 0, mode: values[0] }).mode;

            return {
                mean,
                median,
                mode,
                variance,
                stdDev: Math.sqrt(variance),
                min: values[0],
                max: values[n-1],
                range: values[n-1] - values[0],
                count: n
            };
        },
        $tan(a, {as}) { return Math.tan(a) },
        $tanh(a, {as}) { return Math.tanh(a) },
        $trunc(a, {as}) { return Math.trunc(a) },

        // Date functions
        $dateFormat(a, {as, format='YYYY-MM-DD'}) {
            // Support various input types
            const date = a instanceof Date ? a : new Date(a);

            // Check for invalid date
            if (isNaN(date.getTime())) return undefined;

            // Replace all tokens with their values
            return format.replace(/\b[YMDdhmsaA]+\b/g, token => {
                return dateTokens[token] ? dateTokens[token](date) : token;
            });
        }
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

    // Main ChocolateMango class
    class ChocolateMango {
        static #predicates = { ...predicates };
        static #transforms = { ...transforms };

        static addPredicate(name, predicateFn) {
            if (typeof name !== 'string' || typeof predicateFn !== 'function') {
                throw new Error('Predicate must have a string name and function implementation');
            }
            this.#predicates[name] = predicateFn;
            return this;
        }

        static addTransform(name, transformFn) {
            if (typeof name !== 'string' || typeof transformFn !== 'function') {
                throw new Error('Transform must have a string name and function implementation');
            }
            this.#transforms[name] = transformFn;
            return this;
        }

        static dip(pouchdb, { vectors } = {}) {
            const oldFind = pouchdb.find;

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

            pouchdb.find = find;

            if (vectors) {
                [generateHash, createEmbedding, putVectorContent, removeVectorContent,searchVectorContent, calculateSimilarity, clearAll].forEach(value => {
                    Object.defineProperty(pouchdb, value.name, {configurable:true,writable:false,value})
                })
            }

            return pouchdb;
        }

        static query(data, pattern, {property, object} = {},recursion=0) {
            // Expand dot notation pattern before processing
            const expandedPattern = expandDotNotation(pattern);

            const array = recursion>0 && Array.isArray(data) ? data : [data];
            const results = array.reduce((results, value, i) => {
                let result;
                for (const key in expandedPattern) {
                    if (this.#predicates[key]) {
                        const predicate = this.#predicates[key];
                        result = predicate.call(this.#predicates,value, expandedPattern[key], {transform: key, property, object});
                        if(argLength(predicate)===1 && !expandedPattern[key] && result!==undefined) return results;
                    } else if (this.#transforms[key]) {
                        result = this.#transforms[key](value, expandedPattern[key], {transform: key, property, object});
                        if (object) {
                            if(result !== undefined) object[expandedPattern[key].as || property] = typeof result === "function" ? result(object, property, value) : result;
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
        }

        static sort(array, sortCriteria) {
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
        }
    }

    // Export both as default and named
    export default ChocolateMango;
    export { ChocolateMango };

