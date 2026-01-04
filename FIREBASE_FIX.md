# Исправление краша при запуске

## Что было исправлено:

1. ✅ Убрана ручная инициализация Firebase из `AppDelegate.swift`
   - React Native Firebase автоматически инициализируется из `GoogleService-Info.plist`
   - Не нужно вызывать `FirebaseApp.configure()` вручную

2. ✅ Упрощена инициализация в JavaScript
   - Firebase инициализируется автоматически при первом использовании модуля

3. ✅ Добавлена безопасная проверка перед использованием messaging

## Важно: Проверьте GoogleService-Info.plist в Xcode

Если приложение все еще крашится, проверьте:

1. Откройте проект в Xcode:
   ```bash
   open ios/JoinMe.xcworkspace
   ```

2. В левой панели (Project Navigator) найдите `GoogleService-Info.plist`

3. Выберите файл `GoogleService-Info.plist`

4. В правой панели (File Inspector) проверьте раздел **"Target Membership"**

5. Убедитесь, что отмечен чекбокс **"JoinMe"**

6. Если чекбокса нет или он не отмечен:
   - Отметьте чекбокс "JoinMe"
   - Пересоберите проект

## Если краш все еще происходит:

Проверьте логи в Xcode:
1. Откройте Xcode
2. Запустите приложение через Xcode (не через терминал)
3. Посмотрите логи в консоли Xcode
4. Найдите ошибку и сообщите мне

## Альтернативное решение:

Если проблема сохраняется, можно попробовать добавить GoogleService-Info.plist через Xcode:
1. В Xcode: File → Add Files to "JoinMe"
2. Выберите `ios/JoinMe/GoogleService-Info.plist`
3. Убедитесь, что "Copy items if needed" НЕ отмечен
4. Убедитесь, что "Add to targets: JoinMe" отмечен
5. Нажмите "Add"

