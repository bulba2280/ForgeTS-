# FTS (ForgeTS)

Лёгкий self-hosted Git сервер на TypeScript. 

## Возможности

- Регистрация и логин с токенами
- Создание репозиториев
- Просмотр списка репозиториев
- Просмотр файлов в репозитории
- CLI клиент для удобной работы

## Установка

```bash
git clone https://github.com/bulba2280/fts.git
cd fts
npm install
npm run build
```

# Запуск сервера
```bash
node server.js
```
# CLI client 
```bash
# Регистрация
node cli.js register username email password

# Логин
node cli.js login username password

# Создать репозиторий
node cli.js init repo-name "Описание"

# Список репозиториев
node cli.js list

# Файлы в репозитории
node cli.js files repo-name

# Содержимое файла
node cli.js file repo-name path/to/file.js
```

# Технологии
- TS (TypeScript)
- Express
- json

# автор
mr.bulba

