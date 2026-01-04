# Как добавить GoogleService-Info.plist в Xcode

## Проблема
Firebase App не инициализируется, потому что `GoogleService-Info.plist` не добавлен в Xcode проект.

## Решение

### Способ 1: Через Xcode (Рекомендуется)

1. **Откройте проект в Xcode:**
   ```bash
   open ios/JoinMe.xcworkspace
   ```
   ⚠️ **ВАЖНО:** Открывайте `.xcworkspace`, а НЕ `.xcodeproj`!

2. **В левой панели (Project Navigator)** найдите папку `JoinMe` (синяя иконка папки)

3. **Правой кнопкой мыши** на папке `JoinMe` → **"Add Files to 'JoinMe'..."**

4. **Выберите файл:**
   - Перейдите в `ios/JoinMe/GoogleService-Info.plist`
   - Выберите файл

5. **В диалоговом окне:**
   - ✅ **Снимите галочку** "Copy items if needed" (файл уже в правильном месте)
   - ✅ **Отметьте галочку** "Add to targets: JoinMe"
   - Нажмите **"Add"**

6. **Проверьте:**
   - Файл `GoogleService-Info.plist` должен появиться в Project Navigator
   - Выберите файл
   - В правой панели (File Inspector) проверьте раздел **"Target Membership"**
   - Должен быть отмечен чекбокс **"JoinMe"**

7. **Пересоберите проект:**
   - В Xcode: **Product → Clean Build Folder** (Shift+Cmd+K)
   - Затем: **Product → Build** (Cmd+B)

### Способ 2: Через терминал (если способ 1 не работает)

```bash
cd /Users/xchoharutyunyan/Desktop/Root/JoinMe/ios
# Убедитесь, что файл существует
ls -la JoinMe/GoogleService-Info.plist

# Откройте Xcode и добавьте файл вручную (см. Способ 1)
open JoinMe.xcworkspace
```

## Проверка

После добавления файла:

1. Запустите приложение
2. Войдите в профиль
3. В логах должно появиться: `✅ Firebase App initialized`
4. Затем: `FCM Token: [длинная строка]`

Если ошибка "No Firebase App" все еще появляется:
- Убедитесь, что файл добавлен в target "JoinMe"
- Пересоберите проект (Clean Build Folder + Build)
- Перезапустите приложение

