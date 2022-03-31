from flask import Flask, jsonify, request
from flask_cors import CORS
from .persistance import *

initPersistance()

app = Flask(__name__)
CORS(app)
app.url_map.strict_slashes = False

@app.errorhandler(404)
def resource_not_found(err):
  return jsonify(error=str(err)), 404


@app.route('/ping', methods=['GET', 'POST'])
def ping():
  return "pong", 200

@app.route('/registration/register', methods=['POST'])
def registerEP():
  data = request.get_json()
  id = createUser(data.get("name"), data.get("username"))

  if id is None:
    return jsonify(
      err='invalid_username'
    ), 400
  else:
    return jsonify(
      id = id,
      name = data.get("name"),
      username = data.get("username"),
  ), 201

@app.route('/auth/login', methods=['POST'])
def loginEP():
  data = request.get_json()
  id, name, conn = getUser(data.get("username"))

  if id is None:
    return jsonify(
      err='invalid_credentials',
    ), 401
  else:
    return jsonify(
      id = id,
      name = name,
      username = data.get('username')
  ), 200

@app.route('/room', methods=['POST'])
def createRoomEP():
  data = request.get_json()
  id = createRoom(data.get("name"))

  if id is None:
    return jsonify(
      err='invalid_room_name',
    ), 400
  else:
    return jsonify(
      id = id,
      name = data.get("name")
    ), 201

@app.route('/room', methods=['GET'])
def getRoomsEP():
  rooms = getRooms(0, 0)
  return jsonify(
    rooms = rooms
  ), 200

@app.route('/message', methods=['GET'])
def getLatestMessagesEP():
  messages = getLatestMessages()
  return jsonify(
    messages = messages
  ), 200

@app.route('/user', methods=['GET'])
def getUsersEP():
  userIds = request.args.get('userIds')
  users = []
  if userIds is not None:
    users = getUsers(userIds)

  if(users is None):
    return jsonify(
      err = 'userIdsInvalid'
    ), 400
  else:
    return jsonify(
      users = users
    ), 200

@app.route('/room/<roomId>/message', methods=['POST'])
def createMessageEP(roomId):
  username = request.headers.get('Fake-Authorization')
  print(request.headers)
  data = request.get_json()

  id = postMessage(roomId, username, data.get('message'))
  if id is None:
    return jsonify(
      err = 'createMessage_failed'
    ), 400
  else:
    return jsonify(
      id = id
  ), 200

@app.route('/room/<roomId>/message', methods=['GET'])
def getMessagesEP(roomId):
  return jsonify(
    messages = getMessages(roomId)
  ), 200
