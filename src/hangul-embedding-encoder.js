import { unicodeName } from "./unicode-name/src/index.js";
import { characterMappings } from "./character-mappings.js";

class HangulEmbeddingEncoder {
    constructor(embeddingDimension = 512) {
        /* Embedding dimension options:
         * 64: Minimum viable size
         *   - Can encode basic Hangul structure (19 initial + 21 medial + 28 final = ~15 bits)
         *   - One CPU word, efficient but limited discrimination
         *
         * 128: Good minimum for production
         *   - Better phonetic discrimination
         *   - Two CPU words, still very efficient
         *
         * 256: Strong balance
         *   - 32 bytes = 8 x 32-bit words
         *   - Great for SIMD operations
         *   - Good separation of similar phonetics
         *
         * 512: Optimal for modern hardware (recommended)
         *   - Exactly one CPU cache line (64 bytes)
         *   - Perfect for AVX-512 instructions
         *   - Optimal hardware acceleration
         *   - Best discrimination/performance balance
         *
         * 1024: Maximum practical size
         *   - Diminishing returns vs computational cost
         *   - Two cache lines, still efficient but overkill
         */
        this.dimension = embeddingDimension;

        Object.assign(this, characterMappings);
        // Extended initial consonants for dimension >= 512
        if (this.dimension >= 512) {
            Object.assign(this.initialConsonants, {
                'ss': '\u110A',  // ㅆ
                'bb': '\u1108',  // ㅃ
                'dd': '\u1104',  // ㄸ
                'gg': '\u1101',  // ㄲ
                'jj': '\u110D',  // ㅉ
            });
            Object.assign(this.vowels, {
                'yya': '\u118E',   // ᆎ
                'yyae': '\u118F',  // ᆏ
                'yyeo': '\u1190',  // ᆐ
                'yye': '\u1191',   // ᆑ
                'yyo': '\u1192',   // ᆒ
                'yyu': '\u1193',   // ᆓ
                'yyi': '\u1194',   // ᆔ
                'araea': '\u119E',  // ᆞ
                'araeae': '\u119F', // ᆟ
            });
            Object.assign(this.finalConsonants, {
                'ks': '\u11AA',    // ㄳ
                'nj': '\u11AC',    // ㄵ
                'nh': '\u11AD',    // ㄶ
                'lk': '\u11B0',    // ㄺ
                'lm': '\u11B1',    // ㄻ
                'lp': '\u11B2',    // ㄼ
                'ls': '\u11B3',    // ㄽ
                'lt': '\u11B4',    // ㄾ
                'lph': '\u11B5',   // ㄿ
                'lh': '\u11B6',    // ㅀ
                'ps': '\u11B9',    // ㅄ
                'ss': '\u11BB',    // ㅆ
                'ng': '\u11BC',    // ㅇ
                'j': '\u11BD',     // ㅈ
                'ch': '\u11BE',    // ㅊ
                'k': '\u11BF',     // ㅋ
                't': '\u11C0',     // ㅌ
                'p': '\u11C1',     // ㅍ
                'h': '\u11C2'      // ㅎ
            });
        }
    }
    replaceSpecial(text) {
        return Array.from(text).map(char => {
            // First check if we have a phonetic equivalent
            if (this.phoneticEquivalents[char]) {
                return this.phoneticEquivalents[char];
            }

            // If no phonetic equivalent, preserve Hangul characters
            if (this.isHangul(char) || /^[a-zA-Z0-9\s]$/.test(char)) {
                return char;
            }

            // Get Unicode name and convert to lowercase, fallback to char if no name found
            const name = unicodeName(char);
            return name ? name.toLowerCase() : char;
        }).join('');
    }

    generateEmbedding(tokenSequence) {
        const embedding = new Float32Array(this.dimension);

        // Enhanced frequency mapping for larger dimensions
        const freqMap = new Map();
        tokenSequence.forEach(value => {
            freqMap.set(value, (freqMap.get(value) || 0) + 1);
        });

        let index = 0;
        for (const [value, freq] of freqMap.entries()) {
            // Primary position based on syllable value
            const primaryPos = value % this.dimension;
            embedding[primaryPos] += freq;

            if (this.dimension >= 512) {
                // Enhanced distribution for larger embedding spaces
                const tertiaryPos = (primaryPos + this.dimension/4) % this.dimension;
                const quaternaryPos = (primaryPos + 3*this.dimension/4) % this.dimension;

                // Secondary positions with refined weighting
                const secondaryPos1 = (primaryPos + this.dimension/3) % this.dimension;
                const secondaryPos2 = (primaryPos + 2*this.dimension/3) % this.dimension;

                embedding[secondaryPos1] += freq * 0.5;
                embedding[secondaryPos2] += freq * 0.25;
                embedding[tertiaryPos] += freq * 0.125;
                embedding[quaternaryPos] += freq * 0.0625;
            } else {
                // Original distribution for smaller dimensions
                const secondaryPos1 = (primaryPos + this.dimension/3) % this.dimension;
                const secondaryPos2 = (primaryPos + 2*this.dimension/3) % this.dimension;
                embedding[secondaryPos1] += freq * 0.5;
                embedding[secondaryPos2] += freq * 0.25;
            }

            index++;
        }

        // L2 normalization
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (norm > 0) {
            for (let i = 0; i < this.dimension; i++) {
                embedding[i] /= norm;
            }
        }

        return embedding;
    }

