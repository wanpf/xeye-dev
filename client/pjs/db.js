((
  db = sqlite('pipy.db')
) => (

  db.exec(
    `SELECT * FROM sqlite_schema WHERE type = 'table' AND name = 'pipy'`
  ).length === 0 && (
    db.exec(`
      CREATE TABLE pipy (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        scheme TEXT NOT NULL,
        request_time TIMESTAMP DEFAULT (datetime('now','localtime')),
        response_time INTEGER NOT NULL DEFAULT 0,
        response_code INTEGER NOT NULL DEFAULT 0,
        client_ip VARCHAR(40),
        host TEXT NOT NULL,
        url TEXT NOT NULL,
        user_agent TEXT,
        request_head TEXT,
        request_body BLOB,
        response_head TEXT,
        response_body BLOB,
        request_size INTEGER NOT NULL DEFAULT 0,
        response_size INTEGER NOT NULL DEFAULT 0,
        infos TEXT DEFAULT '' NOT NULL
      )
    `),
    db.exec(`
      CREATE TABLE log (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        create_time TIMESTAMP DEFAULT (datetime('now','localtime')),
        name VARCHAR(100),
        action TEXT NOT NULL,
        remark TEXT NOT NULL,
        infos TEXT DEFAULT '' NOT NULL
      )
    `)
  ),

  {

    insert_pipy_db: (scheme, client_ip, host, url, user_agent) => (
      db.sql(
        `INSERT INTO pipy (scheme, client_ip, host, url, user_agent) VALUES (?, ?, ?, ?, ?)`
      )
      .bind(1, scheme)
      .bind(2, client_ip)
      .bind(3, host)
      .bind(4, url)
      .bind(5, user_agent)
      .exec(),
      db.sql(
        `SELECT * FROM pipy WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    update_pipy_db: (id, response_time, response_code, request_head, request_body, response_head, response_body, request_size, response_size, infos) => (
      !request_head ? (
        db.sql(
          `UPDATE pipy SET response_time = ?, response_code = ?, request_size = ?, response_size = ? WHERE id = ?`
        )
        .bind(1, response_time)
        .bind(2, response_code)
        .bind(3, request_size)
        .bind(4, response_size)
        .bind(5, id)
        .exec(),
        db.sql(
          `SELECT * FROM pipy WHERE id = ${id}`
        )
        .exec()[0]
      ) : (
        db.sql(
          `UPDATE pipy SET response_time = ?, response_code = ?, request_head = ?, request_body = ?, response_head = ?, response_body = ?, request_size = ?, response_size = ?, infos = ? WHERE id = ?`
        )
        .bind(1, response_time)
        .bind(2, response_code)
        .bind(3, request_head)
        .bind(4, request_body)
        .bind(5, response_head)
        .bind(6, response_body)
        .bind(7, request_size)
        .bind(8, response_size)
        .bind(9, infos)
        .bind(10, id)
        .exec(),
        db.sql(
          `SELECT * FROM pipy WHERE id = ${id}`
        )
        .exec()[0]
      )
    ),

    insert_replay_pipy_db: (scheme, client_ip, host, url, user_agent, response_time, response_code, request_head, request_body, response_head, response_body, request_size, response_size, infos) => (
      db.sql(
        `INSERT INTO pipy (scheme, client_ip, host, url, user_agent, response_time, response_code, request_head, request_body, response_head, response_body, request_size, response_size, infos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(1, scheme)
      .bind(2, client_ip)
      .bind(3, host)
      .bind(4, url)
      .bind(5, user_agent)
      .bind(6, response_time)
      .bind(7, response_code)
      .bind(8, request_head)
      .bind(9, request_body)
      .bind(10, response_head)
      .bind(11, response_body)
      .bind(12, request_size)
      .bind(13, response_size)
      .bind(14, infos)
      .exec(),
      db.sql(
        `SELECT * FROM pipy WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    insert_log_db: (name, action, remark) => (
      db.sql(
        `INSERT INTO log (name, action, remark) VALUES (?, ?, ?)`
      )
      .bind(1, name)
      .bind(2, action)
      .bind(3, remark)
      .exec(),
      db.sql(
        `SELECT * FROM log WHERE id = last_insert_rowid()`
      )
      .exec()[0]
    ),

    select_log_proxy: () => (
      db.sql(
        `select * from log where id = (select max(id) from log where action='proxy')`
      )
      .exec()[0]
    ),

  }

))()