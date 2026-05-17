# IFCT 2017 Food Index

Status: review artifact only; do not seed production tables from this file until source-rights approval and nutrient-field validation are complete.

## Source And Trust Notes

- Source PDF used for this extraction: `IFCT2017.pdf`
- Table 1 contains 528 core food rows across groups A-S.
- Group T adds 14 edible oils and fats in Table 12, so the extended source index contains 542 rows.
- The PDF front matter says the publication cannot be electronically stored or reproduced for product creation without prior permission from NIN; treat this file as internal review material until licensing is resolved.
- Extraction keeps official IFCT labels and codes separate from any future DFit canonical names, aliases, recipes, or portion conversions.

## Validation

- Core Table 1 rows: 528
- Extended source rows including Table 12 oils/fats: 542
- Unique IFCT codes: 542
- Rows flagged for visual review: 1

| Group | Name                           | Scope                    | Rows |
| ----- | ------------------------------ | ------------------------ | ---: |
| A     | Cereals and Millets            | core_table_1             |   24 |
| B     | Grain Legumes                  | core_table_1             |   25 |
| C     | Green Leafy Vegetables         | core_table_1             |   34 |
| D     | Other Vegetables               | core_table_1             |   78 |
| E     | Fruits                         | core_table_1             |   68 |
| F     | Roots and Tubers               | core_table_1             |   19 |
| G     | Condiments and Spices          | core_table_1             |   33 |
| H     | Nuts and Oil Seeds             | core_table_1             |   21 |
| I     | Sugars                         | core_table_1             |    2 |
| J     | Mushrooms                      | core_table_1             |    4 |
| K     | Miscellaneous Foods            | core_table_1             |    2 |
| L     | Milk and Milk Products         | core_table_1             |    4 |
| M     | Egg and Egg Products           | core_table_1             |   15 |
| N     | Poultry                        | core_table_1             |   19 |
| O     | Animal Meat                    | core_table_1             |   63 |
| P     | Marine Fish                    | core_table_1             |   92 |
| Q     | Marine Shellfish               | core_table_1             |    8 |
| R     | Marine Mollusks                | core_table_1             |    7 |
| S     | Fresh Water Fish and Shellfish | core_table_1             |   10 |
| T     | Edible Oils and Fats           | fatty_acid_table_12_only |   14 |

## Rows Needing Visual Review