    isHangul(char) {
        const code = char.charCodeAt(0);
        // Check if character is in Hangul Syllables block (AC00-D7AF)
        return code >= 0xAC00 && code <= 0xD7AF;
    }

    textToHangul(text) {
        // Split on spaces but preserve decimal numbers
        const tokenizer = /(\d*\.\d+|\d+|\S+)/g;
        const matches = text.match(tokenizer) || [];
        let result = '';

        for (let token of matches) {
            // Check if token is entirely Hangul
            if (Array.from(token).every(char => this.isHangul(char))) {
                result += token + ' ';
                continue;
            }

            // Check if token is a number (including decimals)
            if (/^\d+(\.\d+)?$/.test(token)) {
                // Split on decimal point
                const [whole, decimal] = token.split('.');
                // Convert whole number part
                const wholeNum = this.toSinoKorean(parseInt(whole));
                result += wholeNum;

                // Handle decimal part if present
                if (decimal) {
                    result += '점'; // Korean decimal point
                    // Convert each decimal digit individually
                    for (const digit of decimal) {
                        result += this.sinoKoreanNumbers[parseInt(digit)];
                    }
                }
                result += ' ';
                continue;
            }

            token = this.replaceSpecial(token).toLowerCase();

            let i = 0;
            while (i < token.length) {
                let initial = '', medial = '', final = '';

                // Enhanced consonant matching for larger dimensions
                if (this.dimension >= 512) {
                    if (token[i] && token[i + 1] && token[i + 2] &&
                        (token[i] + token[i + 1] + token[i + 2]) in this.initialConsonants) {
                        initial = this.initialConsonants[token[i] + token[i + 1] + token[i + 2]];
                        i += 3;
                    } else if (token[i] && token[i + 1] &&
                        (token[i] + token[i + 1]) in this.initialConsonants) {
                        initial = this.initialConsonants[token[i] + token[i + 1]];
                        i += 2;
                    } else if (token[i] in this.initialConsonants) {
                        initial = this.initialConsonants[token[i]];
                        i++;
                    } else {
                        initial = this.initialConsonants[''];
                    }
                } else {
                    // Original consonant matching for smaller dimensions
                    if (token[i] && token[i + 1] &&
                        (token[i] + token[i + 1]) in this.initialConsonants) {
                        initial = this.initialConsonants[token[i] + token[i + 1]];
                        i += 2;
                    } else if (token[i] in this.initialConsonants) {
                        initial = this.initialConsonants[token[i]];
                        i++;
                    } else {
                        initial = this.initialConsonants[''];
                    }
                }

                // Find vowel with enhanced matching for larger dimensions
                let foundVowel = false;
                const maxVowelLength = this.dimension >= 512 ? 4 : 3;
                for (let len = maxVowelLength; len > 0; len--) {
                    const possible = token.slice(i, i + len);
                    if (possible in this.vowels) {
                        medial = this.vowels[possible];
                        i += len;
                        foundVowel = true;
                        break;
                    }
                }
                if (!foundVowel) {
                    i++;
                    continue;
                }

                // Enhanced final consonant matching for larger dimensions
                if (i < token.length) {
                    if (this.dimension >= 512) {
                        if (token[i] && token[i + 1] && token[i + 2] &&
                            (token[i] + token[i + 1] + token[i + 2]) in this.finalConsonants) {
                            final = this.finalConsonants[token[i] + token[i + 1] + token[i + 2]];
                            i += 3;
                        } else if (token[i] && token[i + 1] &&
                            (token[i] + token[i + 1]) in this.finalConsonants) {
                            final = this.finalConsonants[token[i] + token[i + 1]];
                            i += 2;
                        } else if (token[i] in this.finalConsonants) {
                            final = this.finalConsonants[token[i]];
                            i++;
                        }
                    } else {
                        if (token[i] && token[i + 1] &&
                            (token[i] + token[i + 1]) in this.finalConsonants) {
                            final = this.finalConsonants[token[i] + token[i + 1]];
                            i += 2;
                        } else if (token[i] in this.finalConsonants) {
                            final = this.finalConsonants[token[i]];
                            i++;
                        }
                    }
                }

                result += this.combineHangul(initial, medial, final);
            }
            result += ' ';
        }

        return result.trim();
    }

