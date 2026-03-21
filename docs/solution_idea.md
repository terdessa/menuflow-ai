# Solution Idea

## Overview

MenuFlow AI is a mobile-first experience where a user takes a photo of a restaurant menu and receives an enriched explanation of each dish. Instead of only translating menu text, the system interprets dish names in context and returns plain-language descriptions, likely ingredients, possible allergens, price conversion, and an AI-generated visual preview to help the user decide with confidence.

## Product Direction

- Core concept: Turn menu photos into understandable, decision-ready dish cards.
- Main user workflow: Capture menu photo, extract menu items, enrich each dish with AI context, then browse results before ordering.
- Key differentiator: Combine translation, culinary explanation, dietary guidance, price conversion, and generated visual previews in one flow.

## Key Features

- Menu photo upload and OCR extraction.
- Dish-by-dish explanation with likely ingredients and possible allergens.
- Price conversion and AI-generated food preview for each item.

## Assumptions

- Users are willing to take a photo rather than type menu items manually.
- High-level dish interpretation is still valuable even when some ingredients must be inferred.
- Visual previews help reduce uncertainty and improve trust in the recommendation.

## Risks

- Ingredient and allergen inference may be imperfect for regional or highly customized dishes.
- AI-generated images may create expectations that differ from the actual restaurant presentation.
- Poor photo quality or unusual menu layouts may reduce OCR and extraction accuracy.

## Open Questions

- Should the first version support one user-selected home currency or auto-detect it?
- How should the product communicate uncertainty for inferred ingredients and allergens?
- Should results be shown as a full scanned menu view, a card list, or both?
