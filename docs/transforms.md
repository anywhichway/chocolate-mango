# ChocolateMango Transforms

Transforms are operations that modify document values during query processing. This document details all available transforms and their usage.

## String Transforms

### $capitalize
Capitalizes the first letter of a string.
```javascript
{ name: { $capitalize: { as: 'displayName' } } }
```

### $format
Formats string using template literals.
```javascript
{ 
  user: { 
    $format: { 
      as: 'greeting',
      format: 'Hello, ${name}!',
      values: { title: 'Mr.' }
    } 
  }
}
```

### $join
Joins array elements into string.
```javascript
{ tags: { $join: { as: 'tagList', separator: ', ' } } }
```

### $split
Splits string into array.
```javascript
{ csv: { $split: { as: 'values', separator: ',' } } }
```

## Number Transforms

### $abs
Computes absolute value.
```javascript
{ balance: { $abs: { as: 'absoluteBalance' } } }
```

### $round, $ceil, $floor
Rounds number to nearest integer or up/down.
```javascript
{ price: { $round: { as: 'roundedPrice' } } }
```

### $clamp
Restricts number to range.
```javascript
{ 
  score: { 
    $clamp: { 
      as: 'normalizedScore',
      min: 0,
      max: 100 
    } 
  }
}
```

## Array Transforms

### $chunk
Splits array into smaller arrays.
```javascript
{ items: { $chunk: { as: 'pages', size: 10 } } }
```

### $flatten
Flattens nested array.
```javascript
{ nested: { $flatten: { as: 'flat', depth: 1 } } }
```

### $sort
Sorts array elements.
```javascript
{ 
  scores: { 
    $sort: { 
      as: 'sortedScores',
      compare: (a, b) => b - a 
    } 
  }
}
```

## Math Transforms

### $statistics
Computes statistical measures.
```javascript
{ 
  values: { 
    $statistics: { 
      as: 'stats',
      array: [1, 2, 3, 4, 5] 
    } 
  }
}
```

### $percentile
Calculates percentile value.
```javascript
{
  values: {
    $percentile: {
      as: 'p90',
      array: [1, 2, 3, 4, 5],
      p: 90
    }
  }
}
```

## Date Transforms

### $dateFormat
Formats date using specified pattern.
```javascript
{ 
  created: { 
    $dateFormat: { 
      as: 'formattedDate',
      format: 'YYYY-MM-DD' 
    } 
  }
}
```

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

If the `as` option is not provided, the transform will use the source property name for the output. This means:

```javascript
// These are equivalent:
{ name: { $capitalize: { as: 'name' } } }
{ name: { $capitalize: {} } }
```

Example of a custom transform:

```javascript
ChocolateMango.addTransform('$reverseString', (value, options, context) => {
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