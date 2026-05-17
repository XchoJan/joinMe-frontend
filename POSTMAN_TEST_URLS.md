# URL для тестирования API 2ГИС в Postman

## API ключ
```
cbbac416-23da-4f9e-8622-caa8211b9c2c
```

## ⚠️ ВАЖНО: Используйте endpoint /search, а не /items!

### Вариант 1: Поиск по рубрике с городом (ИСПРАВЛЕННЫЙ)
```
GET https://catalog.api.2gis.com/3.0/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&fields=items.id,items.name,items.address_name,items.point,items.rubrics,items.photos&page=1&page_size=20&rubric_id=184106394&city=Ереван
```

### Вариант 2: Простой текстовый поиск
```
GET https://catalog.api.2gis.com/3.0/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=ресторан&city=Ереван&fields=items.id,items.name,items.address_name,items.point,items.rubrics,items.photos&page=1&page_size=20
```

### Вариант 3: Поиск по рубрике без города
```
GET https://catalog.api.2gis.com/3.0/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&rubric_id=184106394&fields=items.id,items.name,items.address_name,items.point,items.rubrics,items.photos&page=1&page_size=20
```

### Вариант 4: Поиск кафе в Ереване
```
GET https://catalog.api.2gis.com/3.0/search?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=кафе&city=Ереван&fields=items.id,items.name,items.address_name&page=1&page_size=20
```

### Вариант 5: Получить список рубрик (для проверки правильности ID)
```
GET https://catalog.api.2gis.com/3.0/rubrics?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&fields=items.id,items.name
```

### Вариант 6: Получить список городов/регионов
```
GET https://catalog.api.2gis.com/3.0/regions?key=cbbac416-23da-4f9e-8622-caa8211b9c2c&q=Ереван&fields=items.id,items.name
```

## Рекомендации для тестирования:

1. **Начните с Варианта 2** - простой текстовый поиск "ресторан" в Ереване
2. **Если работает, попробуйте Вариант 1** - поиск по рубрике
3. **Проверьте Вариант 5** - список рубрик, чтобы убедиться в правильности ID

## Примечания:

- ✅ Используйте endpoint `/search`, а не `/items`
- ⚠️ API 2ГИС может требовать использовать `region_id` вместо `city` для некоторых регионов
- ⚠️ Для Армении (Ереван) может потребоваться другой формат параметров
- ⚠️ Демо-ключ может иметь ограничения по регионам
