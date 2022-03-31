import os
import psycopg2

def createConnection():
#https://www.digitalocean.com/community/tutorials/how-to-use-a-postgresql-database-in-a-flask-application
	conn = psycopg2.connect(
		host=os.environ['POSTGRES_host'],
		database='chat_app',#GET FROM ENVIRON
		user=os.environ['POSTGRES_USER'],
		password=os.environ['POSTGRES_PASSWORD'])

	return conn

def initPersistance():
	conn = None;

	try:
		conn = createConnection()
		cur = conn.cursor()
		fd = open('migrations/db_init.sql')
		sqlFile = fd.read()
		fd.close()

#https://stackoverflow.com/questions/19472922/reading-external-sql-script-in-python
		sqlCommands = sqlFile.split(';')

		for command in sqlCommands:
			cur.execute(command)

		conn.commit()
		cur.close()
	except (Exception, psycopg2.DatabaseError, psycopg2.OperationalError) as err:
		print ("initErr: ", err)
	finally:
		if conn is not None:
			conn.close()

def createUser(name, username):
	id = None
	conn = None
	sql = """INSERT INTO users(name, username)
				VALUES(%s, %s) RETURNING id;"""
	
	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql, (name, username, ))
		id = cur.fetchone()[0]
		
		conn.commit()
		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('createErr', err)
		id = None
	finally:
		if conn is not None:
			conn.close()

	return id

def getUser(username):
	id = None
	name = None
	conn = None

	sql = """SELECT id, name FROM users WHERE username=%s"""
	
	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql, (username,))
		row = cur.fetchone()
		id = row[0]
		name = row[1]
	except (Exception, psycopg2.DatabaseError) as err:
		print('getUserErr', err)
		id = None
	finally:
		if conn is not None:
			conn.close()

	return id, name, username

def createRoom(name):
	id = None
	sql = """
		INSERT INTO rooms(name) VALUES(%s) RETURNING id;
	"""

	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql, (name,))
		id = cur.fetchone()[0]
		
		conn.commit()
		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('createRoomErr', err)
		id = None
	finally:
		if conn is not None:
			conn.close()

	return id

def getRooms(limit, offset):
	rooms = None
	sql = """
		SELECT id, name
		FROM rooms as rooms1 
		ORDER BY 
			(SELECT MAX(createdAt) FROM messages LEFT JOIN rooms as rooms2 ON messages.roomId = rooms2.id WHERE rooms1.id = rooms2.id) DESC;
	"""


	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql)
		rooms = [{'id': id, 'name': name} for id, name in cur]

		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('getRoomsErr', err)
		rooms = None
	finally:
		if conn is not None:
			conn.close()

	return rooms

def postMessage(roomId, username, message):
	id = None
	sql = """
		INSERT INTO messages(roomId, userId, message)
			VALUES(
				%s,
				(SELECT id from users WHERE username=%s),
				%s)
		RETURNING id;
	"""


	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql, (roomId, username, message,))
		id = cur.fetchone()[0]

		conn.commit()
		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('createMessageErr', err)
		id = None
	finally:
		if conn is not None:
			conn.close()

	return id

def getMessages(roomId):
	messages = None
	sql = """
		SELECT id, userId, message, createdAt
		FROM messages
		WHERE roomId = %s
		ORDER BY createdAt DESC
		LIMIT 50
	"""

	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql, (roomId,))
		messages = [{'id': id, 'userId': userId, 'message': message, 'createdAt': createdAt} for id, userId, message, createdAt in cur]

		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('getMessagesErr', err)
		messages = None
	finally:
		if conn is not None:
			conn.close()

	return messages

def getLatestMessages():
  messages = None
  sql = """
    SELECT m.id, m.userId, m.roomId, m.message, m.createdAt
    FROM (SELECT r.*, DENSE_RANK() OVER
      (PARTITION BY r.roomId ORDER BY r.createdAt DESC) as pos
      FROM messages as r) as m
    WHERE m.pos = 1
  """

  try:
    conn = createConnection()
    cur = conn.cursor()

    cur.execute(sql)
    messages = [{'id': id, 'userId': userId, 'roomId': roomId, 'message': message, 'createdAt': createdAt} 
        for id, userId, roomId, message, createdAt in cur]

    cur.close()
  except (Exception, psycopg2.DatabaseError) as err:
    print('getMessagesErr', err)
    messages = None
  finally:
    if conn is not None:
      conn.close()

  return messages


def getUsers(userIds):
	users = None
	sql = """
		SELECT id, username, name 
		FROM users 
		WHERE id IN %s
	"""

	try:
		conn = createConnection()
		cur = conn.cursor()

		print('userIds', tuple(userIds), 'test')

		cur.execute(sql, (tuple(userIds), ))
		users = [{'id': id, 'username': username, 'name': name} for id, username, name in cur]

		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('getMessagesErr', err)
		users = None
	finally:
		if conn is not None:
			conn.close()

	return users