    toSinoKorean(num) {
        if (num < 0 || !Number.isInteger(num)) {
            throw new Error('Sino-Korean numbers only work for non-negative integers');
        }

        if (num === 0) return this.sinoKoreanNumbers[0];

        const numStr = num.toString();
        let result = '';

        for (let i = 0; i < numStr.length; i++) {
            const digit = parseInt(numStr[i]);
            const place = numStr.length - i;

            if (digit !== 0) {
                result += this.sinoKoreanNumbers[digit];
                switch(place) {
                    case 2: result += '십'; break;   // tens (10)
                    case 3: result += '백'; break;   // hundreds (100)
                    case 4: result += '천'; break;   // thousands (1,000)
                    case 5: result += '만'; break;   // ten thousands (10,000)
                    case 6: result += '십만'; break; // hundred thousands (100,000)
                    case 7: result += '백만'; break; // millions (1,000,000)
                    case 8: result += '천만'; break; // ten millions (10,000,000)
                    case 9: result += '억'; break;   // hundred millions (100,000,000)
                    case 10: result += '십억'; break;// billions (1,000,000,000)
                    case 11: result += '백억'; break;// ten billions (10,000,000,000)
                    case 12: result += '천억'; break;// hundred billions (100,000,000,000)
                    case 13: result += '조'; break;  // trillion (1,000,000,000,000)
                    case 14: result += '십조'; break;// ten trillion (10,000,000,000,000)
                    case 15: result += '백조'; break;// hundred trillion (100,000,000,000,000)
                    case 16: result += '천조'; break;// thousand trillion (1,000,000,000,000,000)
                    case 17: result += '경'; break;  // 10 quadrillion (10,000,000,000,000,000)
                    case 18: result += '십경'; break;// hundred quadrillion (100,000,000,000,000,000)
                    case 19: result += '백경'; break;// thousand quadrillion (1,000,000,000,000,000,000)
                    case 20: result += '천경'; break;// ten thousand quadrillion (10,000,000,000,000,000,000)
                    case 21: result += '자'; break;  // quintillion (100,000,000,000,000,000,000)
                }
            }
        }

        return result;
    }

    combineHangul(initial, medial, final = '') {
        // Unicode formula for combining Hangul jamo
        const initialOffset = initial.charCodeAt(0) - 0x1100;
        const medialOffset = medial.charCodeAt(0) - 0x1161;
        const finalOffset = final ? final.charCodeAt(0) - 0x11A7 : 0;
        return String.fromCharCode(0xAC00 + (initialOffset * 588) + (medialOffset * 28) + finalOffset);
    }



    // Convert Hangul blocks to numeric values
    hangulToNumeric(hangulText) {
        return Array.from(hangulText).map(char => {
            const code = char.charCodeAt(0);
            if (code >= 0xAC00 && code <= 0xD7A3) {
                return code - 0xAC00;
            }
            return 0;
        });
    }

    createEmbedding(text) {
        const hangul = this.textToHangul(text);
        const numeric = this.hangulToNumeric(hangul);
        return this.generateEmbedding(numeric);
    }
    computeSimilarity(embedding1, embedding2, text1Length, text2Length, isQueryDirection = true) {
        if(embedding1 && !embedding2) return 0;
        if(!embedding1 && embedding2) return 0;
        if ((!embedding1 && !embedding2) || embedding1.length !== embedding2.length) {
            throw new Error('Invalid embeddings: Must be equal length Float32Arrays');
        }

        // Base similarity computation
        let similarity = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);

        // Apply direction-aware length penalty
        if (text1Length && text2Length) {
            const lengthRatio = Math.min(text1Length, text2Length) / Math.max(text1Length, text2Length);
            // Stricter penalty (0.5) for short->long, gentler (0.333) for long->short
            const power = text1Length < text2Length && isQueryDirection ? 0.5 : 0.333;
            const penalty = Math.pow(lengthRatio, power);
            similarity *= penalty;
        }

        return similarity;
    }

    calculateEffectiveLength(text) {
        // Each number (including decimals) counts as its digit length
        const tokens = text.match(/(\d*\.\d+|\d+|\S+)/g) || [];
        return tokens.reduce((len, token) => {
            if (/^\d+(\.\d+)?$/.test(token)) {
                // For numbers, use digit count as effective length
                return len + token.replace('.', '').length;
            }
            return len + token.length;
        }, 0);
    }

    searchDocuments(queryEmbedding, documentEmbeddings, {upperBound=1,lowerBound=0}) {
        return documentEmbeddings
            .map((docEmbed, index) => ({
                index,
                similarity: this.computeSimilarity(queryEmbedding, docEmbed)
            }))
            .filter(result => result.similarity >= lowerBound && Math.min(1,result.similarity) <= upperBound)
            .sort((a, b) => b.similarity - a.similarity);
    }
}

export default HangulEmbeddingEncoder;
export { HangulEmbeddingEncoder };