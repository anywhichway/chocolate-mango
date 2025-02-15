function normalizeValue(value) {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string') {
        const timestamp = Date.parse(value);
        return isNaN(timestamp) ? value : timestamp;
    }
    return value;
}

function isPrime(num) {
    if (num <= 1) return false;
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
    }
    return true;
}

function soundex(str) {
    str = str.toUpperCase();
    let result = str[0];
    const codes = {
        'BFPV': '1',
        'CGJKQSXZ': '2',
        'DT': '3',
        'L': '4',
        'MN': '5',
        'R': '6',
        'AEIOUHWY': '0'
    };
    let prevCode = null;

    for (let i = 1; i < str.length; i++) {
        let currentCode = '0';
        for (let key in codes) {
            if (key.includes(str[i])) {
                currentCode = codes[key];
                break;
            }
        }
        if (currentCode !== '0' && currentCode !== prevCode) {
            result += currentCode;
        }
        prevCode = currentCode;
    }
    return result.padEnd(4, '0').slice(0, 4);
}

const predicates = {
    // Array Predicates
    $all(a, array) { return Array.isArray(a) && array.every(value => a.includes(value)) ? a : undefined },
    $disjoint(a, b) { return Array.isArray(a) && Array.isArray(b) && !a.some(value => b.includes(value)) ? a : undefined },
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
    $cname(a, b) {
        if(!a || !b) return;
        const atype = typeof a,
            btype = typeof b;
        if(atype === "object" && btype === "string" && b === a.constructor.name) return a;
        if(atype === "object" && btype === "string" && b === a[":"]?.cname) return a;
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

export default predicates;
export {predicates};
