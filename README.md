# WEEEK MCP Server (Extended Fork)

[![CI](https://github.com/bitcony/weeek-mcp-andrey/actions/workflows/test.yml/badge.svg)](https://github.com/bitcony/weeek-mcp-andrey/actions/workflows/test.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Форк MCP-сервера для [WEEEK](https://weeek.net/) с расширенной поддержкой управления задачами и полноценным модулем CRM.

Оригинальный репозиторий: [IlyaIvanchikov/weeek-mcp](https://github.com/IlyaIvanchikov/weeek-mcp) (MIT License).

---

## Зачем создан этот форк

Оригинальный MCP-сервер поддерживал только базовые операции создания и чтения задач. При интеграции с AI-агентами и сложными рабочими процессами возникла необходимость в расширенном функционале:

1. **Полноценная CRM:**
   - Чтение воронок и этапов продаж (`weeek_list_funnels`, `weeek_list_funnel_statuses`).
   - Управление сделками (`weeek_create_deal`, `weeek_get_deal`, `weeek_list_deals`, `weeek_update_deal`).
   - Перемещение сделок по этапам с верификацией (`weeek_set_deal_status`).
   - Управление исходами сделок (`won`, `lost`, `archived`) и аналитическая сводка (`weeek_crm_summary`).
2. **Расширенные сценарии работы с задачами:**
   - Перемещение задач между колонками и досками проекта (`weeek_set_task_status`).
   - Добавление и пагинированное чтение комментариев в Markdown (`weeek_add_task_comment`, `weeek_list_task_comments`).
   - Управление исполнителями задачи (`weeek_change_task_assignees`).
   - Управление иерархией подзадач (`weeek_set_task_parent`).
   - Корректная обработка нативных дат (`dueDate`, `startDate`).
3. **Контроль контракта WEEEK OpenAPI:**
   - Полная матрица соответствия всех 157 операций публичного API (`docs/API-MATRIX.md`).
   - Автоматический трекинг изменений и обновлений API WEEEK (`npm run api:check`).
   - 151 автоматический тест, проверяющий сценарии, валидацию и обработку ошибок.

---

## Документация

- [Матрица соответствия API WEEEK и MCP](docs/API-MATRIX.md) — статус поддержки всех 157 эндпоинтов.
- [Дорожная карта развития](docs/ROADMAP.md) — список сущностей и фаз для достижения 100% покрытия API.
- [Руководство по сопровождению и обновлению API](docs/MAINTENANCE.md) — процедура актуализации при выходе новых версий API.
- [Руководство по тестированию](docs/TESTING.md) — запуск unit-тестов и безопасных приёмочных сценариев.

---

## Быстрый старт

### 1. Установка зависимостей и сборка

```bash
npm ci
npm run verify
```

Команда `npm run verify` запустит 151 тест, проверку типов TypeScript и сборку проекта в `dist/`.

### 2. Запуск MCP-сервера

```bash
# Через локальный файл переменных окружения:
node --env-file=.env dist/index.js

# Или с прямой передачей токена:
WEEEK_API_TOKEN=your_token_here node dist/index.js
```

### 3. Подключение к Claude Desktop / Cursor / Hermes

В конфигурационном файле MCP клиента:

```json
{
  "mcpServers": {
    "weeek": {
      "command": "node",
      "args": ["/path/to/weeek-mcp/dist/index.js"],
      "env": {
        "WEEEK_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

---

## Доступные инструменты (27 инструментов)

### Задачи (Tasks)
- `weeek_create_task` — создание задачи по названиям проекта/колонки/исполнителя или ID.
- `weeek_create_tasks` — пакетное создание задач.
- `weeek_get_task` — получение детальной информации о задаче.
- `weeek_list_tasks` — поиск и фильтрация задач.
- `weeek_update_task` — обновление полей задачи, дедлайнов и приоритетов.
- `weeek_set_task_status` — перемещение задачи в существующую колонку доски.
- `weeek_complete_task` — закрытие или повторное открытие задачи.
- `weeek_delete_task` — безвозвратное удаление задачи (`confirm: true`).
- `weeek_set_task_parent` — привязка подзадачи к родительской задаче или отсоединение.
- `weeek_change_task_assignees` — добавление/удаление ответственных по имени или ID.
- `weeek_add_task_comment` — добавление комментария в Markdown.
- `weeek_list_task_comments` — пагинированное чтение комментариев задачи.
- `weeek_attach_file` — прикрепление локального файла (в рамках разрешённой директории).
- `weeek_get_attachment` — безопасное чтение вложения.

### CRM
- `weeek_list_funnels` — список воронок продаж.
- `weeek_list_funnel_statuses` — список этапов выбранной воронки.
- `weeek_create_deal` — создание сделки в выбранной воронке и этапе (`confirm: true`).
- `weeek_get_deal` — получение карточки сделки.
- `weeek_list_deals` — список сделок на этапе с пагинацией.
- `weeek_update_deal` — обновление полей сделки, суммы и статуса победы/архива.
- `weeek_set_deal_status` — перенос сделки на другой этап воронки.
- `weeek_crm_summary` — сводный аналитический отчёт по воронке (количество, суммы, распределение).

### Служебные и справочники
- `weeek_version` — имя и версия MCP-сервера.
- `weeek_list_projects` — список доступных проектов.
- `weeek_list_task_statuses` — список досок и колонок проекта.
- `weeek_list_members` — список участников пространства.

---

## Лицензия

MIT License. Исходный код базируется на репозитории [IlyaIvanchikov/weeek-mcp](https://github.com/IlyaIvanchikov/weeek-mcp).
