# Руководство по тестированию WEEEK MCP

## 1. Локальные автоматические тесты (Unit Tests)

Локальные тесты построены на базе фреймворка [Vitest](https://vitest.dev/) и не требуют подключения к интернету или наличия реального токена API WEEEK:

```bash
# Запуск полного набора проверок (тесты, проверка типов, сборка):
npm run verify

# Запуск только unit-тестов:
npm test

# Запуск конкретных тестовых наборов:
npx vitest run tests/task-workflows.test.ts
npx vitest run tests/crm-workflows.test.ts
npx vitest run tests/task-fields.test.ts tests/task-schedule.test.ts
npx vitest run tests/api-maintenance.test.ts tests/live-acceptance-safety.test.ts
```

### Что проверяют unit-тесты:
- Корректность формирования HTTP-запросов и заголовков.
- Разрешение имен и ID сущностей (проекты, доски, колонки, воронки, этапы).
- Валидацию схем входных параметров (Zod).
- Верификацию записи через обязательный readback.
- Обработку пагинации, ошибок API и неопределённых ответов.
- Иерархию задач, добавление/удаление исполнителей, комментарии в Markdown.
- Перемещение сделок, исходы won/lost/archived и аналитическую сводку.

---

## 2. Безопасная живая приёмка (Live Acceptance)

Скрипт `scripts/live-acceptance.mjs` позволяет протестировать взаимодействие с реальным аккаунтом WEEEK.

### Режим только для чтения (Read-only, по умолчанию)

В этом режиме скрипт проверяет авторизацию, получение списка проектов, досок, статусов и сводки CRM без создания или изменения каких-либо данных:

```bash
node --env-file=.env scripts/live-acceptance.mjs \
  --project <PROJECT_ID> --funnel <FUNNEL_ID>
```

Результат проверки сохраняется в `reports/live/<timestamp>.json` (директория `reports/` добавлена в `.gitignore`).

### Режим тестовой записи (с созданием изолированных сущностей)

Для выполнения полного цикла приёмки с созданием тестовых задач и сделок требуются два явных флага безопасности:

```bash
WEEEK_LIVE_WRITE=YES node --env-file=.env \
  scripts/live-acceptance.mjs --write \
  --project <PROJECT_ID> --funnel <FUNNEL_ID>
```

#### Проверяемые сценарии:
1. Создание тестовой задачи с описанием и сроком.
2. Перемещение задачи по колонкам доски (`weeek_set_task_status`).
3. Обновление заголовка, приоритета и дедлайна (`weeek_update_task`).
4. Добавление и чтение комментария (`weeek_add_task_comment`, `weeek_list_task_comments`).
5. Назначение исполнителя (`weeek_change_task_assignees`).
6. Создание дочерней задачи, привязка к родителю и отсоединение (`weeek_set_task_parent`).
7. Завершение тестовых задач (`weeek_complete_task`).
8. Создание тестовой сделки (`weeek_create_deal`).
9. Перенос сделки по этапам воронки (`weeek_set_deal_status`).
10. Проверка исходов `won`, `lost`, `archived` и чтение сводки (`weeek_crm_summary`).

Все созданные в процессе теста сущности помечаются префиксом `ТЕСТ MCP — <timestamp>` и в конце завершаются/архивируются.