| Code | Label                                        | Note                                                          |
| ---- | -------------------------------------------- | ------------------------------------------------------------- |
| D075 | Tomato, ripe, hybrid ((Solanum lycopersicum) | Source label contains doubled opening parenthesis in the PDF. |

## A. Cereals and Millets

| Code | Official label                                  | Source table |
| ---- | ----------------------------------------------- | ------------ |
| A001 | Amaranth seed, black (Amaranthus cruentus)      | Table 1      |
| A002 | Amaranth seed, pale brown (Amaranthus cruentus) | Table 1      |
| A003 | Bajra (Pennisetum typhoideum)                   | Table 1      |
| A004 | Barley (Hordeum vulgare)                        | Table 1      |
| A005 | Jowar (Sorghum vulgare)                         | Table 1      |
| A006 | Maize, dry (Zea mays)                           | Table 1      |
| A007 | Maize, tender, local (Zea mays)                 | Table 1      |
| A008 | Maize, tender, sweet (Zea mays)                 | Table 1      |
| A009 | Quinoa(Chenopodium quinoa)                      | Table 1      |
| A010 | Ragi (Eleusine coracana)                        | Table 1      |
| A011 | Rice flakes (Oryza sativa )                     | Table 1      |
| A012 | Rice puffed (Oryza sativa )                     | Table 1      |
| A013 | Rice, raw, brown (Oryza sativa )                | Table 1      |
| A014 | Rice, parboiled, milled (Oryza sativa )         | Table 1      |
| A015 | Rice, raw, milled (Oryza sativa )               | Table 1      |
| A016 | Samai (Panicum miliare)                         | Table 1      |
| A017 | Varagu (Paspalum scrobiculatum)                 | Table 1      |
| A018 | Wheat flour, refined (Triticum aestivum)        | Table 1      |
| A019 | Wheat flour, atta (Triticum aestivum)           | Table 1      |
| A020 | Wheat, whole (Triticum aestivum)                | Table 1      |
| A021 | Wheat, bulgur (Triticum aestivum)               | Table 1      |
| A022 | Wheat, semolina (Triticum aestivum)             | Table 1      |
| A023 | Wheat, vermicelli (Triticum aestivum)           | Table 1      |
| A024 | Wheat, vermicelli, roasted (Triticum aestivum)  | Table 1      |

## B. Grain Legumes

| Code | Official label                           | Source table |
| ---- | ---------------------------------------- | ------------ |
| B001 | Bengal gram, dal (Cicer arietinum)       | Table 1      |
| B002 | Bengal gram, whole (Cicer arietinum)     | Table 1      |
| B003 | Black gram, dal (Phaseolus mungo)        | Table 1      |
| B004 | Black gram, whole (Phaseolus mungo)      | Table 1      |
| B005 | Cowpea, brown (Vigna catjang)            | Table 1      |
| B006 | Cowpea, white (Vigna catjang)            | Table 1      |
| B007 | Field bean, black (Phaseolus vulgaris)   | Table 1      |
| B008 | Field bean, brown (Phaseolus vulgaris)   | Table 1      |
| B009 | Field bean, white (Phaseolus vulgaris)   | Table 1      |
| B010 | Green gram, dal (Vigna radiata)          | Table 1      |
| B011 | Green gram, whole (Vigna radiata)        | Table 1      |
| B012 | Horse gram, whole (Dolichos biflorus)    | Table 1      |
| B013 | Lentil dal (Lens culinaris)              | Table 1      |
| B014 | Lentil whole, brown (Lens culinaris)     | Table 1      |
| B015 | Lentil whole, yellowish (Lens culinaris) | Table 1      |
| B016 | Moth bean (Vigna aconitifolia)           | Table 1      |
| B017 | Peas, dry (Pisum sativum)                | Table 1      |
| B018 | Rajmah, black (Phaseolus vulgaris)       | Table 1      |
| B019 | Rajmah, brown (Phaseolus vulgaris)       | Table 1      |
| B020 | Rajmah, red (Phaseolus vulgaris)         | Table 1      |
| B021 | Red gram, dal (Cajanus cajan)            | Table 1      |
| B022 | Red gram, whole (Cajanus cajan)          | Table 1      |
| B023 | Ricebean (Vigna umbellata)               | Table 1      |
| B024 | Soybean, brown (Glycine max)             | Table 1      |
| B025 | Soybean, white (Glycine max)             | Table 1      |

## C. Green Leafy Vegetables

| Code | Official label                                                   | Source table |
| ---- | ---------------------------------------------------------------- | ------------ |
| C001 | Agathi leaves (Sesbania grandiflora)                             | Table 1      |
| C002 | Amaranth leaves, green (Amaranthus gangeticus)                   | Table 1      |
| C003 | Amaranth leaves, red (Amaranthus gangeticus)                     | Table 1      |
| C004 | Amaranth leaves, red and green mix (Amaranthus gangeticus)       | Table 1      |
| C005 | Amaranth spined, leaves, green (Amaranthus spinosus)             | Table 1      |
| C006 | Amaranth spined, leaves, red and green mix (Amaranthus spinosus) | Table 1      |
| C007 | Basella leaves (Basella alba)                                    | Table 1      |
| C008 | Bathua leaves (Chenopodium album)                                | Table 1      |
| C009 | Beet greens (Beta vulgaris)                                      | Table 1      |
| C010 | Betel leaves, big (Kolkata) (Piper betle)                        | Table 1      |
| C011 | Betel leaves, small (Piper betle)                                | Table 1      |
| C012 | Brussels sprouts (Brassica oleracea var. gemmifera)              | Table 1      |
| C013 | Cabbage, Chinese (Brassica rupa)                                 | Table 1      |
| C014 | Cabbage, collard greens (Brassica oleracea var. viridis)         | Table 1      |
| C015 | Cabbage, green (Brassica oleracea var. capitata f. alba)         | Table 1      |
| C016 | Cabbage, violet (Brassica oleracea var. capitata f. rubra)       | Table 1      |
| C017 | Cauliflower leaves (Brassica oleracea var. botrytis)             | Table 1      |
| C018 | Colocasia leaves, green (Colocasia esculenta)                    | Table 1      |
| C019 | Drumstick leaves (Moringa oleifera)                              | Table 1      |
| C020 | Fenugreek leaves (Trigonella foenum graecum)                     | Table 1      |
| C021 | Garden cress (Lepidium sativum)                                  | Table 1      |
| C022 | Gogu leaves, green (Hibiscus cannabinus)                         | Table 1      |
| C023 | Gogu leaves, red (Hibiscus cannabinus)                           | Table 1      |
| C024 | Knol-Khol, leaves (Brassica oleracea var. gongylodes)            | Table 1      |
| C025 | Lettuce (Lactuca sativa)                                         | Table 1      |
| C026 | Mustard leaves (Brassica juncea)                                 | Table 1      |
| C027 | Pak Choi leaves (Brassica rapa var. chinensis)                   | Table 1      |
| C028 | Parsley (Petroselinum crispum)                                   | Table 1      |
| C029 | Ponnaganni (Alternanthera sessilis)                              | Table 1      |
| C030 | Pumpkin leaves, tender (Cucurbita maxima)                        | Table 1      |
| C031 | Radish leaves (Raphanus sativus)                                 | Table 1      |
| C032 | Rumex leaves (Rumex patientia)                                   | Table 1      |
| C033 | Spinach (Spinacia oleracea)                                      | Table 1      |
| C034 | Tamarind leaves, tender (Tamarindus indica)                      | Table 1      |

## D. Other Vegetables

| Code | Official label                                                      | Source table |
| ---- | ------------------------------------------------------------------- | ------------ |
| D001 | Ash gourd (Benincasa hispida)                                       | Table 1      |
| D002 | Bamboo shoot, tender (Bambusa vulgaris)                             | Table 1      |
| D003 | Bean scarlet, tender (Phaseolus coccineus)                          | Table 1      |
| D004 | Bitter gourd, jagged, teeth ridges, elongate (Momordica charantia)  | Table 1      |
| D005 | Bitter gourd, jagged, teeth ridges, short (Momordica charantia)     | Table 1      |
| D006 | Bitter gourd, jagged, smooth ridges, elongate (Momordica charantia) | Table 1      |
| D007 | Bottle gourd, elongate, pale green (Lagenaria vulgaris)             | Table 1      |
| D008 | Bottle gourd, round, pale green (Lagenaria vulgaris)                | Table 1      |
| D009 | Bottle gourd, elongate, dark green (Lagenaria vulgaris)             | Table 1      |
| D010 | Brinjal-1 (Solanum melongena)                                       | Table 1      |
| D011 | Brinjal-2 (Solanum melongena)                                       | Table 1      |
| D012 | Brinjal-3 (Solanum melongena)                                       | Table 1      |
| D013 | Brinjal-4 (Solanum melongena)                                       | Table 1      |
| D014 | Brinjal-5 (Solanum melongena)                                       | Table 1      |
| D015 | Brinjal-6 (Solanum melongena)                                       | Table 1      |
| D016 | Brinjal-7 (Solanum melongena)                                       | Table 1      |
| D017 | Brinjal-8 (Solanum melongena)                                       | Table 1      |
| D018 | Brinjal-9 (Solanum melongena)                                       | Table 1      |
| D019 | Brinjal-10 (Solanum melongena)                                      | Table 1      |
| D020 | Brinjal-11 (Solanum melongena)                                      | Table 1      |
| D021 | Brinjal-12 (Solanum melongena)                                      | Table 1      |
| D022 | Brinjal-13 (Solanum melongena)                                      | Table 1      |
| D023 | Brinjal-14 (Solanum melongena)                                      | Table 1      |
| D024 | Brinjal-15 (Solanum melongena)                                      | Table 1      |
| D025 | Brinjal-16 (Solanum melongena)                                      | Table 1      |
| D026 | Brinjal-17 (Solanum melongena)                                      | Table 1      |
| D027 | Brinjal-18 (Solanum melongena)                                      | Table 1      |
| D028 | Brinjal-19 (Solanum melongena)                                      | Table 1      |
| D029 | Brinjal-20 (Solanum melongena)                                      | Table 1      |
| D030 | Brinjal-21 (Solanum melongena)                                      | Table 1      |
| D031 | Brinjal - all varieties (Solanum melongena)                         | Table 1      |
| D032 | Broad beans (Vicia faba)                                            | Table 1      |
| D033 | Capsicum, green (Capsicum annuum)                                   | Table 1      |
| D034 | Capsicum, red (Capsicum annuum)                                     | Table 1      |
| D035 | Capsicum, yellow (Capsicum annuum)                                  | Table 1      |
| D036 | Cauliflower (Brassica oleracea var. botrytis)                       | Table 1      |
| D037 | Celery stalk (Apium graveolens)                                     | Table 1      |
| D038 | Cho-cho-marrow (Sechium edule)                                      | Table 1      |
| D039 | Cluster beans (Cyamopsis tetragonoloba)                             | Table 1      |
| D040 | Colocasia, stem, black (Colocasia esculenta)                        | Table 1      |
| D041 | Colocasia, stem, green (Colocasia esculenta)                        | Table 1      |
| D042 | Corn, baby (Zea mays)                                               | Table 1      |
| D043 | Cucumber, green, elongate (Cucumis sativus)                         | Table 1      |
| D044 | Cucumber, green, short (Cucumis sativus)                            | Table 1      |
| D045 | Cucumber, orange, round (Cucumis sativus)                           | Table 1      |
| D046 | Drumstick (Moringa oleifera)                                        | Table 1      |
| D047 | Field beans, tender, broad (Vicia faba)                             | Table 1      |
| D048 | Field beans, tender, lean (Vicia faba)                              | Table 1      |
| D049 | French beans, country (Phaseolus vulgaris)                          | Table 1      |
| D050 | French beans, hybrid (Phaseolus vulgaris)                           | Table 1      |
| D051 | Jack fruit, raw (Artocarpus heterophyllus)                          | Table 1      |
| D052 | Jack fruit, seed, mature (Artocarpus heterophyllus)                 | Table 1      |
| D053 | Knol - Khol (Brassica oleracea)                                     | Table 1      |
| D054 | Kovai, big (Coccinia cordifolia)                                    | Table 1      |
| D055 | Kovai, small (Coccinia cordifolia)                                  | Table 1      |
| D056 | Ladies finger (Abelmoschus esculentus)                              | Table 1      |
| D057 | Mango, green, raw (Mangifera indica)                                | Table 1      |
| D058 | Onion, stalk (Allium cepa)                                          | Table 1      |
| D059 | Papaya, raw (Carica papaya)                                         | Table 1      |
| D060 | Parwar (Trichosanthes dioica)                                       | Table 1      |
| D061 | Peas, fresh (Pisum sativum)                                         | Table 1      |
| D062 | Plantain, flower (Musa x paradisiaca)                               | Table 1      |
| D063 | Plantain, green (Musa x paradisiaca)                                | Table 1      |
| D064 | Plantain, stem (Musa x paradisiaca)                                 | Table 1      |
| D065 | Pumpkin, green, cylindrical (Cucurbita maxima)                      | Table 1      |
| D066 | Pumpkin, orange, round (Cucurbita maxima)                           | Table 1      |
| D067 | Red gram, tender, fresh (Cajanus cajan)                             | Table 1      |
| D068 | Ridge gourd (Luffa acutangula)                                      | Table 1      |
| D069 | Ridge gourd, smooth skin (Luffa acutangula)                         | Table 1      |
| D070 | Snake gourd, long, pale green (Trichosanthes anguina)               | Table 1      |
| D071 | Snake gourd, long, dark green (Trichosanthes anguina)               | Table 1      |
| D072 | Snake gourd, short (Trichosanthes anguina)                          | Table 1      |
| D073 | Tinda, tender (Praecitrullus fistulosus)                            | Table 1      |
| D074 | Tomato, green (Solanum lycopersicum)                                | Table 1      |
| D075 | Tomato, ripe, hybrid ((Solanum lycopersicum)                        | Table 1      |
| D076 | Tomato, ripe, local (Lycopersicon esculentum)                       | Table 1      |
| D077 | Zucchini, green (Cucurbita pepo)                                    | Table 1      |
| D078 | Zucchini, yellow (Cucurbita pepo)                                   | Table 1      |

## E. Fruits

| Code | Official label                                            | Source table |
| ---- | --------------------------------------------------------- | ------------ |
| E001 | Apple, big (Malus domestica)                              | Table 1      |
| E002 | Apple, green (Malus domestica)                            | Table 1      |
| E003 | Apple, small (Malus domestica)                            | Table 1      |
| E004 | Apple, small, Kashmir (Malus domestica)                   | Table 1      |
| E005 | Apricot, dried (Prunus armeniaca)                         | Table 1      |
| E006 | Apricot, processed (Prunus armeniaca)                     | Table 1      |
| E007 | Avocado fruit (Persea sp.)                                | Table 1      |
| E008 | Bael fruit (Aegle marmelos)                               | Table 1      |
| E009 | Banana, ripe, montham (Musa x paradisiaca)                | Table 1      |
| E010 | Banana, ripe, poovam (Musa x paradisiaca)                 | Table 1      |
| E011 | Banana, ripe, red (Musa x paradisiaca)                    | Table 1      |
| E012 | Banana, ripe, robusta (Musa x paradisiaca)                | Table 1      |
| E013 | Black berry (Rubus sp.)                                   | Table 1      |
| E014 | Cherries, red (Prunus cerasus)                            | Table 1      |
| E015 | Currants, black (Ribes nigrum)                            | Table 1      |
| E016 | Custard apple (Annona squamosa)                           | Table 1      |
| E017 | Dates, dry, pale brown (Phoenix dactylifera)              | Table 1      |
| E018 | Dates, dry, dark brown (Phoenix dactylifera)              | Table 1      |
| E019 | Dates, processed (Phoenix dactylifera)                    | Table 1      |
| E020 | Fig (Ficus carica)                                        | Table 1      |
| E021 | Gooseberry (Emblica officinalis)                          | Table 1      |
| E022 | Grapes, seeded, round, black (Vitis vinifera)             | Table 1      |
| E023 | Grapes, seeded, round, green (Vitis vinifera)             | Table 1      |
| E024 | Grapes, seeded, round, red (Vitis vinifera)               | Table 1      |
| E025 | Grapes, seedless, oval, black (Vitis vinifera)            | Table 1      |
| E026 | Grapes, seedless, round, green (Vitis vinifera)           | Table 1      |
| E027 | Grapes, seedless, round, black (Vitis vinifera)           | Table 1      |
| E028 | Guava, white flesh (Psidium guajava)                      | Table 1      |
| E029 | Guava, pink flesh (Psidium guajava)                       | Table 1      |
| E030 | Jack fruit, ripe (Artocarpus heterophyllus)               | Table 1      |
| E031 | Jambu fruit, ripe (Syzygium samarangense)                 | Table 1      |
| E032 | Karonda fruit (Carissa carandas)                          | Table 1      |
| E033 | Lemon, juice (Citrus limon)                               | Table 1      |
| E034 | Lime, sweet,pulp (Citrus limetta)                         | Table 1      |
| E035 | Litchi (Litchi chinensis)                                 | Table 1      |
| E036 | Mango, ripe, banganapalli (Mangifera indica)              | Table 1      |
| E037 | Mango, ripe, gulabkhas (Mangifera indica)                 | Table 1      |
| E038 | Mango, ripe, himsagar (Mangifera indica)                  | Table 1      |
| E039 | Mango, ripe, kesar (Mangifera indica)                     | Table 1      |
| E040 | Mango, ripe, neelam (Mangifera indica)                    | Table 1      |
| E041 | Mango, ripe, paheri (Mangifera indica)                    | Table 1      |
| E042 | Mango, ripe, totapari (Mangifera indica)                  | Table 1      |
| E043 | Mangosteen (Garcinia mangostana)                          | Table 1      |
| E044 | Manila tamarind (Pithecellobium dulce)                    | Table 1      |
| E045 | Musk melon, orange flesh (Cucumis melon)                  | Table 1      |
| E046 | Musk melon, yellow flesh (Cucumis melon)                  | Table 1      |
| E047 | Orange, pulp (Citrus aurantium)                           | Table 1      |
| E048 | Palm fruit, tender (Borassus flabellifer)                 | Table 1      |
| E049 | Papaya, ripe (Carica papaya)                              | Table 1      |
| E050 | Peach (Prunus communis)                                   | Table 1      |
| E051 | Pear (Pyrus sp.)                                          | Table 1      |
| E052 | Phalsa (Grewia asiatica)                                  | Table 1      |
| E053 | Pineapple (Ananas comosus)                                | Table 1      |
| E054 | Plum (Prunus domestica)                                   | Table 1      |
| E055 | Pomegranate, maroon seeds (Punica granatum)               | Table 1      |
| E056 | Pummelo (Citrus maxima)                                   | Table 1      |
| E057 | Raisins, dried, black (Vitis vinifera)                    | Table 1      |
| E058 | Raisins, dried, golden (Vitis vinifera)                   | Table 1      |
| E059 | Rambutan (Nephelium lappaceum)                            | Table 1      |
| E060 | Sapota (Achras sapota)                                    | Table 1      |
| E061 | Soursop (Annona muricata)                                 | Table 1      |
| E062 | Star fruit (Averrhoa carambola)                           | Table 1      |
| E063 | Strawberry (Fragaria x ananassa)                          | Table 1      |
| E064 | Tamarind, pulp (Tamarindus indica)                        | Table 1      |
| E065 | Water melon, dark green (sugar baby) (Citrullus vulgaris) | Table 1      |
| E066 | Water melon, pale green (Citrullus vulgaris)              | Table 1      |
| E067 | Wood Apple (Limonia acidissima)                           | Table 1      |
| E068 | Zizyphus (Zizyphus jujube)                                | Table 1      |

## F. Roots and Tubers

| Code | Official label                                  | Source table |
| ---- | ----------------------------------------------- | ------------ |
| F001 | Beet root (Beta vulgaris)                       | Table 1      |
| F002 | Carrot, orange (Daucus carota)                  | Table 1      |
| F003 | Carrot, red (Daucus carota)                     | Table 1      |
| F004 | Colocasia (Colocasia esculenta)                 | Table 1      |
| F005 | Lotus root (Nelumbium nelumbo)                  | Table 1      |
| F006 | Potato, brown skin, big (Solanum tuberosum)     | Table 1      |
| F007 | Potato, brown skin, small (Solanum tuberosum)   | Table 1      |
| F008 | Potato, red skin (Solanum tuberosum)            | Table 1      |
| F009 | Radish, elongate, red skin (Raphanus sativus)   | Table 1      |
| F010 | Radish, elongate, white skin (Raphanus sativus) | Table 1      |
| F011 | Radish, round, red skin (Raphanus sativus)      | Table 1      |
| F012 | Radish, round, white skin (Raphanus sativus)    | Table 1      |
| F013 | Sweet potato, brown skin (Ipomoea batatas)      | Table 1      |
| F014 | Sweet potato, pink skin (Ipomoea batatas)       | Table 1      |
| F015 | Tapioca (Manihot esculenta)                     | Table 1      |
| F016 | Water Chestnut (Eleocharis dulcis)              | Table 1      |
| F017 | Yam, elephant (Amorphophallus campanulatus)     | Table 1      |
| F018 | Yam, ordinary (Amorphophallus sp.)              | Table 1      |
| F019 | Yam, wild (Dioscorea villosa)                   | Table 1      |

## G. Condiments and Spices

| Code | Official label                                   | Source table |
| ---- | ------------------------------------------------ | ------------ |
| G001 | Chillies, green-1 (Capsicum annum)               | Table 1      |
| G002 | Chillies, green-2 (Capsicum annum)               | Table 1      |
| G003 | Chillies, green-3 (Capsicum annum)               | Table 1      |
| G004 | Chillies, green-4 (Capsicum annum)               | Table 1      |
| G005 | Chillies, green-5 (Capsicum annum)               | Table 1      |
| G006 | Chillies, green-6 (Capsicum annum)               | Table 1      |
| G007 | Chillies, green-7 (Capsicum annum)               | Table 1      |
| G008 | Chillies, green - all varieties (Capsicum annum) | Table 1      |
| G009 | Coriander leaves (Coriandrum sativum)            | Table 1      |
| G010 | Curry leaves (Murraya koenigii)                  | Table 1      |
| G011 | Garlic, big clove (Allium sativum)               | Table 1      |
| G012 | Garlic, small clove (Allium sativum)             | Table 1      |
| G013 | Garlic, single clove, Kashmir (Allium sativum)   | Table 1      |
| G014 | Ginger, fresh (Zingiber officinale)              | Table 1      |
| G015 | Mango ginger (Curcuma amada)                     | Table 1      |
| G016 | Mint leaves (Mentha spicata )                    | Table 1      |
| G017 | Onion, big (Allium cepa)                         | Table 1      |
| G018 | Onion, small (Allium cepa)                       | Table 1      |
| G019 | Asafoetida (Ferula assa-foetida)                 | Table 1      |
| G020 | Cardamom, green (Elettaria cardamomum)           | Table 1      |
| G021 | Cardamom, black (Elettaria cardamomum)           | Table 1      |
| G022 | Chillies, red (Capsicum annum)                   | Table 1      |
| G023 | Cloves (Syzygium aromaticum)                     | Table 1      |
| G024 | Coriander seeds (Coriandrum sativum)             | Table 1      |
| G025 | Cumin seeds (Cuminum cyminum)                    | Table 1      |
| G026 | Fenugreek seeds (Trigonella foenum graecum)      | Table 1      |
| G027 | Mace (Myristica fragrans)                        | Table 1      |
| G028 | Nutmeg (Myristica fragrans)                      | Table 1      |
| G029 | Omum (Trachyspermum ammi)                        | Table 1      |
| G030 | Pippali (Piper longum)                           | Table 1      |
| G031 | Pepper, black (Piper nigrum)                     | Table 1      |
| G032 | Poppy seeds (Papaver somniferum)                 | Table 1      |
| G033 | Turmeric powder (Curcuma domestica)              | Table 1      |

## H. Nuts and Oil Seeds

| Code | Official label                             | Source table |
| ---- | ------------------------------------------ | ------------ |
| H001 | Almond (Prunus amygdalus)                  | Table 1      |
| H002 | Arecanut, dried, brown (Areca catechu)     | Table 1      |
| H003 | Arecanut, dried, red color (Areca catechu) | Table 1      |
| H004 | Arecanut, fresh (Areca catechu)            | Table 1      |
| H005 | Cashew nut (Anacardium occidentale)        | Table 1      |
| H006 | Coconut, kernel, dry (Cocos nucifera)      | Table 1      |
| H007 | Coconut, kernel, fresh (Cocos nucifera)    | Table 1      |
| H008 | Garden cress, seeds (Lepidium sativum)     | Table 1      |
| H009 | Gingelly seeds, black (Sesamum indicum)    | Table 1      |
| H010 | Gingelly seeds, brown (Sesamum indicum)    | Table 1      |
| H011 | Gingelly seeds, white (Sesamum indicum)    | Table 1      |
| H012 | Ground nut (Arachis hypogaea)              | Table 1      |
| H013 | Mustard seeds (Brassica nigra)             | Table 1      |
| H014 | Linseeds (Linum usitatissimum)             | Table 1      |
| H015 | Niger seeds, black (Guizotia abyssinica)   | Table 1      |
| H016 | Niger seeds, gray (Guizotia abyssinica)    | Table 1      |
| H017 | Pine seed (Pinus sp.)                      | Table 1      |
| H018 | Pistachio nuts (Pistacia vera)             | Table 1      |
| H019 | Safflower seeds (Carthamus tinctorius)     | Table 1      |
| H020 | Sunflower seeds (Helianthus annuus)        | Table 1      |
| H021 | Walnut (Juglans regia)                     | Table 1      |

## I. Sugars

| Code | Official label                           | Source table |
| ---- | ---------------------------------------- | ------------ |
| I001 | Jaggery, cane (Saccharum officinarum)    | Table 1      |
| I002 | Sugarcane, juice (Saccharum officinarum) | Table 1      |

## J. Mushrooms

| Code | Official label                           | Source table |
| ---- | ---------------------------------------- | ------------ |
| J001 | Button mushroom, fresh (Agaricus sp.)    | Table 1      |
| J002 | Chicken mushroom, fresh (Lactiporus sp.) | Table 1      |
| J003 | Shiitake mushroom, fresh (Lentinula sp.) | Table 1      |
| J004 | Oyster mushroom, dried (Pleurotus sp.)   | Table 1      |

## K. Miscellaneous Foods

| Code | Official label                 | Source table |
| ---- | ------------------------------ | ------------ |
| K001 | Toddy (Borassus flabellifer)   | Table 1      |
| K002 | Coconut Water (Cocos nucifera) | Table 1      |

## L. Milk and Milk Products

| Code | Official label       | Source table |
| ---- | -------------------- | ------------ |
| L001 | Milk, whole, Buffalo | Table 1      |
| L002 | Milk, whole, Cow     | Table 1      |
| L003 | Paneer               | Table 1      |
| L004 | Khoa                 | Table 1      |

## M. Egg and Egg Products

| Code | Official label                  | Source table |
| ---- | ------------------------------- | ------------ |
| M001 | Egg, poultry, whole, raw        | Table 1      |
| M002 | Egg, poultry, white, raw        | Table 1      |
| M003 | Egg, poultry, yolk, raw         | Table 1      |
| M004 | Egg, poultry, whole, boiled     | Table 1      |
| M005 | Egg, poultry, white, boiled     | Table 1      |
| M006 | Egg, poultry, yolk, boiled      | Table 1      |
| M007 | Egg, poultry, omlet             | Table 1      |
| M008 | Egg, country hen, whole, raw    | Table 1      |
| M009 | Egg, country hen, whole, boiled | Table 1      |
| M010 | Egg, country hen, omlet         | Table 1      |
| M011 | Egg, duck, whole, boiled        | Table 1      |
| M012 | Egg, duck, whole, raw           | Table 1      |
| M013 | Egg, duck, whole, omlet         | Table 1      |
| M014 | Egg, quial, whole, raw          | Table 1      |
| M015 | Egg, quial, whole, boiled       | Table 1      |

## N. Poultry

| Code | Official label                     | Source table |
| ---- | ---------------------------------- | ------------ |
| N001 | Chicken, poultry, leg, skinless    | Table 1      |
| N002 | Chicken, poultry, thigh, skinless  | Table 1      |
| N003 | Chicken, poultry, breast, skinless | Table 1      |
| N004 | Chicken, poultry, wing, skinless   | Table 1      |
| N005 | Poultry, chicken, liver            | Table 1      |
| N006 | Poultry, chicken, gizzard          | Table 1      |
| N007 | Country hen, leg, with skin        | Table 1      |
| N008 | Country hen, thigh, with skin      | Table 1      |
| N009 | Country hen, breast, with skin     | Table 1      |
| N010 | Country hen, wing, with skin       | Table 1      |
| N011 | Duck, meat, with skin              | Table 1      |
| N012 | Emu, meat, skinless                | Table 1      |
| N013 | Guinea fowl, meat, with skin       | Table 1      |
| N014 | Pigeon, meat, with skin            | Table 1      |
| N015 | Quail, meat, skinless              | Table 1      |
| N016 | Turkey, leg, with skin             | Table 1      |
| N017 | Turkey, thigh, with skin           | Table 1      |
| N018 | Turkey, breast, with skin          | Table 1      |
| N019 | Turkey, wing, with skin            | Table 1      |

## O. Animal Meat

| Code | Official label               | Source table |
| ---- | ---------------------------- | ------------ |
| O001 | Goat, shoulder               | Table 1      |
| O002 | Goat, chops                  | Table 1      |
| O003 | Goat, legs                   | Table 1      |
| O004 | Goat, brain                  | Table 1      |
| O005 | Goat, tongue                 | Table 1      |
| O006 | Goat, lungs                  | Table 1      |
| O007 | Goat, heart                  | Table 1      |
| O008 | Goat, liver                  | Table 1      |
| O009 | Goat, tripe                  | Table 1      |
| O010 | Goat, spleen                 | Table 1      |
| O011 | Goat, kidneys                | Table 1      |
| O012 | Goat, tube (small intestine) | Table 1      |
| O013 | Goat, testis                 | Table 1      |
| O014 | Sheep, shoulder              | Table 1      |
| O015 | Sheep, chops                 | Table 1      |
| O016 | Sheep, leg                   | Table 1      |
| O017 | Sheep, brain                 | Table 1      |
| O018 | Sheep, tongue                | Table 1      |
| O019 | Sheep, lungs                 | Table 1      |
| O020 | Sheep, heart                 | Table 1      |
| O021 | Sheep, liver                 | Table 1      |
| O022 | Sheep, tripe                 | Table 1      |
| O023 | Sheep, spleen                | Table 1      |
| O024 | Sheep, kidneys               | Table 1      |
| O025 | Beef, shoulder               | Table 1      |
| O026 | Beef, chops                  | Table 1      |
| O027 | Beef, round (leg)            | Table 1      |
| O028 | Beef, brain                  | Table 1      |
| O029 | Beef, tongue                 | Table 1      |
| O030 | Beef, lungs                  | Table 1      |
| O031 | Beef, heart                  | Table 1      |
| O032 | Beef, liver                  | Table 1      |
| O033 | Beef, tripe                  | Table 1      |
| O034 | Beef, spleen                 | Table 1      |
| O035 | Beef, kidneys                | Table 1      |
| O036 | Calf, shoulder               | Table 1      |
| O037 | Calf, chops                  | Table 1      |
| O038 | Calf, round (leg)            | Table 1      |
| O039 | Calf, brain                  | Table 1      |
| O040 | Calf, tongue                 | Table 1      |
| O041 | Calf, heart                  | Table 1      |
| O042 | Calf, liver                  | Table 1      |
| O043 | Calf, spleen                 | Table 1      |
| O044 | Calf, kidneys                | Table 1      |
| O045 | Mithun, shoulder             | Table 1      |
| O046 | Mithun, chops                | Table 1      |
| O047 | Mithun, round (leg)          | Table 1      |
| O048 | Pork, shoulder               | Table 1      |
| O049 | Pork, chops                  | Table 1      |
| O050 | Pork, ham                    | Table 1      |
| O051 | Pork, lungs                  | Table 1      |
| O052 | Pork, heart                  | Table 1      |
| O053 | Pork, liver                  | Table 1      |
| O054 | Pork, stomach                | Table 1      |
| O055 | Pork, spleen                 | Table 1      |
| O056 | Pork, kidneys                | Table 1      |
| O057 | Pork, tube (small intestine) | Table 1      |
| O058 | Hare, shoulder               | Table 1      |
| O059 | Hare, chops                  | Table 1      |
| O060 | Hare, leg                    | Table 1      |
| O061 | Rabbit, shoulder             | Table 1      |
| O062 | Rabbit, chops                | Table 1      |
| O063 | Rabbit, leg                  | Table 1      |

## P. Marine Fish

| Code | Official label                                  | Source table |
| ---- | ----------------------------------------------- | ------------ |
| P001 | Allathi (Elops machnata)                        | Table 1      |
| P002 | Aluva(Parastromateus niger)                     | Table 1      |
| P003 | Anchovy (Stolephorus indicus)                   | Table 1      |
| P004 | Ari fish (Aprion virescens )                    | Table 1      |
| P005 | Betki(Lates calcarifer)                         | Table 1      |
| P006 | Black snapper (Macolor niger)                   | Table 1      |
| P007 | Bombay duck (Harpadon nehereus)                 | Table 1      |
| P008 | Bommuralu(Muraenesox cinerius)                  | Table 1      |
| P009 | Cat fish (Tachysurus thalassinus)               | Table 1      |
| P010 | Chakla (Rachycentron canadum)                   | Table 1      |
| P011 | Chappal(Aluterus monoceros )                    | Table 1      |
| P012 | Chelu (Elagatis bipinnulata)                    | Table 1      |
| P013 | Chembali (Lutjanus quinquelineatus)             | Table 1      |
| P014 | Eri meen (Pristipomoides filamentosus)          | Table 1      |
| P015 | Gobro(Epinephelus diacanthus)                   | Table 1      |
| P016 | Guitar fish (Rhinobatus prahli)                 | Table 1      |
| P017 | Hilsa(Tenualosa ilisha)                         | Table 1      |
| P018 | Jallal (Arius sp.)                              | Table 1      |
| P019 | Jathi vela meen (Lethrinus lentjan)             | Table 1      |
| P020 | Kadal bral (Synodus indicus)                    | Table 1      |
| P021 | Kadali (Nemipterus mesoprion)                   | Table 1      |
| P022 | Kalamaara(Leptomelanosoma indicum)              | Table 1      |
| P023 | Kalava(Epinephelus coioides)                    | Table 1      |
| P024 | Kanamayya(Lutjanus rivulatus)                   | Table 1      |
| P025 | Kannadi paarai (Alectis indicus)                | Table 1      |
| P026 | Karimeen(Etroplus suratensis)                   | Table 1      |
| P027 | Karnagawala(Anchoa hepsetus)                    | Table 1      |
| P028 | Kayrai(Thunnus albacores)                       | Table 1      |
| P029 | Kiriyan (Atule mate)                            | Table 1      |
| P030 | Kite fish (Mobula kuhlii)                       | Table 1      |
| P031 | Korka(Terapon jarbua)                           | Table 1      |
| P032 | Kulam paarai (Carangoides fulvoguttatus)        | Table 1      |
| P033 | Maagaa (Polynemus plebeius)                     | Table 1      |
| P034 | Mackerel(Rastrelliger kanagurta)                | Table 1      |
| P035 | Manda clathi (Naso reticulatus)                 | Table 1      |
| P036 | Matha (Acanthurus mata)                         | Table 1      |
| P037 | Milk fish (Chanos chanos)                       | Table 1      |
| P038 | Moon fish (Mene maculata)                       | Table 1      |
| P039 | Mullet(Mugil cephalus)                          | Table 1      |
| P040 | Mural (Tylosurus crocodilus)                    | Table 1      |
| P041 | Myil meen(Istiophorus platypterus)              | Table 1      |
| P042 | Nalla bontha (Epinephelus sp.)                  | Table 1      |
| P043 | Narba(Caranx sexfasciatus)                      | Table 1      |
| P044 | Paarai (Caranx heberi)                          | Table 1      |
| P045 | Padayappa(Canthidermis maculata)                | Table 1      |
| P046 | Pali kora (Panna microdon)                      | Table 1      |
| P047 | Pambada(Lepturacanthus savala)                  | Table 1      |
| P048 | Pandukopa (Pseudosciaena manchurica)            | Table 1      |
| P049 | Parava (Lactarius lactarius)                    | Table 1      |
| P050 | Parcus (Psettodes erumei)                       | Table 1      |
| P051 | Parrot fish (Scarus ghobban)                    | Table 1      |
| P052 | Perinkilichai (Pinjalo pinjalo)                 | Table 1      |
| P053 | Phopat(Coryphaena hippurus)                     | Table 1      |
| P054 | Piranha (Pygopritis sp.)                        | Table 1      |
| P055 | Pomfret, black (Parastromateus niger)           | Table 1      |
| P056 | Pomfret, snub nose (Trachinotus blochii)        | Table 1      |
| P057 | Pomfret, white (Pampus argenteus)               | Table 1      |
| P058 | Pranel(Gerres sp.)                              | Table 1      |
| P059 | Pulli paarai (Gnathanodon speciosus)            | Table 1      |
| P060 | Queen fish (Scomberoides commersonianus)        | Table 1      |
| P061 | Raai fish (Lobotes surinamensis)                | Table 1      |
| P062 | Raai vanthu (Epinephelus chlorostigma)          | Table 1      |
| P063 | Rani (Pink perch)                               | Table 1      |
| P064 | Ray fish, bow head, spotted (Rhina ancylostoma) | Table 1      |
| P065 | Red snapper(Lutjanus argentimaculatus)          | Table 1      |
| P066 | Red snapper, small (Priacanthus hamrur)         | Table 1      |
| P067 | Sadaya (Platax orbicularis)                     | Table 1      |
| P068 | Salmon(Salmo salar)                             | Table 1      |
| P069 | Sangada(Nemipterus japanicus)                   | Table 1      |
| P070 | Sankata paarai (Caranx ignobilis)               | Table 1      |
| P071 | Sardine (Sardinella longiceps)                  | Table 1      |
| P072 | Shark (Carcharhinus sorrah)                     | Table 1      |
| P073 | Shark, hammer head(Sphyrna mokarran)            | Table 1      |
| P074 | Shark, spotted (Stegostoma fasciatum)           | Table 1      |
| P075 | Shelavu(Sphyraena jello)                        | Table 1      |
| P076 | Silan(Silonia silondia)                         | Table 1      |
| P077 | Silk fish (Beryx sp.)                           | Table 1      |
| P078 | Silver carp (Hypophthalmichthys molitrix)       | Table 1      |
| P079 | Sole fish (Cynoglossus arel)                    | Table 1      |
| P080 | Stingray (Dasyatis pastinaca)                   | Table 1      |
| P081 | Tarlava(Drepane punctata)                       | Table 1      |
| P082 | Tholam (Plectorhinchus schotaf)                 | Table 1      |
| P083 | Tilapia (Oreochromis niloticus)                 | Table 1      |
| P084 | Tuna(Euthynnus affinis)                         | Table 1      |
| P085 | Tuna, striped (Katsuwonus pelamis)              | Table 1      |
| P086 | Valava (Chirocentrus nudus)                     | Table 1      |
| P087 | Vanjaram (Scomberomorus commerson)              | Table 1      |
| P088 | Vela meen (Aprion virescens)                    | Table 1      |
| P089 | Vora (Siganus javus)                            | Table 1      |
| P090 | Whale shark(Galeocerdo cuvier)                  | Table 1      |
| P091 | Xiphinis (Xiphias gladius)                      | Table 1      |
| P092 | Eggs, Cat fish (Ompok bimaculatus)              | Table 1      |

## Q. Marine Shellfish

| Code | Official label                                | Source table |
| ---- | --------------------------------------------- | ------------ |
| Q001 | Crab (Menippe mercenaria)                     | Table 1      |
| Q002 | Crab, sea (Portunus sanguinolentus)           | Table 1      |
| Q003 | Lobster, brown (Thenus orientalis)            | Table 1      |
| Q004 | Lobster, king size (Thenus orientalis)        | Table 1      |
| Q005 | Mud crab (Scylla tranquebarica)               | Table 1      |
| Q006 | Oyster (Crassostrea sp.)                      | Table 1      |
| Q007 | Tiger prawns, brown (Solenocera crassicornis) | Table 1      |
| Q008 | Tiger Prawns, orange (Penaeus monodon)        | Table 1      |

## R. Marine Mollusks

| Code | Official label                                | Source table |
| ---- | --------------------------------------------- | ------------ |
| R001 | Clam, green shell (Perna viridis )            | Table 1      |
| R002 | Clam, white shell, ribbed (Meretrix meretrix) | Table 1      |
| R003 | Octopus (Octopus vulgaris)                    | Table 1      |
| R004 | Squid, black (Loligo sp.)                     | Table 1      |
| R005 | Squid, hard shell (Sepia pharaonis)           | Table 1      |
| R006 | Squid, red (Loligo duvaucelii)                | Table 1      |
| R007 | Squid, white, small (Uroteuthis duvauceli)    | Table 1      |

## S. Fresh Water Fish and Shellfish

| Code | Official label                          | Source table |
| ---- | --------------------------------------- | ------------ |
| S001 | Cat fish (Tandanus tandanus)            | Table 1      |
| S002 | Catla(Catla catla)                      | Table 1      |
| S003 | Freshwater Eel (Anguilla anguilla)      | Table 1      |
| S004 | Gold fish (Carassius auratus)           | Table 1      |
| S005 | Pangas (Pangasianodon hypophthalmus)    | Table 1      |
| S006 | Rohu(Labeo rohita)                      | Table 1      |
| S007 | Crab(Pachygrapsus sp.)                  | Table 1      |
| S008 | Prawns, big (Macrobrachium rosenbergii) | Table 1      |
| S009 | Prawns, small (Macrobrachium sp.)       | Table 1      |
| S010 | Tiger prawns (Macrobrachium sp.)        | Table 1      |

## T. Edible Oils and Fats

| Code | Official label          | Source table |
| ---- | ----------------------- | ------------ |
| T001 | Coconut oil             | Table 12     |
| T002 | Corn oil                | Table 12     |
| T003 | Cotton seed oil         | Table 12     |
| T004 | Gingelly oil            | Table 12     |
| T005 | Groundnut oil           | Table 12     |
| T006 | Mustard oil             | Table 12     |
| T007 | Palm oil                | Table 12     |
| T008 | Rice bran oil           | Table 12     |
| T009 | Safflower oil           | Table 12     |
| T010 | Safflower oil (blended) | Table 12     |
| T011 | Soyabean oil            | Table 12     |
| T012 | Sunflower oil           | Table 12     |
| T013 | Ghee                    | Table 12     |
| T014 | Vanaspati               | Table 12     |
