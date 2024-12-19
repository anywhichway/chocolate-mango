# ChocolateMango Predicates

Predicates are special operators that can be used in queries to filter documents based on specific conditions. This document lists all available predicates and their usage.

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
Matches array elements meeting all specified criteria.
```javascript
{ scores: { $elemMatch: { $gt: 85, $lt: 95 } } }
```

### $size
Matches arrays of specified length.
```javascript
{ attachments: { $size: 3 } }
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

## String Predicates

### $contains
Matches if string contains substring.
```javascript
{ description: { $contains: 'important' } }
```

### $startsWith, $endsWith
Matches strings with specific prefix/suffix.
```javascript
{ email: { $endsWith: '@company.com' } }
```

### $regex
Matches string against regular expression.
```javascript
{ name: { $regex: /^[A-Z].*/ } }
```

## Type Predicates

### $exists
Matches if field exists.
```javascript
{ phoneNumber: { $exists: true } }
```

### $type
Matches specific JavaScript type.
```javascript
{ value: { $type: 'number' } }
```

### $instanceof
Matches if value is instance of specified constructor.
```javascript
{ date: { $instanceof: Date } }
```

## Validation Predicates

### $isEmail
Validates email format.
```javascript
{ contact: { $isEmail: true } }
```

### $isURL
Validates URL format.
```javascript
{ website: { $isURL: true } }
```

### $isIP4, $isIP6
Validates IP address format.
```javascript
{ serverAddress: { $isIP4: true } }
```

## Logical Predicates

### $and
Matches if all conditions are true.
```javascript
{ $and: [{ age: { $gt: 18 } }, { status: 'active' }] }
```

### $or
Matches if any condition is true.
```javascript
{ $or: [{ type: 'admin' }, { permissions: { $contains: 'write' } }] }
```

### $not
Inverts the result of the specified condition.
```javascript
{ status: { $not: { $eq: 'deleted' } } }
```

## Predicate Implementation Details

All predicates receive three arguments:

1. The value being tested
2. The pattern to test against
3. A context object containing:
    - `transform`: The name of the predicate being applied
    - `property`: The property name being tested
    - `object`: The parent object containing the property

Predicates must return either:
- The value (if the predicate matches)
- `undefined` (if it doesn't match)
- A function (for special property handling)

Example:

```javascript
ChocolateMango.addPredicate('$isZipCode', (value, pattern, context) => {
  // value: The value being tested
  // pattern: The comparison value/pattern
  // context: { transform: '$isZipCode', property: 'zipCode', object: parentObj }
  
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