# Тестирование API 2ГИС - Правильные endpoints

## Проблема: "Unknown API method"

API 2ГИС может использовать разные форматы. Попробуйте следующие варианты:

### Вариант 1: Catalog API 2.0 (старая версия)
```
GET https://catalog.api.2gis.com/2.0/catalog/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=ресторан&city=Ереван
```

### Вариант 2: Catalog API 3.0 с другим форматом
```
GET https://catalog.api.2gis.com/3.0/catalog/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=ресторан&city=Ереван
```

### Вариант 3: Прямой API без catalog
```
GET https://api.2gis.com/3.0/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=ресторан&city=Ереван
```

### Вариант 4: С использованием координат
```
GET https://catalog.api.2gis.com/3.0/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=ресторан&lon=44.5133&lat=40.1811&radius=5000
```

### Вариант 5: Проверка доступных методов (может показать правильный endpoint)
```
GET https://catalog.api.2gis.com/3.0/?key=cbbac416-23da-4f9e-8622-caa8211b9c2c
```

### Вариант 6: Использование region_id вместо city
Сначала получите region_id:
```
GET https://catalog.api.2gis.com/3.0/regions?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=Ереван
```

Затем используйте полученный region_id:
```
GET https://catalog.api.2gis.com/3.0/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=ресторан&region_id=XXXXX
```

## Альтернативное решение

Если API 2ГИС не работает с демо-ключом для Армении, можно:
1. Использовать моковые данные для разработки
2. Найти альтернативный API для поиска заведений
3. Использовать Google Places API
4. Создать свой список заведений

