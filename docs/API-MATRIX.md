# Соответствие API WEEEK и нашего MCP

Снимок контракта и карта реализации. implemented не означает полную поддержку всех полей или живую проверку. partial включает внутренние вызовы для разрешения имён.

| Метод | Путь | API-сценарий | MCP | Покрытие | Тесты | Live | Ограничения |
|---|---|---|---|---|---|---|---|
| GET | /user/me | Get profile | — | not_implemented | — | нет |  |
| GET | /ws | Get workspace | — | not_implemented | — | нет |  |
| GET | /ws/members | Get workspace members | weeek_change_task_assignees, weeek_create_task, weeek_create_tasks, weeek_list_members | implemented | tests/reads.test.ts, tests/task-workflows.test.ts | да | Чтение в рамках существующих MCP-сценариев; наличие в карте не означает отдельный инструмент для всех API-фильтров.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| GET | /ws/tags | Get tags | — | not_implemented | — | нет |  |
| POST | /ws/tags | Create tag | — | not_implemented | — | нет |  |
| GET | /ws/tags/{id} | Get tag | — | not_implemented | — | нет |  |
| PUT | /ws/tags/{id} | Update tag | — | not_implemented | — | нет |  |
| DELETE | /ws/tags/{id} | Delete tag | — | not_implemented | — | нет |  |
| GET | /tm/custom-fields | Get global custom fields | — | not_implemented | — | нет |  |
| POST | /tm/custom-fields | Create global custom field | — | not_implemented | — | нет |  |
| PUT | /tm/custom-fields/{id} | Update global custom field | — | not_implemented | — | нет |  |
| DELETE | /tm/custom-fields/{id} | Delete global custom field | — | not_implemented | — | нет |  |
| POST | /tm/custom-fields/{id}/transfer-to-project | Transfer global custom field to project | — | not_implemented | — | нет |  |
| POST | /tm/custom-fields/{id}/transfer-to-board | Transfer global custom field to board | — | not_implemented | — | нет |  |
| POST | /tm/custom-fields/{custom_field_id}/options | Create global custom field option | — | not_implemented | — | нет |  |
| PUT | /tm/custom-fields/{custom_field_id}/options/{id} | Update global custom field option | — | not_implemented | — | нет |  |
| DELETE | /tm/custom-fields/{custom_field_id}/options/{id} | Delete global custom field option | — | not_implemented | — | нет |  |
| POST | /tm/custom-fields/{custom_field_id}/options/{id}/move | Move global custom field option | — | not_implemented | — | нет |  |
| GET | /tm/portfolios | Get portfolios | — | not_implemented | — | нет |  |
| POST | /tm/portfolios | Create portfolio | — | not_implemented | — | нет |  |
| GET | /tm/portfolios/{id} | Get portfolio | — | not_implemented | — | нет |  |
| PUT | /tm/portfolios/{id} | Update portfolio | — | not_implemented | — | нет |  |
| DELETE | /tm/portfolios/{id} | Delete portfolio | — | not_implemented | — | нет |  |
| GET | /tm/projects | Get projects | weeek_create_task, weeek_create_tasks, weeek_list_projects, weeek_list_task_statuses, weeek_set_task_status | implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | да | Чтение в рамках существующих MCP-сценариев; наличие в карте не означает отдельный инструмент для всех API-фильтров.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /tm/projects | Create project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| GET | /tm/projects/{id} | Get project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/projects/{id} | Update project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/projects/{id} | Delete project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{id}/archive | Archive project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{id}/un-archive | Unarchive project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{project_id}/custom-fields | Create a custom field | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/projects/{project_id}/custom-fields/{id} | Update a custom field | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/projects/{project_id}/custom-fields/{id} | Delete a custom field | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{project_id}/custom-fields/{id}/transfer-to-task-manager | Transfer custom field to task manager | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{project_id}/custom-fields/{id}/transfer-to-project | Transfer custom field to project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{project_id}/custom-fields/{id}/transfer-to-board | Transfer custom field to board | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{project_id}/custom-fields/{custom_field_id}/options | Create a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/projects/{project_id}/custom-fields/{custom_field_id}/options/{id} | Update a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/projects/{project_id}/custom-fields/{custom_field_id}/options/{id} | Delete a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/projects/{project_id}/custom-fields/{custom_field_id}/options/{id}/move | Move a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| GET | /tm/boards | Get boards | weeek_create_task, weeek_create_tasks, weeek_list_task_statuses, weeek_set_task_status | implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | да | Чтение в рамках существующих MCP-сценариев; наличие в карте не означает отдельный инструмент для всех API-фильтров.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /tm/boards | Create board | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/boards/{id} | Update board | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/boards/{id} | Delete board | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/boards/{id}/move | Move board | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/boards/{board_id}/custom-fields | Create a custom field | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/boards/{board_id}/custom-fields/{id} | Update a custom field | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/boards/{board_id}/custom-fields/{id} | Delete a custom field | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/boards/{board_id}/custom-fields/{id}/transfer-to-task-manager | Transfer custom field to task manager | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/boards/{board_id}/custom-fields/{id}/transfer-to-project | Transfer custom field to project | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/boards/{board_id}/custom-fields/{id}/transfer-to-board | Transfer custom field to board | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/boards/{board_id}/custom-fields/{custom_field_id}/options | Create a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/boards/{board_id}/custom-fields/{custom_field_id}/options/{id} | Update a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/boards/{board_id}/custom-fields/{custom_field_id}/options/{id} | Delete a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/boards/{board_id}/custom-fields/{custom_field_id}/options/{id}/move | Move a custom field option | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| GET | /tm/board-columns | Get board column list | weeek_create_task, weeek_create_tasks, weeek_list_task_statuses, weeek_move_task, weeek_set_task_status | implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | да | Чтение в рамках существующих MCP-сценариев; наличие в карте не означает отдельный инструмент для всех API-фильтров.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /tm/board-columns | Create board column | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/board-columns/{id} | Update board column | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/board-columns/{id} | Delete board column | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/board-columns/{id}/move | Move board column | — | not_implemented | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| GET | /tm/tasks | Get tasks | weeek_list_tasks | implemented | tests/reads.test.ts | нет |  |
| POST | /tm/tasks | Create task | weeek_create_task, weeek_create_tasks | partial | tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/writes.test.ts | да | Выставлены поддерживаемые поля. Не все поля API доступны; ограничения на диапазоны дат зависят от аккаунта. Замена описания существующей задачи не предоставляется.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| GET | /tm/tasks/{id} | Get task | weeek_add_task_comment, weeek_change_task_assignees, weeek_complete_task, weeek_create_task, weeek_create_tasks, weeek_get_task, weeek_move_task, weeek_set_task_parent, weeek_set_task_status, weeek_update_task | implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| PUT | /tm/tasks/{id} | Update a task | weeek_create_task, weeek_create_tasks, weeek_update_task | partial | tests/task-fields.test.ts, tests/task-schedule.test.ts | да | Выставлены поддерживаемые поля. Не все поля API доступны; ограничения на диапазоны дат зависят от аккаунта. Замена описания существующей задачи не предоставляется.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| DELETE | /tm/tasks/{id} | Delete task | weeek_delete_task | implemented | tests/writes.test.ts | нет |  |
| POST | /tm/tasks/{id}/complete | Complete task | weeek_complete_task | implemented | tests/writes.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /tm/tasks/{id}/un-complete | Un complete task | weeek_complete_task | implemented | tests/writes.test.ts | нет |  |
| POST | /tm/tasks/{id}/board | Change board | weeek_move_task, weeek_set_task_status | implemented | tests/task-workflows.test.ts, tests/writes.test.ts | нет | set_task_status вызывает board только при переходе на другую доску; board-column задаёт существующую колонку. Старый move_task выключен в allowlist. |
| POST | /tm/tasks/{id}/board-column | Change board column | weeek_move_task, weeek_set_task_status | implemented | tests/task-workflows.test.ts, tests/writes.test.ts | да | set_task_status вызывает board только при переходе на другую доску; board-column задаёт существующую колонку. Старый move_task выключен в allowlist.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /tm/tasks/{task_id}/locations | Add a task to a project | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/tasks/{task_id}/locations | Remove a task from a project | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/tasks/{task_id}/attachments | Upload attachments | weeek_attach_file | implemented | tests/attach.test.ts | нет |  |
| POST | /tm/tasks/{task_id}/watchers | Add watchers to a task | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/tasks/{task_id}/watchers | Remove watchers from a task | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/tasks/{id}/start-timer | Start task timer | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/tasks/{id}/stop-timer | Stop task timer | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/tasks/{task_id}/time-entries | Create a time entry | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| PUT | /tm/tasks/{task_id}/time-entries/{time_entry_id} | Update a time entry | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| DELETE | /tm/tasks/{task_id}/time-entries/{time_entry_id} | Delete a time entry | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| POST | /tm/tasks/{taskId}/assignees | Add assignees | weeek_change_task_assignees | implemented | tests/task-workflows.test.ts | да | Добавление/удаление участников по точному имени или ID; проверка результата чтением.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| DELETE | /tm/tasks/{taskId}/assignees | Remove assignee | weeek_change_task_assignees | implemented | tests/task-workflows.test.ts | нет | Добавление/удаление участников по точному имени или ID; проверка результата чтением. |
| POST | /tm/tasks/{taskId}/parent | Change task parent | weeek_set_task_parent | implemented | tests/task-workflows.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| GET | /tm/tasks/{taskId}/comments | Get task comments | weeek_add_task_comment, weeek_list_task_comments | implemented | tests/task-workflows.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /tm/tasks/{taskId}/comments | Create task comment | weeek_add_task_comment | implemented | tests/task-workflows.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| DELETE | /tm/tasks/{taskId}/comments/{commentId} | Delete task comment | — | not_implemented | tests/reads.test.ts, tests/task-fields.test.ts, tests/task-schedule.test.ts, tests/task-workflows.test.ts, tests/writes.test.ts | нет |  |
| GET | /crm/funnels | Get all funnels | weeek_create_deal, weeek_crm_summary, weeek_list_deals, weeek_list_funnel_statuses, weeek_list_funnels | implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Есть отдельное чтение воронок. Другие инструменты читают их для проверки области и разрешения имён.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /crm/funnels | Create a funnel | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| GET | /crm/funnels/{id} | Get a funnel | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| PUT | /crm/funnels/{id} | Update a funnel | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/funnels/{id} | Delete a funnel | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/funnels/{funnel_id}/custom-fields | Create a custom field | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/funnels/{funnel_id}/custom-fields/{id} | Update a custom field | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/funnels/{funnel_id}/custom-fields/{id} | Delete a custom field | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/funnels/{funnel_id}/custom-fields/{id}/move | Move a custom field | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/funnels/{funnel_id}/custom-fields/{custom_field_id}/options | Create a custom field option | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/funnels/{funnel_id}/custom-fields/{custom_field_id}/options/{id} | Update a custom field option | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/funnels/{funnel_id}/custom-fields/{custom_field_id}/options/{id} | Delete a custom field option | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/funnels/{funnel_id}/custom-fields/{custom_field_id}/options/{id}/move | Move a custom field option | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /crm/funnels/{funnelId}/statuses | Get all funnel statuses | weeek_create_deal, weeek_crm_summary, weeek_list_deals, weeek_list_funnel_statuses, weeek_set_deal_status | implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Используется для разрешения имени/ID или проверки контекста; не является отдельным бизнес-сценарием операции.,Внутреннее чтение для разрешения имени/ID или проверки контекста; само по себе не отдельный бизнес-сценарий.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /crm/funnels/{funnelId}/statuses | Create a funnel status | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| GET | /crm/statuses/{id} | Get a funnel status | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| PUT | /crm/statuses/{id} | Update a funnel status | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/statuses/{id} | Delete a funnel status | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /crm/statuses/{statusId}/deals | Get all deals | weeek_crm_summary, weeek_list_deals | implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /crm/statuses/{statusId}/deals | Create a deal | weeek_create_deal | implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| GET | /crm/deals/{id} | Get a deal | weeek_create_deal, weeek_get_deal, weeek_set_deal_status, weeek_update_deal | implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Чтение сделки и проверка результата записи.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| PUT | /crm/deals/{id} | Update a deal | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PATCH | /crm/deals/{id} | Update a deal fields | weeek_update_deal | partial | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Доступны title, amount, winStatus, customFields. description не выставлен: API игнорировал его в живом тесте.,Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| DELETE | /crm/deals/{id} | Delete a deal | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/deals/{id}/move | Move a deal | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/deals/{id}/funnel | Update the deal funnel | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/deals/{id}/status | Update the deal funnel status | weeek_set_deal_status | implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | да | Live означает проверку хотя бы одного сценария/набора полей, не всех вариантов API. |
| POST | /crm/deals/{dealId}/assignees | Attach an assignee | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/deals/{dealId}/assignees | Detach an assignee | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/deals/{dealId}/contacts | Attach a contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/deals/{dealId}/contacts | Detach a contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/deals/{dealId}/organizations | Attach an organization | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/deals/{dealId}/organizations | Detach an organization | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/deals/{dealId}/tags | Attach a tag | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/deals/{dealId}/tags | Detach a tag | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/deals/{id}/tasks | Attach a new task | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/deals/{id}/tasks/{taskId}/move | Move a attached to the deal task | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/deals/{id}/tasks/{taskId} | Detach a task | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/deals/{deal_id}/attachments | Upload attachments | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /crm/organizations | Get all organizations | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/organizations | Create an organization | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /crm/organizations/{id} | Get an organization | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/organizations/{id} | Update an organization | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/organizations/{id} | Delete an organization | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/organizations/{organizationId}/addresses | Create an address | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/organizations/{organizationId}/addresses/{addressId} | Update the address | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/organizations/{organizationId}/addresses/{addressId} | Delete the address | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/organizations/{organizationId}/emails | Create an email | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/organizations/{organizationId}/emails/{emailId} | Update the email | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/organizations/{organizationId}/emails/{emailId} | Delete the email | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/organizations/{organizationId}/phones | Create a phone | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/organizations/{organizationId}/phones/{phoneId} | Update the phone | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/organizations/{organizationId}/phones/{phoneId} | Delete the phone | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/organizations/{organizationId}/contacts | Attach a contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/organizations/{organizationId}/contacts | Detach the contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/organizations/{organizationId}/tags | Attach a tag | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/organizations/{organizationId}/tags | Detach the tag | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /crm/currencies | Get all currencies | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /crm/contacts | Get all contacts | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/contacts | Create a contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /crm/contacts/{id} | Get a contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/contacts/{id} | Update a contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/contacts/{id} | Delete a contact | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/contacts/{contactId}/emails | Create an email | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/contacts/{contactId}/emails/{emailId} | Update the email | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/contacts/{contactId}/emails/{emailId} | Delete the email | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/contacts/{contactId}/phones | Create a phone | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| PUT | /crm/contacts/{contactId}/phones/{phoneId} | Update the phone | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/contacts/{contactId}/phones/{phoneId} | Delete the phone | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| POST | /crm/contacts/{contactId}/tags | Attach a tag | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| DELETE | /crm/contacts/{contactId}/tags | Detach the tag | — | not_implemented | tests/crm-workflows.test.ts, tests/crm.test.ts | нет |  |
| GET | /ws/attachments/{file_id} | Get an attachment | weeek_get_attachment | implemented | tests/attach.test.ts, tests/client.test.ts, tests/reads.test.ts | нет |  |
