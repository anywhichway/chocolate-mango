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

export default transforms;
export {transforms}