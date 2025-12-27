# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-12-27 12:54:03 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

Build JavaScript extractors for multiple manga sources to extract manga data (manga lists, chapter pages, etc.) for the xpmanga application.

## Key Features

* JavaScript-based extractors for 50+ manga sources across multiple languages
* Generic testing framework to validate extractor outputs
* Standardized output format for all extractors
* Support for English, Arabic, Bahasa Indonesia, Espanol, Italiano, Viet, Portugues, Russia, France, and Deutsch sources

## Overall Architecture

* `sources/` - Directory containing individual source extractors (one subdirectory per source)
* Each source has: `extract.js` (main extraction logic), `meta.json` (source metadata)
* `debug/` - Testing framework with test scripts and expected outputs
* `all_source.json` - Master list of all source metadata
* Extractors follow a common interface for consistency
