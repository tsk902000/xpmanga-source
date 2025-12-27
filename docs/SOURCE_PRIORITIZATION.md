# Source Implementation Prioritization

This document outlines the prioritization strategy for implementing extractors for 50+ manga sources.

## Priority Tiers

### Tier 1: Reference Sources (Already Implemented)
These sources serve as reference implementations.

| Source | Status | Notes |
|--------|--------|-------|
| mangakakalot | ✅ Complete | v1.6.0 - Full-featured with multiple format support |
| mangapark | ✅ Complete | v1.0.0 - JSON-based image extraction |

### Tier 2: High Priority (Popular English Sources)
These are popular English manga sources with large user bases.

| Source | Priority | Estimated Complexity | Notes |
|--------|----------|---------------------|-------|
| mangadex-dn | 1 | Medium | MangaDex is very popular, likely has API or structured HTML |
| mangasee | 2 | Medium | Popular source, well-structured site |
| batoto | 3 | Medium | Established manga reader site |
| mangabuddy | 4 | Low | Modern site, likely good structure |
| mangahub | 5 | Low | Similar to other modern manga sites |
| mangahere | 6 | Medium | Older site, may have legacy formats |
| mangafox | 7 | Medium | Older site, may have legacy formats |
| readmangatoday | 8 | Low | Simpler site structure |
| mangahasu | 9 | Low | Less complex site |
| comicFree | 10 | Low | Comic-focused site |
| comicsonline | 11 | Low | Comic-focused site |
| kissmanga | 12 | Medium | Popular site, may have anti-scraping |
| topmanhua | 13 | Low | Manhua-focused site |
| 9manga | 14 | Low | Multi-language support |
| muctau | 15 | Low | Simpler site |
| mangareader | 16 | Low | Classic manga reader |

### Tier 3: Medium Priority (Non-English Popular Sources)
Popular sources in other languages.

| Language | Source | Priority | Notes |
|----------|---------|----------|-------|
| 18+ | manytoon | 1 | Adult content site |
| Arabic | mangalink | 1 | Popular Arabic source |
| Arabic | mangalek | 2 | Arabic manga site |
| Arabic | mangadex-ar | 3 | Arabic MangaDex mirror |
| Arabic | mangaaction | 4 | Arabic manga site |
| Arabic | arabmanga | 5 | Arabic manga site |
| Bahasa Indonesia | komikid | 1 | Popular Indonesian source |
| Bahasa Indonesia | pecintakomik | 2 | Indonesian manga site |
| Espanol | mangadex-es | 1 | Spanish MangaDex mirror |
| Espanol | 9manga_es | 2 | Spanish 9manga |
| Espanol | submanga | 3 | Spanish manga site |
| Espanol | tumangaonline | 4 | Spanish manga site |
| Espanol | mangadoor | 5 | Spanish manga site |
| Italiano | mangadex-it | 1 | Italian MangaDex mirror |
| Italiano | 9manga-it | 2 | Italian 9manga |
| Italiano | mangaeden-it | 3 | Italian manga site |
| Viet | blogtruyen | 1 | Popular Vietnamese source |

### Tier 4: Low Priority (Portugues, Russia, France, Deutsch)
Less popular sources or regions with fewer users.

| Language | Source | Priority | Notes |
|----------|---------|----------|-------|
| Portugues | mangahost | 1 | Portuguese manga host |
| Portugues | lermanga | 2 | Portuguese manga reader |
| Portugues | union | 3 | Portuguese manga site |
| Portugues | mangadex-prc | 4 | Portuguese MangaDex mirror |
| Portugues | supermanga | 5 | Portuguese manga site |
| Portugues | livre | 6 | Portuguese manga site |
| Portugues | centralde | 7 | Portuguese manga site |
| Portugues | goldenmanga | 8 | Portuguese manga site |
| Portugues | 9manga-prc | 9 | Portuguese 9manga |
| Russia | mangachan | 1 | Russian manga site |
| Russia | mangadex-ru | 2 | Russian MangaDex mirror |
| Russia | mangapoisk | 3 | Russian manga search |
| Russia | yagami | 4 | Russian manga site |
| France | mangadex-fr | 1 | French MangaDex mirror |
| France | mangakawaii | 2 | French manga site |
| France | japscan | 3 | French manga site |
| Deutsch | wiemanga | 1 | German manga site |
| Deutsch | mangadex-de | 2 | German MangaDex mirror |
| Deutsch | 9manga-ge | 3 | German 9manga |

## Implementation Order

### Phase 1: High Priority English Sources (Tier 2)
1. mangadex-dn
2. mangasee
3. batoto
4. mangabuddy
5. mangahub
6. mangahere
7. mangafox
8. readmangatoday
9. mangahasu
10. comicFree
11. comicsonline
12. kissmanga
13. topmanhua
14. 9manga
15. muctau
16. mangareader

### Phase 2: Popular Non-English Sources (Tier 3)
1. manytoon (18+)
2. mangalink (Arabic)
3. komikid (Bahasa Indonesia)
4. mangadex-es (Espanol)
5. blogtruyen (Viet)
6. mangadex-it (Italiano)
7. mangadex-ar (Arabic)
8. mangadex-prc (Portugues)
9. mangadex-ru (Russia)
10. mangadex-fr (France)
11. mangadex-de (Deutsch)

### Phase 3: Remaining Sources (Tier 3 & 4)
Implement remaining sources in order of priority within each language group.

## Complexity Assessment

### Low Complexity
- Modern, well-structured sites
- Clean HTML with clear class names
- No JavaScript-rendered content
- No anti-scraping measures

### Medium Complexity
- Sites with multiple layout formats
- Some JavaScript rendering
- Basic anti-scraping (rate limiting)
- May need fallback parsing methods

### High Complexity
- Heavy JavaScript rendering
- Strong anti-scraping measures (CAPTCHA, IP blocking)
- Obfuscated HTML
- Requires authentication

## Notes

- **MangaDex mirrors** (mangadex-dn, mangadex-ar, mangadex-es, etc.) likely share similar structure - implement one and adapt for others
- **9manga variants** (9manga, 9manga_es, 9manga-it, 9manga-prc, 9manga-ge) likely share similar structure
- Sites with **"manga" in name** often have similar structures to existing implementations
- **18+ sites** may have additional requirements (age verification, different content structure)

## Testing Strategy

For each source:
1. Create source directory and files
2. Implement extract.js following template
3. Create meta.json
4. Run test script: `node debug/test_generic_extractor.js`
5. Verify output matches expected format
6. Test with real URLs if needed
7. Update all_source.json with metadata URL
