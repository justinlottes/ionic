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

		cur.execute(sql, (name, username))
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

	#sql = """SELECT id, name FROM users WHERE username=%s"""
	sql = """SELECT id, name FROM users"""
	
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
	names = None
	sql = """
		SELECT name 
		FROM rooms 
		ORDER BY 
			(SELECT MAX(createdAt) FROM messages LEFT JOIN rooms as rooms1 ON messages.roomId = rooms1.id WHERE rooms1.name = name) DESC;
	"""


	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql)
		names = [item for item, in cur]

		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('getRoomsErr', err)
		names = None
	finally:
		if conn is not None:
			conn.close()

	return names

def postMessage(room, username, message):
	id = None
	sql = """
		INSERT INTO messages(roomId, userId, message)
			VALUES(
				(SELECT id from rooms WHERE name=%s),
				(SELECT id from users WHERE username=%s),
				%s)
		RETURNING id;
	"""

	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql, (room, username, message,))
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

def getMessages(room):
	messages = None
	sql = """
		SELECT users.username, messages.message, messages.createdAt 
		FROM messages 
			LEFT JOIN users ON messages.userId = users.id
			LEFT JOIN rooms ON messages.roomId = rooms.id
		WHERE rooms.name=%s
		ORDER BY createdAt DESC;
	"""

	try:
		conn = createConnection()
		cur = conn.cursor()

		cur.execute(sql, (room,))
		messages = [{'username': username, 'message': message, 'createdAt': createdAt} for username, message, createdAt in cur]

		cur.close()
	except (Exception, psycopg2.DatabaseError) as err:
		print('getMessagesErr', err)
		messages = None
	finally:
		if conn is not None:
			conn.close()

	return messages



