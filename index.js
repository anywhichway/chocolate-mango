import {HangulEmbeddingEncoder} from "./src/hangul-embedding-encoder.js";

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
        $elemMatch(a, pattern, options) { return Array.isArray(a) && a.some(value => ChocolateMango.query( value, pattern, options)) ? a : undefined },
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
        $and(a, array, options) { return array.every(pattern => ChocolateMango.query(a, pattern,options)) ? a : undefined },
        $nor(a, array, options) { return !array.some(pattern => ChocolateMango.query(a, pattern, options)) ? a : undefined },
        $not(a, pattern, options) { return !ChocolateMango.query(a, pattern, options) ? a : undefined },
        $or(a, array, options) { return array.some(pattern => ChocolateMango.query(a, pattern, options)) ? a : undefined },

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
        $isAlpha(a) { return typeof a === "string" && /^[a-zA-Z]*$/.test(a) ? a : undefined },
        $isAlphaNum(a) { return a!=null && (typeof a === "number" || /^[a-zA-Z0-9]*$/.test(a)) ? a : undefined },
        $isBase64(a) { return /^[a-zA-Z0-9+/=]{4,}([a-zA-Z0-9+/=]{4})*={0,2}$/.test(a) ? a : undefined },
        $isEmail(a) { return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(a) ? a : undefined },
        $isHex(a) { return typeof a === "string" && /^[0-9a-fA-F]*$/.test(a) ? a : undefined },
        $isIP4(a) {
            const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
            const match = ipRegex.exec(a);
            if (match) {
                return match.slice(1).every(component => {
                    const num = parseInt(component, 10);
                    return num >= 0 && num <= 255;
                }) ? a : undefined;
            }
            return undefined;
        },
        $isIP6(a) {
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
            const ipv6AbbrevRegex = /^([0-9a-fA-F]{1,4}:){1,7}:$/; // Abbreviated IPv6
            const ipv6MixedRegex = /^([0-9a-fA-F]{1,4}:){6}(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/; // Mixed IPv6
            return (ipv6Regex.test(a) || ipv6AbbrevRegex.test(a) || ipv6MixedRegex.test(a)) ? a : undefined;
        },
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
            if(atype === "object" && btype === "function" && a instanceof b) return a;
            if(atype === "object" && btype === "string" && b === a.constructor.name) return a;
        },
        $isDate(a) {
            const type = typeof a;
            if(a && type==="object" && a instanceof Date) return a;
            if(type==="string" && !isNaN(Date.parse(a))) return a;
        },
        $isJSON(a) {
            try { JSON.parse(a); return a; }
            catch(e) { return undefined; }
        },
        $isTime(a) { return /^\d{1,2}:\d{2}(:\d{2})?$/.test(a) ? a : undefined },
        $kindof(a, b) {
            if(!a || !b) return;
            const atype = typeof a,
                btype = typeof b;
            if(atype === "object" && btype === "function" && a instanceof b) return a;
            if(atype === "object" && btype === "string" && b === a.constructor.name) return a;
            if(atype === b && btype==="string") return a;
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
        $drop(a,f,...rest) { return typeof f === "function" ? (f(a,...rest) ? undefined : true): (f ? undefined : a) },
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
        $parse(a, {as, reviver}) { try { return JSON.parse(a, reviver); } catch(e) { undefined; } },
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
        $flatten(a, {as, depth=Infinity}) {
            return Array.isArray(a) ? a.flat(depth) : undefined;
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
                [...a.map(x => x * value), ...a.flatMap(x => array.map(y => x * y))] :
                undefined;
        },
        $push(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
                [...a,...array] : undefined;
        },
        $setDifference(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
                a.filter(item => !array.includes(item)) : undefined;
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
            if(Array.isArray(a)) {
                a.splice(start,deleteCount,...items);
                return a;
            }
        },
        $sum(a, {as, value=0, array=[]}) {
            return [a,value,...array].reduce((sum,value) => sum + value, 0);
        },
        $union(a, {as, array}) {
            return Array.isArray(a) && Array.isArray(array) ?
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
        $format(a, {as, template, values={}, precedence='context'}) {
            if (a == null || template == null) return undefined;

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
        $toString(a, {as,allowNull}) {
            return a != null || allowNull ? String(a) : undefined;
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

            // Make replacements from a map of exact tokens
            return format
                .split(/(\bYYYY\b|\bYY\b|\bMMMM\b|\bMMM\b|\bMM\b|\bM\b|\bDDDD\b|\bDDD\b|\bDD\b|\bD\b|\bHH\b|\bH\b|\bhh\b|\bh\b|\bmm\b|\bm\b|\bss\b|\bs\b|\bSSS\b|\bA\b|\ba\b)/)
                .map(token => dateTokens[token] ? dateTokens[token](date) : token)
                .join('');
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

    for (const doc of result.docs) {
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

        // Helper function to convert document to class instance
        function docToInstance(doc) {
            const metadata = doc[":"];
            if (!doc || !metadata) return doc;

            let prototype = pouchdb.classPrototypes[metadata.cname];

            // If prototype not found in local registry, look in globalThis
            if (!prototype && globalThis[metadata.cname]) {
                prototype = globalThis[metadata.cname].prototype;
                // Cache the prototype for future use
                pouchdb.classPrototypes[metadata.cname] = prototype;
            }

            if (!prototype) return doc;

            // Create new object with the prototype and copy document properties
            const instance = Object.create(prototype);
            Object.assign(instance, doc);
            Object.defineProperty(instance, ':', { enumerable:false,configirable:false,writable: true,value: metadata  });
            return instance;
        }

        // Override put function
        pouchdb.put = async function(doc, options = {}) {
            const liveObject = options.liveObject ?? this.liveObjects;

            if (liveObject && doc && typeof doc === 'object') {
                const constructorName = doc.constructor.name;
                if (constructorName !== 'Object') {
                    const metadata = doc[":"]||{},
                        proto = Object.getPrototypeOf(doc);
                    Object.assign(metadata, options.metadata);
                    metadata.cname = constructorName;
                    doc = { ...doc };
                    doc[":"] = metadata;
                    // Store prototype if not already stored
                    if (!this.classPrototypes[constructorName]) {
                        this.classPrototypes[constructorName] = proto;
                    }
                }
            }

            return originalPut.call(this, doc, options);
        };
        let PUTS = [];
        // Override get function
        pouchdb.get = async function(docId, options = {}) {
            const liveObject = options.liveObject ?? this.liveObjects;
            let doc = await originalGet.call(this, docId, options);

            if (liveObject) {
                doc = docToInstance(doc);
                if(liveObject) {
                    // wrap with a Proxy that will persist changes to the database
                    // if persist === "deep" then all nested objects that are not Arrays or just plain Objects will also be wrapped with a Proxy
                    // a parentId will be added to the metadata of child objects to track the parent object
                    const persist = liveObject.persist;
                    const parentId = doc._id;
                    const handler = {
                        set(target, prop, value) {
                            target[prop] = value;
                            if (persist && value && typeof value === "object" && ![Date,Set,Map,RegExp].some(cls => value instanceof cls)) {
                                target[prop] = new Proxy(value, handler);
                            }
                            if(prop[0]!=="_") pouchdb.put(doc,{force:true,metadata:doc[":"]})
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

        return pouchdb;
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
                live: true,
                include_docs: true
            });

            _changes.on('change', (change) => {
                processTriggers(change);
            });
        }

        // Process triggers based on database changes
        function processTriggers(change) {
            const eventType = change.deleted ? 'delete' : change.doc._rev.startsWith('1-') ? 'new' : 'change';

            // Process triggers for both the specific event type and wildcard triggers
            ['*', eventType].forEach(type => {
                if (_triggers.has(type)) {
                    const triggersForType = _triggers.get(type);
                    triggersForType.forEach(trigger => {
                        if (matchesFilter(change.doc, trigger.filter)) {
                            trigger.callback.call(pouchdb,eventType, change.doc, trigger.filter);
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
    class ChocolateMango {
        static addPredicate(name, predicateFn) {
            if (typeof name !== 'string' || name[0]!=="$" || typeof predicateFn !== 'function') {
                throw new Error('Predicate must have a string name starting with $ and function implementation');
            }
            predicates[name] = predicateFn;
            return this;
        }

        static addTransform(name, transformFn) {
            if (typeof name !== 'string' || name[0]!=="$" || typeof transformFn !== 'function') {
                throw new Error('Transform must have a string name starting with $ and function implementation');
            }
           transforms[name] = transformFn;
            return this;
        }

        static dip(pouchdb, { vectors, liveObjects, triggers, embeddingDimesionality=512, embeddingEncoder } = {}) {
            setupIndexes(pouchdb);
            if(liveObjects) {
                setupLiveObjects(pouchdb, liveObjects);
            }
            if(triggers) {
                setupTriggers(pouchdb, triggers);
            }

            // Store the embeddingEncoder instance on the database
            if (vectors) {
                pouchdb.embeddingEncoder = embeddingEncoder || new HangulEmbeddingEncoder(embeddingDimesionality);
                // Create indexes for efficient querying
                pouchdb.createIndex({
                    index: {
                        fields: ['RAGcontent']
                    }
                });
            }

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
                // Bind methods with the stored embeddingEncoder
                const boundMethods = {
                    generateHash,
                    createEmbedding: (text) => ChocolateMango.createEmbedding(text, pouchdb.embeddingEncoder),
                    putVectorContent,
                    removeVectorContent,
                    searchVectorContent,
                    clearVectorContent,
                    calculateSimilarity: (emb1, emb2,text1Length,text2Length) => ChocolateMango.calculateSimilarity(emb1, emb2,text1Length,text2Length,pouchdb.embeddingEncoder),
                    clearAll,
                    query: ChocolateMango.query,
                    sort: ChocolateMango.sort
                };

                Object.entries(boundMethods).forEach(([name, value]) => {
                    Object.defineProperty(pouchdb, name, {
                        configurable: true,
                        writable: false,
                        value
                    });
                });
            }

            return pouchdb;
        }

        static createEmbedding(text, encoder = new HangulEmbeddingEncoder(512, false)) {
            if (typeof text !== 'string') {
                text = JSON.stringify(text);
            }
            return encoder.createEmbedding(text);
        }

        static calculateSimilarity(embedding1, embedding2, text1Length, text2Length, encoder = new HangulEmbeddingEncoder(512, false)) {
            // Handle old format or missing embeddings
            if (!embedding1 || !embedding2) {
                console.warn('Invalid embeddings provided');
                return 0;
            }
            return encoder.computeSimilarity(embedding1, embedding2,  text1Length, text2Length);
        }

        static query(data, pattern, {property, object} = {},recursion=0) {
            // Expand dot notation pattern before processing
            const expandedPattern = expandDotNotation(pattern);

            const array = recursion>0 && Array.isArray(data) ? data : [data];
            const results = array.reduce((results, value, i) => {
                let result;
                for (const key in expandedPattern) {
                    if (predicates[key]) {
                        const predicate = predicates[key];
                        result = predicate.call(predicates,value, expandedPattern[key], {predicate: key, property, object});
                        if(argLength(predicate)===1 && !expandedPattern[key] && result!==undefined) return results;
                    } else if (transforms[key]) {
                        result = transforms[key](value, expandedPattern[key], {transform: key, property, object});
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

