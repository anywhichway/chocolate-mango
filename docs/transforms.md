# ChocolateMango Transforms

ChocolateMango Transforms are operations that modify document values during query processing. This documentation covers all available transforms and their usage.

## Transform Implementation Details

All transforms receive three arguments:

1. The value to transform
2. An options object containing:
   - `as`: Output property name (defaults to source property name if not provided)
   - Any additional transform-specific options
3. A context object containing:
   - `transform`: The name of the transform being applied
   - `property`: The source property name
   - `object`: The parent object containing the property

### Property Name Handling

If the `as` option is not provided, the transform will use the source property name for the output, i.e. it over-writes. This means:

Example of a custom transform:

```javascript
ChocolateMango.addTransform('$reverseString', (value, options, {transform,property,object}) => {
   // value: The value to transform
   // options: { as: 'outputName', ...other options }
   // context: { transform: '$reverseString', property: 'name', object: parentObj }

   return typeof value === 'string' ?
           value.split('').reverse().join('') :
           undefined;
});

// Usage with explicit output property:
{
   name: { $reverseString: { as: 'reversedName' } }
}

// Usage with implicit output property:
{
   name: { $reverseString: {} }  // Will store result in 'name'
}
```

To keep documentation short, the `as` option is omitted in most examples.

## Utility Transforms

### $drop
Removes a value based on a condition.
```javascript
// With function condition
{ value: { $drop: { f: (x) => x > 100 } } }
// With boolean condition
{ value: { $drop: { f: false } } }
```

### $call
Executes a custom function on the value.
```javascript
{ value: { $call: { f: (x) => x * 2 } } }
```

### $classname
Returns the constructor name of an object.
```javascript
{ obj: { $classname: {} } }
```

### $default
Provides a default value if input is null/undefined.
```javascript
{ value: { $default: { value: 0 } } }
```

### $define
Defines a property with specific descriptors.
```javascript
{
  value: {
    $define: {
      enumerable: true,
      writable: true,
      configurable: true
    }
  }
}
```

### $entries, $keys, $values
Object iteration transforms.
```javascript
{ obj: { $entries: {} } }  // Returns [key, value] pairs
{ obj: { $keys: {} } }     // Returns keys
{ obj: { $values: {} } }   // Returns values
```

### $parse, $stringify
JSON parsing and stringification.
```javascript
{ json: { $parse: { reviver: (key, value) => value } } }
{ obj: { $stringify: { space: 2 } } }
```

## Array Operations

### $average
Calculates average of array values.
```javascript
{
  numbers: {
    $average: {
      value: 10,      // Additional value to include
      array: [1,2,3]  // Additional array to include
    }
  }
}
```

### $chunk
Splits array into smaller chunks.
```javascript
{ array: { $chunk: { size: 2 } } }
```

### $compact
Removes null and undefined values.
```javascript
{ array: { $compact: {} } }
```

### $difference, $intersection, $union
Set operations between arrays.
```javascript
{
  array: {
    $difference: { array: [1,2,3] }    // Items in first but not second
  }
}
{
  array: {
    $intersection: { array: [1,2,3] }  // Items in both arrays
  }
}
{
  array: {
    $union: { array: [1,2,3] }         // Unique items from both arrays
  }
}
```

### Array Manipulation
```javascript
{ array: { $pop: {} } }           // Removes and returns last element
{ array: { $shift: {} } }         // Removes and returns first element
{ array: { $push: { array: [1,2] } } }     // Adds elements to end
{ array: { $unshift: { array: [1,2] } } }  // Adds elements to start
```

### $slice
Extracts portion of array.
```javascript
{ array: { $slice: { start: 1, end: 3 } } }
```

### $sort
Sorts array with optional compare function.
```javascript
{
  array: {
    $sort: {
      compare: (a, b) => a - b
    }
  }
}
```

## Mathematical Operations

### Basic Math Functions
```javascript
{ value: { $abs: {} } }      // Absolute value
{ value: { $ceil: {} } }     // Round up
{ value: { $floor: {} } }    // Round down
{ value: { $round: {} } }    // Round to nearest integer
{ value: { $trunc: {} } }    // Integer part
```

### Trigonometric Functions
```javascript
{ angle: { $sin: {} } }
{ angle: { $cos: {} } }
{ angle: { $tan: {} } }
{ value: { $asin: {} } }
{ value: { $acos: {} } }
{ value: { $atan: {} } }
{ values: { $atan2: { b: 1 } } }
```

### Advanced Math
```javascript
{ value: { $pow: { value: 2 } } }     // Power
{ value: { $sqrt: {} } }              // Square root
{ value: { $cbrt: {} } }              // Cube root
{ values: { $hypot: { array: [3,4] } } }  // Hypotenuse

// Logarithmic functions
{ value: { $log: { value: 10 } } }    // Log with custom base
{ value: { $log2: {} } }              // Log base 2
{ value: { $log10: {} } }             // Log base 10
```

### Statistical Functions

#### $statistics
Computes comprehensive statistics.
```javascript
{
  values: {
    $statistics: {
      array: [1,2,3,4,5]  // Additional values to include
    }
  }
}
```
Returns object with:
- mean
- median
- mode
- variance
- stdDev (standard deviation)
- min
- max
- range
- count

#### $percentile
Calculates percentile value.
```javascript
{
  values: {
    $percentile: {
      array: [1,2,3,4,5],
      p: 90  // Percentile (0-100)
    }
  }
}
```

## String Operations

### $format
Template string formatting with context.
```javascript
{
  data: {
    $format: {
      template: "Hello ${name}!",
      values: { name: "World" },
      precedence: 'context'  // 'context' or 'values'
    }
  }
}
```

### $replace
String replacement with pattern.
```javascript
{
  text: {
    $replace: {
      pattern: /old/g,
      replacement: 'new'
    }
  }
}
```

### Text Manipulation
```javascript
{ text: { $capitalize: {} } }  // Capitalize first letter
{ text: { $trim: {} } }       // Remove whitespace
{ text: { $split: { separator: ',' } } }  // Split to array
{ array: { $join: { separator: ', ' } } } // Join to string
```

## Date Operations

### $dateFormat
Formats date using patterns.
```javascript
{
  date: {
    $dateFormat: {
      format: 'YYYY-MM-DD HH:mm:ss'
    }
  }
}
```

Supported format tokens:
- YYYY: Full year
- YY: 2-digit year
- MMMM: Full month name
- MMM: Short month name
- MM: 2-digit month
- M: Month number
- DDDD: Full day name
- DDD: Short day name
- DD: 2-digit day
- D: Day number
- HH: 24-hour (00-23)
- H: 24-hour (0-23)
- hh: 12-hour (01-12)
- h: 12-hour (1-12)
- mm: Minutes (00-59)
- m: Minutes (0-59)
- ss: Seconds (00-59)
- s: Seconds (0-59)
- SSS: Milliseconds
- A: AM/PM
- a: am/pm

## Type Conversion

### $toBoolean
Converts value to boolean.
```javascript
{
  value: {
    $toBoolean: {
      truthy: ['true', '1', 'yes'],
      falsy: ['false', '0', 'no']
    }
  }
}
```

### $toNumber
Converts value to number.
```javascript
{
  value: {
    $toNumber: {
      radix: 10  // For parsing strings with different bases
    }
  }
}
```

### $toString
Converts value to string.
```javascript
{
  value: {
    $toString: {
      allowNull: false  // Whether to convert null values
    }
  }
}
```

### $toDate
Converts value to Date object.
```javascript
{ value: { $toDate: {} } }
```

