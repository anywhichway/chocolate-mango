# ChocolateMango Predicates

Predicates are special operators that filter documents based on specific conditions. This documentation covers all available predicates and their usage.

## Predicate Implementation Details

All predicates receive three arguments:

1. The value being tested
2. The pattern to test against
3. A context object (when used with ChocolateMango.query) containing:
   - `predicate`: The name of the predicate being applied
   - `property`: The property name being tested
   - `object`: The parent object containing the property

Predicates must return either:
- The value being tested (if the predicate matches)
- `undefined` (if it doesn't match)

Example of adding a custom predicate:

```javascript
ChocolateMango.addPredicate('$isZipCode', (value, pattern, {predicate,property,object}) => {
   const isValid = /^\d{5}(-\d{4})?$/.test(value);
   return isValid ? value : undefined;
});

// Usage:
{
   address: {
      zipCode: { $isZipCode: true }
   }
}
```


## Array Predicates

### $all
Matches if array contains all specified elements.
```javascript
{ tags: { $all: ['javascript', 'database'] } }
```

### $disjoint
Matches if arrays have no common elements.
```javascript
{ interests: { $disjoint: ['sports', 'music'] } }
```

### $elemMatch
Matches array elements meeting specified criteria.
```javascript
{ scores: { $elemMatch: { $gt: 85, $lt: 95 } } }
```

### $excludes
Matches if array excludes all specified elements.
```javascript
{ tags: { $excludes: ['private', 'draft'] } }
```

### $includes
Matches if array includes all specified elements.
```javascript
{ categories: { $includes: ['featured', 'published'] } }
```

### $intersects
Matches if arrays have at least one common element.
```javascript
{ roles: { $intersects: ['admin', 'moderator'] } }
```

### $length, $size
Matches arrays or strings of specified length.
```javascript
{ attachments: { $size: 3 } }     // Arrays only
{ code: { $length: 6 } }          // Arrays or strings
```

### $subset, $superset
Set relationship predicates.
```javascript
{ permissions: { $subset: ['read', 'write', 'delete'] } }   // All elements must be in target
{ access: { $superset: ['guest', 'user'] } }                // Must contain all target elements
```

## Comparison Predicates

### $eq, $ne
Equal/Not equal comparison.
```javascript
{ status: { $eq: 'active' } }
{ category: { $ne: 'archived' } }
```

### $gt, $gte, $lt, $lte
Numeric comparisons.
```javascript
{ age: { $gt: 21 } }
{ price: { $lte: 100 } }
```

### $in, $nin
Match/Don't match any value in array.
```javascript
{ type: { $in: ['user', 'admin'] } }
{ status: { $nin: ['deleted', 'suspended'] } }
```

## Number Predicates

### $inRange
Checks if number is within range.
```javascript
{ score: { $inRange: [0, 100, true] } }  // inclusive range
{ value: { $inRange: [0, 1, false] } }   // exclusive range
```

### Number Type Checks
```javascript
{ value: { $isEven: true } }    // Check if even
{ value: { $isOdd: true } }     // Check if odd
{ value: { $isFloat: true } }   // Check if floating point
{ value: { $isInteger: true } } // Check if integer
{ value: { $isNaN: true } }     // Check if NaN
{ value: { $isPrime: true } }   // Check if prime number
```

### $mod
Matches numbers with specific modulo.
```javascript
{ value: { $mod: [4, 0] } }  // Divisible by 4
```

## String Predicates

### Text Content
```javascript
{ text: { $contains: 'keyword' } }       // Contains substring
{ word: { $startsWith: 'pre' } }         // Starts with prefix
{ file: { $endsWith: '.pdf' } }          // Ends with suffix
{ text: { $regex: /pattern/ } }          // Matches regex
{ word1: { $echoes: 'word2' } }         // Matches phonetically
```

### String Validation
```javascript
{ text: { $isAlpha: true } }            // Only letters
{ text: { $isAlphaNum: true } }         // Letters and numbers
{ text: { $isBase64: true } }           // Valid Base64
{ text: { $isHex: true } }              // Hexadecimal string
{ text: { $isNumeric: true } }          // Only numbers
```

### Format Validation
```javascript
{ email: { $isEmail: true } }           // Email format
{ ip: { $isIP4: true } }                // IPv4 address
{ ip: { $isIP6: true } }                // IPv6 address
{ phone: { $isUSTel: true } }           // US phone format
{ url: { $isURL: true } }               // URL format
{ id: { $isUUID: true } }               // UUID format
{ ssn: { $isSSN: true } }               // SSN format
{ time: { $isTime: true } }             // Time format (HH:MM[:SS])
```

## Type Predicates

### Basic Type Checks
```javascript
{ field: { $exists: true } }               // Field exists
{ value: { $typeof: 'string' } }           // Type check
{ obj: { $instanceof: 'ClassName' } }       // Instance check
{ value: { $kindof: 'type' } }             // Combined type/instance check
```

### Special Types
```javascript
{ date: { $isDate: true } }                // Valid date
{ text: { $isJSON: true } }                // Valid JSON
```

## Utility Predicates

### Date/Time Comparisons
```javascript
{ date: { $isAfter: '2023-01-01' } }       // After date
{ date: { $isBefore: '2024-01-01' } }      // Before date
{ date: { $isBetween: ['2023-01-01', '2024-01-01', true] } }  // Between dates
```

### Custom Testing
```javascript
{ value: { $test: (x) => x > 0 && x < 100 } }  // Custom test function
```

## Logical Predicates

### $and
Matches if all conditions are true.
```javascript
{ 
  $and: [
    { age: { $gt: 18 } },
    { status: 'active' }
  ] 
}
```

### $or
Matches if any condition is true.
```javascript
{ 
  $or: [
    { type: 'admin' },
    { permissions: { $contains: 'write' } }
  ] 
}
```

### $not
Inverts the result of the specified condition.
```javascript
{ status: { $not: { $eq: 'deleted' } } }
```

### $nor
Matches if none of the conditions are true.
```javascript
{
  $nor: [
    { status: 'deleted' },
    { status: 'archived' }
  ]
}
```
